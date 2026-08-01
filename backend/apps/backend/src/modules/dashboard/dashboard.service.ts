import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@school/shared';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(userId: string, roles: Role[]) {
    if (roles.includes(Role.SUPER_ADMIN) || roles.includes(Role.RECTOR)) {
      return this.adminStats();
    }
    if (roles.includes(Role.COORDINATOR_ACADEMIC) || roles.includes(Role.COORDINATOR_CONVIVENCIA)) {
      return this.coordinatorStats();
    }
    if (roles.includes(Role.ACCOUNTANT) || roles.includes(Role.SECRETARY)) {
      return this.financeStats();
    }
    if (roles.includes(Role.TEACHER)) {
      return this.teacherStats(userId);
    }
    if (roles.includes(Role.STUDENT)) {
      return this.studentStats(userId);
    }
    if (roles.includes(Role.GUARDIAN)) {
      return this.guardianStats(userId);
    }
    return {};
  }

  /** Series para los gráficos del dashboard ejecutivo (solo dirección/coordinación). */
  async getCharts(roles: Role[]) {
    const empty = { income: [], performanceByGrade: [], attendanceWeekly: [], distribution: [] };
    const allowed = [Role.SUPER_ADMIN, Role.RECTOR, Role.COORDINATOR_ACADEMIC, Role.COORDINATOR_CONVIVENCIA, Role.ACCOUNTANT];
    if (!roles.some((r) => allowed.includes(r))) return empty;

    const year = await this.prisma.academicYear.findFirst({ where: { isCurrent: true } });
    if (!year) return empty;

    // Periodo actual (primero abierto) y anterior.
    const current = await this.prisma.academicPeriod.findFirst({
      where: { academicYearId: year.id, isClosed: false },
      orderBy: { periodNumber: 'asc' },
    });
    const curNum = current?.periodNumber ?? 1;
    const curEnum = `P${curNum}`;
    const prevEnum = curNum > 1 ? `P${curNum - 1}` : null;

    const [income, performanceByGrade, attendanceWeekly, distribution] = await Promise.all([
      this.incomeByMonth(year.id),
      this.performanceByGrade(year.id, curEnum, prevEnum),
      this.attendanceWeekly(),
      this.distributionByScale(year.id, curEnum),
    ]);

    return { income, performanceByGrade, attendanceWeekly, distribution, currentPeriod: current?.name ?? null };
  }

  private async incomeByMonth(academicYearId: string) {
    const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const [billed, payments] = await Promise.all([
      this.prisma.invoice.groupBy({
        by: ['month'],
        _sum: { amount: true },
        where: { academicYearId },
      }),
      this.prisma.payment.findMany({
        where: { invoice: { academicYearId } },
        select: { amount: true, invoice: { select: { month: true } } },
      }),
    ]);

    const collectedByMonth = new Map<number, number>();
    for (const p of payments) {
      const m = p.invoice.month;
      collectedByMonth.set(m, (collectedByMonth.get(m) ?? 0) + Number(p.amount));
    }
    const billedByMonth = new Map<number, number>();
    for (const b of billed) billedByMonth.set(b.month, Number(b._sum.amount ?? 0));

    const months = [...new Set([...billedByMonth.keys(), ...collectedByMonth.keys()])].sort((a, b) => a - b);
    return months.map((m) => ({
      mes: MESES[((m - 1) % 12 + 12) % 12] ?? String(m),
      facturado: Math.round(billedByMonth.get(m) ?? 0),
      recaudado: Math.round(collectedByMonth.get(m) ?? 0),
    }));
  }

  private async performanceByGrade(academicYearId: string, curEnum: string, prevEnum: string | null) {
    const groups = await this.prisma.gradeGroup.findMany({
      where: { academicYearId },
      select: {
        name: true,
        gradeLevel: true,
        subjects: {
          select: {
            gradeRecords: {
              where: { period: { in: [curEnum, ...(prevEnum ? [prevEnum] : [])] as any } },
              select: { score: true, period: true },
            },
          },
        },
      },
      orderBy: { gradeLevel: 'asc' },
    });

    return groups.map((g) => {
      const recs = g.subjects.flatMap((s) => s.gradeRecords);
      const cur = recs.filter((r) => r.period === curEnum).map((r) => Number(r.score));
      const prev = recs.filter((r) => prevEnum && r.period === prevEnum).map((r) => Number(r.score));
      const mean = (xs: number[]) => (xs.length ? +(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(2) : null);
      return { grado: g.name, actual: mean(cur), anterior: mean(prev) };
    }).filter((g) => g.actual != null);
  }

  private async attendanceWeekly() {
    const since = new Date();
    since.setDate(since.getDate() - 6);
    since.setHours(0, 0, 0, 0);

    const records = await this.prisma.attendance.findMany({
      where: { date: { gte: since } },
      select: { date: true, status: true },
    });

    const DIAS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    const byDay = new Map<string, { total: number; effAbs: number; dow: number }>();
    for (const r of records) {
      const key = r.date.toISOString().slice(0, 10);
      const e = byDay.get(key) ?? { total: 0, effAbs: 0, dow: r.date.getUTCDay() };
      e.total += 1;
      if (r.status === 'ABSENT') e.effAbs += 1;
      else if (r.status === 'LATE') e.effAbs += 0.5;
      byDay.set(key, e);
    }

    return [...byDay.entries()]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([, v]) => ({ dia: DIAS[v.dow] ?? '?', valor: v.total ? +(((1 - v.effAbs / v.total) * 100).toFixed(1)) : 0 }));
  }

  private async distributionByScale(academicYearId: string, curEnum: string) {
    const grouped = await this.prisma.gradeRecord.groupBy({
      by: ['scale'],
      _count: { id: true },
      where: { period: curEnum as any, student: { gradeGroup: { academicYearId } } },
    });
    const total = grouped.reduce((s, g) => s + g._count.id, 0) || 1;
    const LABELS: Record<string, string> = { SUPERIOR: 'Superior', ALTO: 'Alto', BASICO: 'Básico', BAJO: 'Bajo' };
    const order = ['SUPERIOR', 'ALTO', 'BASICO', 'BAJO'];
    return order
      .map((scale) => {
        const found = grouped.find((g) => g.scale === scale);
        const count = found?._count.id ?? 0;
        return { name: LABELS[scale], scale, count, value: Math.round((count / total) * 100) };
      })
      .filter((d) => d.count > 0);
  }

  private async adminStats() {
    const currentYear = await this.prisma.academicYear.findFirst({ where: { isCurrent: true } });

    const [
      totalStudents,
      totalTeachers,
      totalUsers,
      activeEnrollments,
      pendingInvoices,
      overdueInvoices,
      recentAnnouncements,
    ] = await Promise.all([
      this.prisma.student.count({ where: { user: { isActive: true, deletedAt: null } } }),
      this.prisma.teacher.count({ where: { user: { isActive: true, deletedAt: null } } }),
      this.prisma.user.count({ where: { isActive: true, deletedAt: null } }),
      currentYear
        ? this.prisma.enrollment.count({
            where: { academicYearId: currentYear.id, status: 'FORMALIZED' },
          })
        : 0,
      this.prisma.invoice.count({ where: { status: 'PENDING' } }),
      this.prisma.invoice.count({ where: { status: 'OVERDUE' } }),
      this.prisma.announcement.findMany({
        where: { isPublished: true },
        orderBy: { publishedAt: 'desc' },
        take: 5,
        include: { author: { select: { firstName: true, lastName: true } } },
      }),
    ]);

    const financeThisMonth = await this.getFinanceThisMonth();

    return {
      type: 'admin',
      overview: { totalStudents, totalTeachers, totalUsers, activeEnrollments },
      finance: { pendingInvoices, overdueInvoices, ...financeThisMonth },
      recentAnnouncements,
      currentYear: currentYear ? { id: currentYear.id, year: currentYear.year } : null,
    };
  }

  private async coordinatorStats() {
    const currentYear = await this.prisma.academicYear.findFirst({ where: { isCurrent: true } });

    const [gradeGroups, atRiskCount, observationsThisWeek, openPeriods] = await Promise.all([
      this.prisma.gradeGroup.count({ where: currentYear ? { academicYearId: currentYear.id } : {} }),
      this.getAtRiskStudentCount(),
      this.prisma.observation.count({ where: { date: { gte: this.startOfWeek() } } }),
      currentYear
        ? this.prisma.academicPeriod.count({
            where: { academicYearId: currentYear.id, isClosed: false },
          })
        : 0,
    ]);

    return {
      type: 'coordinator',
      gradeGroups,
      atRiskCount,
      observationsThisWeek,
      openPeriods,
      currentYear: currentYear ? { id: currentYear.id, year: currentYear.year } : null,
    };
  }

  private async financeStats() {
    const [pending, overdue] = await Promise.all([
      this.prisma.invoice.count({ where: { status: 'PENDING' } }),
      this.prisma.invoice.count({ where: { status: 'OVERDUE' } }),
    ]);

    const finance = await this.getFinanceThisMonth();

    return { type: 'finance', pending, overdue, ...finance };
  }

  private async teacherStats(userId: string) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { userId },
      include: {
        subjects: {
          include: {
            gradeGroup: { select: { name: true, gradeLevel: true } },
          },
        },
      },
    });

    if (!teacher) return { type: 'teacher', subjects: [], totalStudents: 0 };

    const gradeGroupIds = [...new Set(teacher.subjects.map((s) => s.gradeGroupId))];
    const totalStudents = await this.prisma.student.count({
      where: { gradeGroupId: { in: gradeGroupIds } },
    });

    return {
      type: 'teacher',
      subjects: teacher.subjects.map((s) => ({
        id: s.id,
        name: s.name,
        gradeGroup: s.gradeGroup,
      })),
      totalStudents,
      groupCount: gradeGroupIds.length,
    };
  }

  private async studentStats(userId: string) {
    const student = await this.prisma.student.findFirst({
      where: { userId },
      include: {
        gradeGroup: { select: { name: true, gradeLevel: true } },
      },
    });

    if (!student) return { type: 'student' };

    const currentYear = await this.prisma.academicYear.findFirst({ where: { isCurrent: true } });
    const periodRecord = currentYear
      ? await this.prisma.academicPeriod.findFirst({
          where: { academicYearId: currentYear.id, isClosed: false },
          orderBy: { startDate: 'asc' },
        })
      : null;

    const [grades, unread] = await Promise.all([
      this.prisma.gradeRecord.findMany({
        where: { studentId: student.id },
        include: { subject: { select: { name: true } } },
        orderBy: { subject: { name: 'asc' } },
      }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      type: 'student',
      student: { id: student.id, gradeGroup: student.gradeGroup },
      currentPeriod: periodRecord?.name ?? null,
      grades,
      unreadNotifications: unread,
    };
  }

  private async guardianStats(userId: string) {
    const guardian = await this.prisma.guardian.findFirst({
      where: { userId },
      include: {
        students: {
          include: {
            student: {
              include: {
                gradeGroup: { select: { name: true, gradeLevel: true } },
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });

    if (!guardian) return { type: 'guardian', students: [] };

    const studentIds = guardian.students.map((s) => s.studentId);
    const [invoices, unread] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { studentId: { in: studentIds }, status: { in: ['PENDING', 'OVERDUE'] } },
        orderBy: { dueDate: 'asc' },
        take: 10,
        include: { student: { include: { user: { select: { firstName: true, lastName: true } } } } },
      }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      type: 'guardian',
      students: guardian.students.map((sg) => ({
        id: sg.student.id,
        name: `${sg.student.user.firstName} ${sg.student.user.lastName}`,
        gradeGroup: sg.student.gradeGroup,
        isPrimary: sg.isPrimary,
      })),
      pendingInvoices: invoices,
      unreadNotifications: unread,
    };
  }

  private async getFinanceThisMonth() {
    const start = this.startOfMonth();
    const [collected, total] = await Promise.all([
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { paidAt: { gte: start } },
      }),
      this.prisma.invoice.aggregate({
        _sum: { amount: true },
        where: { createdAt: { gte: start } },
      }),
    ]);
    return {
      collectedThisMonth: collected._sum.amount ?? 0,
      billedThisMonth: total._sum.amount ?? 0,
    };
  }

  private async getAtRiskStudentCount() {
    const absences = await this.prisma.attendance.groupBy({
      by: ['studentId'],
      _count: { id: true },
      where: { status: { in: ['ABSENT', 'LATE'] } },
    });
    const totals = await this.prisma.attendance.groupBy({
      by: ['studentId'],
      _count: { id: true },
    });
    const totalMap = new Map(totals.map((r) => [r.studentId, r._count.id]));
    return absences.filter((r) => {
      const total = totalMap.get(r.studentId) ?? 0;
      return total > 0 && r._count.id / total > 0.25;
    }).length;
  }

  private startOfMonth() {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  private startOfWeek() {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(new Date().setDate(diff));
  }
}
