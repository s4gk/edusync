import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAcademicYearDto, UpdateAcademicYearDto } from './dto/academic-year.dto';
import { CreateAcademicPeriodDto, UpdateAcademicPeriodDto } from './dto/academic-period.dto';
import { CreateGradeGroupDto, UpdateGradeGroupDto } from './dto/grade-group.dto';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/subject.dto';
import { SetGradeScalesDto } from './dto/grade-scale-config.dto';
import { teacherScope, type ReqUser } from '../../common/scope.util';

@Injectable()
export class AcademicService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Academic Years ────────────────────────────────────────────────────────

  async findAllYears() {
    return this.prisma.academicYear.findMany({
      orderBy: { year: 'desc' },
      include: { academicPeriods: { orderBy: { periodNumber: 'asc' } }, _count: { select: { gradeGroups: true } } },
    });
  }

  async findOneYear(id: string) {
    const year = await this.prisma.academicYear.findUnique({
      where: { id },
      include: {
        academicPeriods: { orderBy: { periodNumber: 'asc' } },
        gradeGroups: { orderBy: { gradeLevel: 'asc' } },
        gradeScaleConfigs: true,
      },
    });
    if (!year) throw new NotFoundException('Año académico no encontrado');
    return year;
  }

  async createYear(dto: CreateAcademicYearDto) {
    if (dto.isCurrent) {
      await this.prisma.academicYear.updateMany({ where: { isCurrent: true }, data: { isCurrent: false } });
    }
    return this.prisma.academicYear.create({ data: { ...dto, startDate: new Date(dto.startDate), endDate: new Date(dto.endDate) } });
  }

  async updateYear(id: string, dto: UpdateAcademicYearDto) {
    await this.findOneYear(id);
    if (dto.isCurrent) {
      await this.prisma.academicYear.updateMany({ where: { isCurrent: true }, data: { isCurrent: false } });
    }
    const data: any = { ...dto };
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);
    return this.prisma.academicYear.update({ where: { id }, data });
  }

  // ─── Academic Periods ──────────────────────────────────────────────────────

  async findPeriodsByYear(academicYearId: string) {
    return this.prisma.academicPeriod.findMany({
      where: { academicYearId },
      orderBy: { periodNumber: 'asc' },
    });
  }

  async createPeriod(dto: CreateAcademicPeriodDto) {
    await this.findOneYear(dto.academicYearId);

    const periods = await this.prisma.academicPeriod.findMany({ where: { academicYearId: dto.academicYearId } });
    const totalWeight = periods.reduce((sum, p) => sum + Number(p.weightPercent), 0) + dto.weightPercent;
    if (totalWeight > 100) {
      throw new BadRequestException(`La suma de pesos de periodos excede 100% (actual: ${totalWeight - dto.weightPercent}%)`);
    }

    return this.prisma.academicPeriod.create({
      data: {
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        weightPercent: dto.weightPercent,
      },
    });
  }

  async updatePeriod(id: string, dto: UpdateAcademicPeriodDto) {
    const period = await this.prisma.academicPeriod.findUnique({ where: { id } });
    if (!period) throw new NotFoundException('Periodo académico no encontrado');
    if (period.isClosed) throw new ConflictException('No se puede modificar un periodo cerrado');

    const data: any = { ...dto };
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);
    return this.prisma.academicPeriod.update({ where: { id }, data });
  }

  async closePeriod(id: string, userId: string) {
    const period = await this.prisma.academicPeriod.findUnique({ where: { id } });
    if (!period) throw new NotFoundException('Periodo académico no encontrado');
    if (period.isClosed) throw new ConflictException('El periodo ya está cerrado');

    return this.prisma.academicPeriod.update({
      where: { id },
      data: { isClosed: true, closedAt: new Date(), closedById: userId },
    });
  }

  async reopenPeriod(id: string, userId: string, justification: string) {
    const period = await this.prisma.academicPeriod.findUnique({ where: { id } });
    if (!period) throw new NotFoundException('Periodo académico no encontrado');
    if (!period.isClosed) throw new ConflictException('El periodo no está cerrado');
    if (!justification?.trim()) throw new BadRequestException('Se requiere justificación para reapertura');

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'PERIOD_REOPEN',
        entity: 'AcademicPeriod',
        entityId: id,
        newValues: { justification, reopenedAt: new Date() },
      },
    });

    return this.prisma.academicPeriod.update({
      where: { id },
      data: { isClosed: false, closedAt: null, closedById: null },
    });
  }

  // ─── Grade Groups ──────────────────────────────────────────────────────────

  async findGroupsByYear(academicYearId: string, user?: ReqUser) {
    // Un profesor solo ve los grupos donde dicta alguna materia.
    const teacherId = await teacherScope(this.prisma, user);
    return this.prisma.gradeGroup.findMany({
      where: {
        academicYearId,
        ...(teacherId ? { subjects: { some: { teacherId } } } : {}),
      },
      orderBy: [{ gradeLevel: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { students: true, subjects: true } },
        director: { include: { user: { select: { firstName: true, lastName: true } } } },
        subjects: {
          ...(teacherId ? { where: { teacherId } } : {}),
          include: { teacher: { include: { user: { select: { firstName: true, lastName: true } } } } },
        },
      },
    });
  }

  async createGroup(dto: CreateGradeGroupDto) {
    await this.findOneYear(dto.academicYearId);
    return this.prisma.gradeGroup.create({ data: dto });
  }

  async updateGroup(id: string, dto: UpdateGradeGroupDto) {
    const group = await this.prisma.gradeGroup.findUnique({ where: { id } });
    if (!group) throw new NotFoundException('Grupo no encontrado');
    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.gradeLevel !== undefined) data.gradeLevel = dto.gradeLevel;
    if (dto.directorId !== undefined) data.directorId = dto.directorId || null;
    return this.prisma.gradeGroup.update({ where: { id }, data });
  }

  async deleteGroup(id: string) {
    const group = await this.prisma.gradeGroup.findUnique({ where: { id }, include: { _count: { select: { students: true } } } });
    if (!group) throw new NotFoundException('Grupo no encontrado');
    if (group._count.students > 0) throw new ConflictException('No se puede eliminar un grupo con estudiantes asignados');
    return this.prisma.gradeGroup.delete({ where: { id } });
  }

  // ─── Subjects ──────────────────────────────────────────────────────────────

  async findSubjectsByGroup(gradeGroupId: string, user?: ReqUser) {
    // Un profesor solo ve, dentro del grupo, las materias que él dicta.
    const teacherId = await teacherScope(this.prisma, user);
    return this.prisma.subject.findMany({
      where: { gradeGroupId, ...(teacherId ? { teacherId } : {}) },
      include: {
        teacher: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
      },
    });
  }

  async createSubject(dto: CreateSubjectDto) {
    const group = await this.prisma.gradeGroup.findUnique({ where: { id: dto.gradeGroupId } });
    if (!group) throw new NotFoundException('Grupo no encontrado');

    const teacher = await this.prisma.teacher.findUnique({ where: { id: dto.teacherId } });
    if (!teacher) throw new NotFoundException('Profesor no encontrado');

    return this.prisma.subject.create({ data: dto });
  }

  async updateSubject(id: string, dto: UpdateSubjectDto) {
    const subject = await this.prisma.subject.findUnique({ where: { id } });
    if (!subject) throw new NotFoundException('Materia no encontrada');

    if (dto.teacherId) {
      const teacher = await this.prisma.teacher.findUnique({ where: { id: dto.teacherId } });
      if (!teacher) throw new NotFoundException('Profesor no encontrado');
    }

    return this.prisma.subject.update({ where: { id }, data: dto });
  }

  async deleteSubject(id: string) {
    const subject = await this.prisma.subject.findUnique({ where: { id } });
    if (!subject) throw new NotFoundException('Materia no encontrada');
    return this.prisma.subject.delete({ where: { id } });
  }

  // ─── Grade Scale Config ────────────────────────────────────────────────────

  async getGradeScales(academicYearId: string) {
    await this.findOneYear(academicYearId);
    return this.prisma.gradeScaleConfig.findMany({
      where: { academicYearId },
      orderBy: { minScore: 'desc' },
    });
  }

  async setGradeScales(dto: SetGradeScalesDto) {
    await this.findOneYear(dto.academicYearId);

    return this.prisma.$transaction(
      dto.scales.map((s) =>
        this.prisma.gradeScaleConfig.upsert({
          where: { academicYearId_scale: { academicYearId: dto.academicYearId, scale: s.scale } },
          create: { academicYearId: dto.academicYearId, scale: s.scale, minScore: s.minScore, maxScore: s.maxScore },
          update: { minScore: s.minScore, maxScore: s.maxScore },
        }),
      ),
    );
  }
}
