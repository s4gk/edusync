import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { userId };

    const [data, total, unread] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit), unread } };
  }

  async markRead(id: string, userId: string) {
    const n = await this.prisma.notification.findUnique({ where: { id } });
    if (!n) throw new NotFoundException('Notificación no encontrada');
    if (n.userId !== userId) throw new NotFoundException('Notificación no encontrada');
    return this.prisma.notification.update({ where: { id }, data: { isRead: true } });
  }

  async markAllRead(userId: string) {
    const { count } = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { updated: count };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({ where: { userId, isRead: false } });
    return { count };
  }

  async deleteOne(id: string, userId: string) {
    const n = await this.prisma.notification.findUnique({ where: { id } });
    if (!n || n.userId !== userId) throw new NotFoundException('Notificación no encontrada');
    return this.prisma.notification.delete({ where: { id } });
  }

  /**
   * Motor de alertas (on-demand): escanea el estado académico y de convivencia y
   * crea notificaciones in-app para el acudiente principal. Evita duplicar avisos
   * idénticos creados en las últimas 24h. Puede agendarse luego con un cron.
   */
  async runAlerts() {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let created = 0;

    const emit = async (userId: string, title: string, body: string) => {
      const dupe = await this.prisma.notification.findFirst({
        where: { userId, title, body, createdAt: { gte: since } },
      });
      if (dupe) return;
      await this.prisma.notification.create({ data: { userId, title, body } });
      created += 1;
    };

    // 1) Áreas en BAJO → alerta académica al acudiente principal.
    const bajos = await this.prisma.gradeRecord.findMany({
      where: { scale: 'BAJO' },
      select: {
        studentId: true,
        subject: { select: { name: true } },
        student: {
          select: {
            user: { select: { firstName: true, lastName: true } },
            guardians: { where: { isPrimary: true }, select: { guardian: { select: { userId: true } } } },
          },
        },
      },
    });
    const byStudent = new Map<string, { guardianUserId?: string; name: string; subjects: Set<string> }>();
    for (const r of bajos) {
      const e = byStudent.get(r.studentId) ?? {
        guardianUserId: r.student.guardians[0]?.guardian.userId,
        name: `${r.student.user.firstName} ${r.student.user.lastName}`,
        subjects: new Set<string>(),
      };
      e.subjects.add(r.subject.name);
      byStudent.set(r.studentId, e);
    }
    for (const [, e] of byStudent) {
      if (!e.guardianUserId) continue;
      const list = [...e.subjects];
      await emit(
        e.guardianUserId,
        'Alerta académica',
        `${e.name} tiene ${list.length} área(s) en desempeño bajo: ${list.join(', ')}. Te sugerimos coordinar un plan de apoyo.`,
      );
    }

    // 2) Inasistencia alta (>25% de fallas) → alerta de asistencia.
    const att = await this.prisma.attendance.groupBy({ by: ['studentId'], _count: { id: true } });
    const absent = await this.prisma.attendance.groupBy({
      by: ['studentId'],
      _count: { id: true },
      where: { status: { in: ['ABSENT', 'LATE'] } },
    });
    const totalMap = new Map(att.map((a) => [a.studentId, a._count.id]));
    for (const a of absent) {
      const total = totalMap.get(a.studentId) ?? 0;
      if (total > 0 && a._count.id / total > 0.25) {
        const st = await this.prisma.student.findUnique({
          where: { id: a.studentId },
          select: {
            user: { select: { firstName: true, lastName: true } },
            guardians: { where: { isPrimary: true }, select: { guardian: { select: { userId: true } } } },
          },
        });
        const gid = st?.guardians[0]?.guardian.userId;
        if (gid) {
          const pct = Math.round((a._count.id / total) * 100);
          await emit(gid, 'Alerta de asistencia', `${st!.user.firstName} ${st!.user.lastName} registra ${pct}% de inasistencias/retardos. Por favor comunícate con el colegio.`);
        }
      }
    }

    return { created };
  }
}
