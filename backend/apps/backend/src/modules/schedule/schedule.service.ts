import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateScheduleSlotDto, UpdateScheduleSlotDto } from './dto/schedule.dto';

const slotInclude = {
  subject: {
    include: {
      gradeGroup: { select: { id: true, name: true, gradeLevel: true } },
      teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
    },
  },
} as const;

@Injectable()
export class ScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  /** Horario de un grupo (todas las materias del grupo). */
  findByGroup(gradeGroupId: string) {
    return this.prisma.scheduleSlot.findMany({
      where: { subject: { gradeGroupId } },
      include: slotInclude,
      orderBy: [{ dayOfWeek: 'asc' }, { block: 'asc' }],
    });
  }

  /** Horario de un docente (todas sus materias en cualquier grupo). */
  findByTeacher(teacherId: string) {
    return this.prisma.scheduleSlot.findMany({
      where: { subject: { teacherId } },
      include: slotInclude,
      orderBy: [{ dayOfWeek: 'asc' }, { block: 'asc' }],
    });
  }

  /** Horario del docente logueado (a partir de su userId). */
  async findByUser(userId: string) {
    const teacher = await this.prisma.teacher.findFirst({ where: { userId } });
    if (!teacher) return [];
    return this.findByTeacher(teacher.id);
  }

  /** Lista de docentes con sus materias y carga horaria asignada (vista admin). */
  async listTeachers() {
    const teachers = await this.prisma.teacher.findMany({
      include: {
        user: { select: { firstName: true, lastName: true } },
        subjects: {
          include: {
            gradeGroup: { select: { id: true, name: true, gradeLevel: true } },
            scheduleSlots: { select: { id: true } },
          },
        },
      },
    });

    return teachers
      .map((t) => {
        const assignedHours = t.subjects.reduce((s, subj) => s + subj.scheduleSlots.length, 0);
        const groups = [...new Set(t.subjects.map((s) => s.gradeGroup.name))];
        return {
          id: t.id,
          userId: t.userId,
          name: `${t.user.firstName} ${t.user.lastName}`,
          speciality: t.speciality,
          assignedHours,
          groups,
          subjects: t.subjects.map((s) => ({
            id: s.id,
            name: s.name,
            gradeGroupId: s.gradeGroupId,
            gradeGroup: s.gradeGroup,
          })),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /** Asignar una materia a un (día, bloque). Valida cruces de grupo y de docente. */
  async create(dto: CreateScheduleSlotDto) {
    const subject = await this.prisma.subject.findUnique({ where: { id: dto.subjectId } });
    if (!subject) throw new NotFoundException('Materia no encontrada');

    // El grupo no puede tener dos clases en el mismo bloque.
    const groupClash = await this.prisma.scheduleSlot.findFirst({
      where: {
        dayOfWeek: dto.dayOfWeek,
        block: dto.block,
        subject: { gradeGroupId: subject.gradeGroupId },
        NOT: { subjectId: dto.subjectId },
      },
      include: { subject: { select: { name: true } } },
    });
    if (groupClash) {
      throw new ConflictException(`El grupo ya tiene "${groupClash.subject.name}" en ese horario`);
    }

    // El docente no puede estar en dos lugares en el mismo bloque.
    const teacherClash = await this.prisma.scheduleSlot.findFirst({
      where: {
        dayOfWeek: dto.dayOfWeek,
        block: dto.block,
        subject: { teacherId: subject.teacherId },
        NOT: { subjectId: dto.subjectId },
      },
      include: { subject: { include: { gradeGroup: { select: { name: true } } } } },
    });
    if (teacherClash) {
      throw new ConflictException(`El docente ya dicta en ${teacherClash.subject.gradeGroup.name} en ese horario`);
    }

    return this.prisma.scheduleSlot.upsert({
      where: { subjectId_dayOfWeek_block: { subjectId: dto.subjectId, dayOfWeek: dto.dayOfWeek, block: dto.block } },
      create: { subjectId: dto.subjectId, dayOfWeek: dto.dayOfWeek, block: dto.block, room: dto.room },
      update: { room: dto.room },
      include: slotInclude,
    });
  }

  async update(id: string, dto: UpdateScheduleSlotDto) {
    await this.getOrThrow(id);
    return this.prisma.scheduleSlot.update({ where: { id }, data: { room: dto.room }, include: slotInclude });
  }

  async remove(id: string) {
    await this.getOrThrow(id);
    await this.prisma.scheduleSlot.delete({ where: { id } });
    return { deleted: true };
  }

  private async getOrThrow(id: string) {
    const slot = await this.prisma.scheduleSlot.findUnique({ where: { id } });
    if (!slot) throw new NotFoundException('Slot de horario no encontrado');
    return slot;
  }
}
