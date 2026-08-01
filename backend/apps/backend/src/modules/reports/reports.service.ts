import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  // RF-REP-01: Rendimiento académico por curso/materia
  async coursePerformance(academicYearId: string, period?: string, gradeGroupId?: string) {
    const gradeGroups = await this.prisma.gradeGroup.findMany({
      where: {
        academicYearId,
        ...(gradeGroupId ? { id: gradeGroupId } : {}),
      },
      include: {
        subjects: {
          include: {
            gradeRecords: {
              where: period ? { period: period as any } : {},
              select: { score: true, scale: true, studentId: true },
            },
          },
        },
      },
    });

    return gradeGroups.map((gg) => ({
      gradeGroupId: gg.id,
      gradeGroupName: gg.name,
      gradeLevel: gg.gradeLevel,
      subjects: gg.subjects.map((subj) => {
        const records = subj.gradeRecords;
        const count = records.length;
        const avg = count ? records.reduce((s, r) => s + Number(r.score), 0) / count : null;
        const scaleDist = this.scaleDistribution(records.map((r) => r.scale));
        return {
          subjectId: subj.id,
          subjectName: subj.name,
          studentCount: count,
          average: avg ? +avg.toFixed(2) : null,
          scaleDist,
          passRate: count
            ? +((records.filter((r) => r.scale !== 'BAJO').length / count) * 100).toFixed(1)
            : null,
        };
      }),
    }));
  }

  // RF-REP-02: Rendimiento por docente
  async teacherPerformance(academicYearId: string, period?: string) {
    const teachers = await this.prisma.teacher.findMany({
      include: {
        user: { select: { firstName: true, lastName: true } },
        subjects: {
          where: { gradeGroup: { academicYearId } },
          include: {
            gradeRecords: {
              where: period ? { period: period as any } : {},
              select: { score: true, scale: true },
            },
            gradeGroup: { select: { name: true, gradeLevel: true } },
          },
        },
      },
    });

    return teachers
      .filter((t) => t.subjects.length > 0)
      .map((t) => {
        const allRecords = t.subjects.flatMap((s) => s.gradeRecords);
        const count = allRecords.length;
        const avg = count ? allRecords.reduce((s, r) => s + Number(r.score), 0) / count : null;
        return {
          teacherId: t.id,
          name: `${t.user.firstName} ${t.user.lastName}`,
          subjectCount: t.subjects.length,
          totalStudentRecords: count,
          average: avg ? +avg.toFixed(2) : null,
          passRate: count
            ? +((allRecords.filter((r) => r.scale !== 'BAJO').length / count) * 100).toFixed(1)
            : null,
          subjects: t.subjects.map((s) => ({ id: s.id, name: s.name, gradeGroup: s.gradeGroup })),
        };
      });
  }

  // RF-REP-03: Estudiantes en riesgo (2+ BAJO en el período)
  async atRiskStudents(academicYearId: string, period?: string) {
    const records = await this.prisma.gradeRecord.findMany({
      where: {
        scale: 'BAJO',
        ...(period ? { period: period as any } : {}),
        student: { gradeGroup: { academicYearId } },
      },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true } },
            gradeGroup: { select: { name: true, gradeLevel: true } },
            guardians: {
              where: { isPrimary: true },
              include: {
                guardian: {
                  include: { user: { select: { firstName: true, lastName: true, phone: true } } },
                },
              },
            },
          },
        },
        subject: { select: { name: true } },
      },
    });

    const byStudent = new Map<string, typeof records>();
    for (const r of records) {
      const existing = byStudent.get(r.studentId) ?? [];
      existing.push(r);
      byStudent.set(r.studentId, existing);
    }

    return Array.from(byStudent.entries())
      .filter(([, recs]) => recs.length >= 2)
      .map(([studentId, recs]) => {
        const student = recs[0].student;
        const primaryGuardian = student.guardians[0]?.guardian;
        return {
          studentId,
          name: `${student.user.firstName} ${student.user.lastName}`,
          gradeGroup: student.gradeGroup,
          bajoCount: recs.length,
          subjects: recs.map((r) => r.subject.name),
          primaryGuardian: primaryGuardian
            ? {
                name: `${primaryGuardian.user.firstName} ${primaryGuardian.user.lastName}`,
                phone: primaryGuardian.user.phone,
              }
            : null,
        };
      })
      .sort((a, b) => b.bajoCount - a.bajoCount);
  }

  // RF-REP-04: Reporte consolidado de asistencia
  async attendanceReport(academicYearId: string, gradeGroupId?: string, from?: Date, to?: Date) {
    const students = await this.prisma.student.findMany({
      where: {
        gradeGroup: {
          academicYearId,
          ...(gradeGroupId ? { id: gradeGroupId } : {}),
        },
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
        gradeGroup: { select: { name: true, gradeLevel: true } },
      },
    });

    const studentIds = students.map((s) => s.id);

    const attendances = await this.prisma.attendance.findMany({
      where: {
        studentId: { in: studentIds },
        ...(from || to
          ? {
              date: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
      select: { studentId: true, status: true },
    });

    const byStudent = new Map<string, typeof attendances>();
    for (const a of attendances) {
      const existing = byStudent.get(a.studentId) ?? [];
      existing.push(a);
      byStudent.set(a.studentId, existing);
    }

    return students.map((s) => {
      const records = byStudent.get(s.id) ?? [];
      const total = records.length;
      const absences = records.filter((r) => r.status === 'ABSENT').length;
      const lates = records.filter((r) => r.status === 'LATE').length;
      const excused = records.filter((r) => r.status === 'EXCUSED').length;
      const effectiveAbsences = absences + lates * 0.5;
      const attendancePct = total ? +((1 - effectiveAbsences / total) * 100).toFixed(1) : null;

      return {
        studentId: s.id,
        name: `${s.user.firstName} ${s.user.lastName}`,
        gradeGroup: s.gradeGroup,
        total,
        present: records.filter((r) => r.status === 'PRESENT').length,
        absences,
        lates,
        excused,
        effectiveAbsences: +effectiveAbsences.toFixed(1),
        attendancePct,
        atRisk: attendancePct !== null && attendancePct < 75,
      };
    });
  }

  // RF-REP-05: Reporte financiero
  async financialReport(academicYearId: string, month?: number, year?: number) {
    const start = month && year ? new Date(year, month - 1, 1) : undefined;
    const end = month && year ? new Date(year, month, 0, 23, 59, 59) : undefined;

    const [invoices, payments, overdueCount] = await Promise.all([
      this.prisma.invoice.groupBy({
        by: ['status'],
        _count: { id: true },
        _sum: { amount: true },
        where: {
          student: { gradeGroup: { academicYearId } },
          ...(start && end ? { dueDate: { gte: start, lte: end } } : {}),
        },
      }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        _count: { id: true },
        where: {
          ...(start && end ? { paidAt: { gte: start, lte: end } } : {}),
        },
      }),
      this.prisma.invoice.count({
        where: { status: 'OVERDUE', student: { gradeGroup: { academicYearId } } },
      }),
    ]);

    const billed = invoices.reduce((s, i) => s + Number(i._sum.amount ?? 0), 0);
    const collected = Number(payments._sum.amount ?? 0);

    return {
      billed: +billed.toFixed(2),
      collected: +collected.toFixed(2),
      portfolio: +(billed - collected).toFixed(2),
      invoiceCount: invoices.reduce((s, i) => s + i._count.id, 0),
      paymentCount: payments._count.id,
      overdueCount,
      breakdown: invoices.map((i) => ({
        status: i.status,
        count: i._count.id,
        total: Number(i._sum.amount ?? 0),
      })),
    };
  }

  // RF-REP-06: Progresión de notas por período
  async gradeProgression(academicYearId: string, gradeGroupId?: string, studentId?: string) {
    const records = await this.prisma.gradeRecord.findMany({
      where: {
        student: {
          ...(studentId ? { id: studentId } : {}),
          gradeGroup: {
            academicYearId,
            ...(gradeGroupId ? { id: gradeGroupId } : {}),
          },
        },
      },
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true } } } },
        subject: { select: { name: true } },
      },
      orderBy: [
        { student: { user: { lastName: 'asc' } } },
        { subject: { name: 'asc' } },
        { period: 'asc' },
      ],
    });

    const byStudent = new Map<string, Map<string, Record<string, number>>>();
    for (const r of records) {
      if (!byStudent.has(r.studentId)) byStudent.set(r.studentId, new Map());
      const bySubject = byStudent.get(r.studentId)!;
      if (!bySubject.has(r.subjectId)) bySubject.set(r.subjectId, {});
      bySubject.get(r.subjectId)![r.period] = Number(r.score);
    }

    return Array.from(byStudent.entries()).map(([studentId, subjects]) => {
      const first = records.find((r) => r.studentId === studentId)!;
      return {
        studentId,
        name: `${first.student.user.firstName} ${first.student.user.lastName}`,
        subjects: Array.from(subjects.entries()).map(([subjectId, periods]) => {
          const subjectRecord = records.find((r) => r.subjectId === subjectId)!;
          return { subjectId, subjectName: subjectRecord.subject.name, periods };
        }),
      };
    });
  }

  private scaleDistribution(scales: string[]) {
    const dist: Record<string, number> = { SUPERIOR: 0, ALTO: 0, BASICO: 0, BAJO: 0 };
    for (const s of scales) if (s in dist) dist[s]++;
    return dist;
  }
}
