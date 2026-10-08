import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStudentDto, UpdateStudentDto, QueryStudentDto } from './dto/student.dto';
import { teacherScope, type ReqUser } from '../../common/scope.util';
import {
  CreateEnrollmentDto,
  UpdateEnrollmentStatusDto,
  LinkGuardianDto,
  RenewEnrollmentDto,
  EnrollmentStatus,
} from './dto/enrollment.dto';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Students ──────────────────────────────────────────────────────────────

  async findAll(query: QueryStudentDto, user?: ReqUser) {
    const { search, gradeGroupId, gradeLevel, unassigned, academicYearId, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { user: { deletedAt: null } };
    if (unassigned) where.gradeGroupId = null;
    else if (gradeGroupId) where.gradeGroupId = gradeGroupId;
    // Filtro por grado (todas sus secciones) y/o alcance del docente se combinan
    // en el filtro de la relación gradeGroup.
    const teacherId = await teacherScope(this.prisma, user);
    const ggFilter: any = {};
    if (teacherId) ggFilter.subjects = { some: { teacherId } };
    if (!unassigned && !gradeGroupId && gradeLevel != null) ggFilter.gradeLevel = gradeLevel;
    if (Object.keys(ggFilter).length) where.gradeGroup = ggFilter;
    if (search) {
      where.OR = [
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { enrollmentCode: { contains: search, mode: 'insensitive' } },
        { documentId: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (academicYearId) {
      where.enrollments = { some: { academicYearId } };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { user: { lastName: 'asc' } },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, status: true, avatarUrl: true } },
          gradeGroup: { select: { id: true, name: true, gradeLevel: true } },
          guardians: {
            include: {
              guardian: {
                include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } },
              },
            },
          },
        },
      }),
      this.prisma.student.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, user?: ReqUser) {
    const teacherId = await teacherScope(this.prisma, user);
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true, firstName: true, lastName: true, email: true, phone: true, status: true,
            avatarUrl: true, profile: true, documents: true,
          },
        },
        gradeGroup: { select: { id: true, name: true, gradeLevel: true } },
        guardians: {
          include: {
            guardian: {
              include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } },
            },
          },
        },
        enrollments: {
          orderBy: { enrolledAt: 'desc' },
          include: {
            academicYear: { select: { year: true } },
            gradeGroup: { select: { name: true, gradeLevel: true } },
            documents: true,
          },
        },
      },
    });
    if (!student) throw new NotFoundException('Estudiante no encontrado');

    // Un profesor solo puede ver estudiantes de un grupo donde él dicta.
    if (teacherId) {
      const owns = student.gradeGroupId
        ? await this.prisma.subject.count({ where: { gradeGroupId: student.gradeGroupId, teacherId } })
        : 0;
      if (!owns) throw new ForbiddenException('No tiene acceso a este estudiante');
    }
    return student;
  }

  async create(dto: CreateStudentDto) {
    const existing = await this.prisma.student.findUnique({ where: { userId: dto.userId } });
    if (existing) throw new ConflictException('Este usuario ya tiene perfil de estudiante');

    const codeExists = await this.prisma.student.findUnique({ where: { enrollmentCode: dto.enrollmentCode } });
    if (codeExists) throw new ConflictException('El código de matrícula ya existe');

    return this.prisma.student.create({
      data: {
        userId: dto.userId,
        enrollmentCode: dto.enrollmentCode,
        documentId: dto.documentId,
        birthDate: new Date(dto.birthDate),
        address: dto.address,
        gradeGroupId: dto.gradeGroupId,
      },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    });
  }

  async update(id: string, dto: UpdateStudentDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.birthDate) data.birthDate = new Date(dto.birthDate);
    return this.prisma.student.update({ where: { id }, data });
  }

  // ─── Guardians ─────────────────────────────────────────────────────────────

  async linkGuardian(studentId: string, dto: LinkGuardianDto) {
    await this.findOne(studentId);

    const guardian = await this.prisma.guardian.findUnique({ where: { id: dto.guardianId } });
    if (!guardian) throw new NotFoundException('Acudiente no encontrado');

    if (dto.isPrimary) {
      await this.prisma.studentGuardian.updateMany({
        where: { studentId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    return this.prisma.studentGuardian.upsert({
      where: { studentId_guardianId: { studentId, guardianId: dto.guardianId } },
      create: { studentId, guardianId: dto.guardianId, isPrimary: dto.isPrimary ?? false },
      update: { isPrimary: dto.isPrimary ?? false },
    });
  }

  async unlinkGuardian(studentId: string, guardianId: string) {
    const link = await this.prisma.studentGuardian.findUnique({
      where: { studentId_guardianId: { studentId, guardianId } },
    });
    if (!link) throw new NotFoundException('Vínculo no encontrado');
    return this.prisma.studentGuardian.delete({
      where: { studentId_guardianId: { studentId, guardianId } },
    });
  }

  // ─── Enrollments ───────────────────────────────────────────────────────────

  async createEnrollment(dto: CreateEnrollmentDto) {
    await this.findOne(dto.studentId);

    const existing = await this.prisma.enrollment.findUnique({
      where: { studentId_academicYearId: { studentId: dto.studentId, academicYearId: dto.academicYearId } },
    });
    if (existing) throw new ConflictException('El estudiante ya tiene matrícula en este año lectivo');

    return this.prisma.enrollment.create({
      data: {
        studentId: dto.studentId,
        academicYearId: dto.academicYearId,
        gradeGroupId: dto.gradeGroupId,
        documents: dto.documents?.length ? { create: dto.documents } : undefined,
      },
      include: { documents: true, gradeGroup: { select: { name: true, gradeLevel: true } } },
    });
  }

  async updateEnrollmentStatus(enrollmentId: string, dto: UpdateEnrollmentStatusDto) {
    const enrollment = await this.prisma.enrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment) throw new NotFoundException('Matrícula no encontrada');

    if ([EnrollmentStatus.RETIRED, EnrollmentStatus.TRANSFERRED].includes(dto.status) && !dto.reason) {
      throw new BadRequestException('Se requiere motivo para retiro o traslado');
    }

    const data: any = { status: dto.status };
    if (dto.status === EnrollmentStatus.FORMALIZED) data.formalizedAt = new Date();
    if ([EnrollmentStatus.RETIRED, EnrollmentStatus.TRANSFERRED].includes(dto.status)) {
      data.retiredAt = new Date();
      data.retiredReason = dto.reason;
    }

    return this.prisma.enrollment.update({ where: { id: enrollmentId }, data, include: { documents: true } });
  }

  async renewEnrollment(studentId: string, dto: RenewEnrollmentDto) {
    await this.findOne(studentId);
    const latest = await this.prisma.enrollment.findFirst({
      where: { studentId },
      orderBy: { enrolledAt: 'desc' },
    });
    if (!latest) throw new NotFoundException('No se encontró matrícula previa');
    if (latest.status !== 'FORMALIZED') {
      throw new BadRequestException('Solo se pueden renovar matrículas formalizadas');
    }

    const alreadyExists = await this.prisma.enrollment.findUnique({
      where: { studentId_academicYearId: { studentId, academicYearId: dto.academicYearId } },
    });
    if (alreadyExists) throw new ConflictException('Ya existe matrícula para ese año lectivo');

    await this.prisma.student.update({ where: { id: studentId }, data: { gradeGroupId: dto.gradeGroupId } });

    return this.prisma.enrollment.create({
      data: { studentId, academicYearId: dto.academicYearId, gradeGroupId: dto.gradeGroupId },
      include: { gradeGroup: { select: { name: true, gradeLevel: true } } },
    });
  }

  async updateDocument(docId: string, isDelivered: boolean, notes?: string) {
    const doc = await this.prisma.enrollmentDocument.findUnique({ where: { id: docId } });
    if (!doc) throw new NotFoundException('Documento no encontrado');
    return this.prisma.enrollmentDocument.update({
      where: { id: docId },
      data: { isDelivered, deliveredAt: isDelivered ? new Date() : null, notes },
    });
  }

  async getEnrollmentHistory(studentId: string) {
    await this.findOne(studentId);
    return this.prisma.enrollment.findMany({
      where: { studentId },
      orderBy: { enrolledAt: 'desc' },
      include: {
        academicYear: { select: { year: true } },
        gradeGroup: { select: { name: true, gradeLevel: true } },
        documents: true,
      },
    });
  }
}
