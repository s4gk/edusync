import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterAttendanceDto, QueryAttendanceDto } from './dto/attendance.dto';
import { teacherScope, type ReqUser } from '../../common/scope.util';

const ABSENCE_THRESHOLD = 0.25;

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  // RF-ASIS-01/02: Registro batch de asistencia por clase
  async register(dto: RegisterAttendanceDto, teacherUserId: string, roles: string[] = []) {
    const subject = await this.prisma.subject.findUnique({
      where: { id: dto.subjectId },
      include: { teacher: true },
    });
    if (!subject) throw new NotFoundException('Materia no encontrada');
    // El profesor asignado siempre puede; coordinación/rectoría/admin también (soporte).
    const privileged = ['SUPER_ADMIN', 'RECTOR', 'COORDINATOR_ACADEMIC'].some((r) => roles.includes(r));
    if (subject.teacher.userId !== teacherUserId && !privileged) {
      throw new ForbiddenException('Solo el profesor asignado puede registrar asistencia');
    }

    const date = new Date(dto.date);

    const results = await this.prisma.$transaction(
      dto.entries.map((e) =>
        this.prisma.attendance.upsert({
          where: { studentId_subjectId_date: { studentId: e.studentId, subjectId: dto.subjectId, date } },
          create: { studentId: e.studentId, subjectId: dto.subjectId, date, status: e.status as any, notes: e.notes },
          update: { status: e.status as any, notes: e.notes },
        }),
      ),
    );

    // RF-ASIS-06: alerta por cada falta registrada
    for (const e of dto.entries) {
      if (e.status === 'ABSENT' || e.status === 'LATE' || e.status === 'EVASION') {
        await this.checkAbsenceThreshold(e.studentId, dto.subjectId);
      }
    }

    return results;
  }

  // RF-ASIS-05: % de asistencia por materia
  async getStudentStats(studentId: string, subjectId: string) {
    const records = await this.prisma.attendance.findMany({ where: { studentId, subjectId } });
    const total = records.length;
    if (!total) return { total: 0, percentage: 100, atRisk: false };

    const absent = records.filter((r) => r.status === 'ABSENT').length;
    const late = records.filter((r) => r.status === 'LATE').length;
    const excused = records.filter((r) => r.status === 'EXCUSED').length;
    const permission = records.filter((r) => r.status === 'PERMISSION').length;
    const evasion = records.filter((r) => r.status === 'EVASION').length;
    const present = records.filter((r) => r.status === 'PRESENT').length;

    // Evasión cuenta como falta completa (el estudiante evadió la clase).
    const effectiveAbsences = absent + evasion + late * 0.5;
    const percentage = Math.round(((total - effectiveAbsences) / total) * 100);

    return { total, present, absent, late, excused, permission, evasion, effectiveAbsences, percentage, atRisk: percentage < 75 };
  }

  // RF-ASIS-07: reporte por grupo/materia
  async findAll(query: QueryAttendanceDto, user?: ReqUser) {
    const { studentId, subjectId, gradeGroupId, from, to, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (subjectId) where.subjectId = subjectId;
    if (gradeGroupId) where.subject = { gradeGroupId };
    // Un profesor solo ve la asistencia de SUS materias.
    const teacherId = await teacherScope(this.prisma, user);
    if (teacherId) where.subject = { ...(where.subject ?? {}), teacherId };
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          student: { include: { user: { select: { firstName: true, lastName: true } } } },
          subject: { select: { name: true, gradeGroup: { select: { name: true } } } },
        },
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getGroupReport(subjectId: string, from?: string, to?: string, user?: ReqUser) {
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        gradeGroup: {
          include: { students: { include: { user: { select: { firstName: true, lastName: true } } } } },
        },
      },
    });
    if (!subject) throw new NotFoundException('Materia no encontrada');

    // Un profesor solo puede ver el reporte de SUS materias.
    const teacherId = await teacherScope(this.prisma, user);
    if (teacherId && subject.teacherId !== teacherId) {
      throw new ForbiddenException('No tiene acceso a esta materia');
    }

    const report = await Promise.all(
      subject.gradeGroup.students.map(async (s) => ({
        studentId: s.id,
        name: `${s.user.firstName} ${s.user.lastName}`,
        ...(await this.getStudentStats(s.id, subjectId)),
      })),
    );

    return {
      subject: subject.name,
      group: subject.gradeGroup.name,
      students: report.sort((a, b) => a.percentage - b.percentage),
    };
  }

  // RF-ASIS-06: verificar umbral y crear notificaciones
  private async checkAbsenceThreshold(studentId: string, subjectId: string) {
    const stats = await this.getStudentStats(studentId, subjectId);
    if (!stats.atRisk) return;

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        guardians: {
          where: { isPrimary: true },
          include: { guardian: { select: { userId: true } } },
        },
      },
    });
    if (!student) return;

    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
      select: { name: true },
    });

    const notifications: any[] = [];
    if (student.guardians[0]) {
      notifications.push({
        userId: student.guardians[0].guardian.userId,
        title: '⚠️ Alerta de asistencia',
        body: `Su acudido tiene ${stats.percentage}% de asistencia en ${subject?.name}. Riesgo de pérdida por inasistencia (>25% fallas).`,
      });
    }

    if (notifications.length) {
      await this.prisma.notification.createMany({ data: notifications, skipDuplicates: false });
    }
  }
}
