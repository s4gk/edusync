import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateObservationDto, ObservationType, QueryObservationDto } from './dto/observation.dto';
import { teacherScope, type ReqUser } from '../../common/scope.util';

const SERIOUS_TYPES = [ObservationType.DISCIPLINARY_SERIOUS, ObservationType.DISCIPLINARY_VERY_SERIOUS];

@Injectable()
export class ObservationsService {
  constructor(private readonly prisma: PrismaService) {}

  // RF-OBS-01/02: crear observación (académica o disciplinaria)
  async create(dto: CreateObservationDto, authorId: string, authorRoles: string[]) {
    const student = await this.prisma.student.findUnique({ where: { id: dto.studentId } });
    if (!student) throw new NotFoundException('Estudiante no encontrado');

    // Un profesor solo puede observar a estudiantes de sus grupos.
    const teacherId = await teacherScope(this.prisma, { id: authorId, roles: authorRoles });
    if (teacherId) {
      const owns = student.gradeGroupId
        ? await this.prisma.subject.count({ where: { gradeGroupId: student.gradeGroupId, teacherId } })
        : 0;
      if (!owns) throw new ForbiddenException('No tiene acceso a este estudiante');
    }

    // El docente puede registrar académicas y reconocimientos (positivas); las
    // observaciones disciplinarias negativas las maneja el Coordinador de Convivencia.
    const RESTRICTED = [
      ObservationType.DISCIPLINARY_NEUTRAL,
      ObservationType.DISCIPLINARY_MILD,
      ObservationType.DISCIPLINARY_SERIOUS,
      ObservationType.DISCIPLINARY_VERY_SERIOUS,
    ];
    if (
      RESTRICTED.includes(dto.type) &&
      !authorRoles.includes('COORDINATOR_CONVIVENCIA') &&
      !authorRoles.includes('RECTOR') &&
      !authorRoles.includes('SUPER_ADMIN')
    ) {
      throw new ForbiddenException('Las observaciones disciplinarias las registra el Coordinador de Convivencia.');
    }

    const observation = await this.prisma.observation.create({
      data: {
        studentId: dto.studentId,
        authorId,
        type: dto.type as any,
        content: dto.content,
      },
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    });

    // RF-OBS-04: notificar al acudiente principal en observaciones graves/gravísimas
    if (SERIOUS_TYPES.includes(dto.type)) {
      await this.notifyGuardian(dto.studentId, dto.type, dto.content);
    }

    return observation;
  }

  async findAll(query: QueryObservationDto, user?: ReqUser) {
    const { studentId, type, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (type) where.type = type;
    // Un profesor solo ve observaciones de estudiantes de sus grupos.
    const teacherId = await teacherScope(this.prisma, user);
    if (teacherId) where.student = { gradeGroup: { subjects: { some: { teacherId } } } };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.observation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          student: { include: { user: { select: { firstName: true, lastName: true } } } },
        },
      }),
      this.prisma.observation.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findByStudent(studentId: string, user?: ReqUser) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Estudiante no encontrado');

    // Un profesor solo accede a estudiantes de sus grupos.
    const teacherId = await teacherScope(this.prisma, user);
    if (teacherId) {
      const owns = student.gradeGroupId
        ? await this.prisma.subject.count({ where: { gradeGroupId: student.gradeGroupId, teacherId } })
        : 0;
      if (!owns) throw new ForbiddenException('No tiene acceso a este estudiante');
    }

    return this.prisma.observation.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
    });
  }

  async delete(id: string, requesterId: string, requesterRoles: string[]) {
    const obs = await this.prisma.observation.findUnique({ where: { id } });
    if (!obs) throw new NotFoundException('Observación no encontrada');

    const isAdmin = requesterRoles.includes('SUPER_ADMIN') || requesterRoles.includes('RECTOR');
    if (obs.authorId !== requesterId && !isAdmin) {
      throw new ForbiddenException('Solo el autor o un administrador puede eliminar esta observación');
    }

    return this.prisma.observation.delete({ where: { id } });
  }

  // RF-OBS-04: notificación automática al acudiente
  private async notifyGuardian(studentId: string, type: ObservationType, content: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        guardians: {
          where: { isPrimary: true },
          include: { guardian: { select: { userId: true } } },
        },
        user: { select: { firstName: true, lastName: true } },
      },
    });
    if (!student?.guardians[0]) return;

    const typeLabel = type === ObservationType.DISCIPLINARY_SERIOUS ? 'grave' : 'gravísima';
    await this.prisma.notification.create({
      data: {
        userId: student.guardians[0].guardian.userId,
        title: `⚠️ Observación disciplinaria ${typeLabel}`,
        body: `Su acudido ${student.user.firstName} ${student.user.lastName} tiene una observación ${typeLabel}: "${content.slice(0, 100)}..."`,
      },
    });
  }
}
