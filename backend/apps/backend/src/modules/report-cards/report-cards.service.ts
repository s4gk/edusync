import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { teacherScope, type ReqUser } from '../../common/scope.util';

@Injectable()
export class ReportCardsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('pdf') private readonly pdfQueue: Queue,
  ) {}

  // RF-BOL-01: Encolar generación de boletines al cerrar periodo
  async enqueueForGroup(gradeGroupId: string, periodNumber: number, requesterId: string) {
    const group = await this.prisma.gradeGroup.findUnique({
      where: { id: gradeGroupId },
      include: { students: true },
    });
    if (!group) throw new NotFoundException('Grupo no encontrado');

    const jobs = group.students.map((s) =>
      this.pdfQueue.add('report-card', {
        studentId: s.id,
        gradeGroupId,
        periodNumber,
        requestedBy: requesterId,
      }),
    );

    await Promise.all(jobs);
    return { queued: group.students.length, gradeGroupId, periodNumber };
  }

  async enqueueForStudent(studentId: string, periodNumber: number, requesterId: string) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Estudiante no encontrado');

    await this.pdfQueue.add('report-card', { studentId, gradeGroupId: student.gradeGroupId, periodNumber, requestedBy: requesterId });
    return { queued: 1, studentId, periodNumber };
  }

  // RF-BOL-05/06: Consultar boletines disponibles
  async findAll(query: { studentId?: string; gradeGroupId?: string; period?: string }, user?: ReqUser) {
    const where: any = {};
    if (query.studentId) where.studentId = query.studentId;
    if (query.gradeGroupId) where.gradeGroupId = query.gradeGroupId;
    if (query.period) where.period = query.period;
    // Un profesor solo ve boletines de sus grupos.
    const teacherId = await teacherScope(this.prisma, user);
    if (teacherId) where.gradeGroup = { subjects: { some: { teacherId } } };

    return this.prisma.reportCard.findMany({
      where,
      orderBy: [{ period: 'asc' }, { generatedAt: 'desc' }],
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true } } } },
        gradeGroup: { select: { name: true, gradeLevel: true } },
      },
    });
  }

  async findOne(id: string) {
    const rc = await this.prisma.reportCard.findUnique({
      where: { id },
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true } } } },
        gradeGroup: { select: { name: true, gradeLevel: true } },
      },
    });
    if (!rc) throw new NotFoundException('Boletín no encontrado');
    return rc;
  }

  async publish(id: string) {
    const rc = await this.prisma.reportCard.findUnique({ where: { id } });
    if (!rc) throw new NotFoundException('Boletín no encontrado');
    if (!rc.pdfUrl) throw new ForbiddenException('El boletín aún no ha sido generado');
    return this.prisma.reportCard.update({ where: { id }, data: { isPublished: true } });
  }

  async publishAll(gradeGroupId: string, period: string) {
    return this.prisma.reportCard.updateMany({
      where: { gradeGroupId, period: period as any, pdfUrl: { not: null } },
      data: { isPublished: true },
    });
  }

  // Llamado por el PDF processor tras generar el archivo
  async markGenerated(studentId: string, gradeGroupId: string, period: string, pdfUrl: string) {
    return this.prisma.reportCard.upsert({
      where: { studentId_gradeGroupId_period: { studentId, gradeGroupId, period: period as any } },
      create: { studentId, gradeGroupId, period: period as any, pdfUrl, generatedAt: new Date() },
      update: { pdfUrl, generatedAt: new Date() },
    });
  }
}
