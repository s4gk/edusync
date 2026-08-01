import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  UpsertTuitionConfigDto,
  GenerateInvoicesDto,
  RegisterPaymentDto,
  QueryInvoiceDto,
} from './dto/finance.dto';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Tuition Config ────────────────────────────────────────────────────────

  async getTuitionConfigs(academicYearId: string) {
    return this.prisma.tuitionConfig.findMany({
      where: { academicYearId },
      orderBy: { gradeLevel: 'asc' },
    });
  }

  async upsertTuitionConfig(dto: UpsertTuitionConfigDto) {
    return this.prisma.tuitionConfig.upsert({
      where: { academicYearId_gradeLevel: { academicYearId: dto.academicYearId, gradeLevel: dto.gradeLevel } },
      create: {
        academicYearId: dto.academicYearId,
        gradeLevel: dto.gradeLevel,
        enrollmentFee: dto.enrollmentFee,
        monthlyFee: dto.monthlyFee,
        lateFeePercent: dto.lateFeePercent ?? 0,
      },
      update: {
        enrollmentFee: dto.enrollmentFee,
        monthlyFee: dto.monthlyFee,
        lateFeePercent: dto.lateFeePercent ?? 0,
      },
    });
  }

  // ─── Invoices ──────────────────────────────────────────────────────────────

  async generateInvoices(dto: GenerateInvoicesDto) {
    const year = await this.prisma.academicYear.findUnique({ where: { id: dto.academicYearId } });
    if (!year) throw new NotFoundException('Año académico no encontrado');

    const where: any = { academicYearId: dto.academicYearId };
    if (dto.gradeGroupId) where.id = dto.gradeGroupId;

    const groups = await this.prisma.gradeGroup.findMany({
      where: { academicYearId: dto.academicYearId, ...(dto.gradeGroupId ? { id: dto.gradeGroupId } : {}) },
      include: {
        students: true,
        academicYear: true,
      },
    });

    const dueDate = new Date(dto.dueDate);
    let created = 0;
    let skipped = 0;

    for (const group of groups) {
      const config = await this.prisma.tuitionConfig.findUnique({
        where: { academicYearId_gradeLevel: { academicYearId: dto.academicYearId, gradeLevel: group.gradeLevel } },
      });
      if (!config) { skipped += group.students.length; continue; }

      for (const student of group.students) {
        const existing = await this.prisma.invoice.findUnique({
          where: { studentId_academicYearId_month: { studentId: student.id, academicYearId: dto.academicYearId, month: dto.month } },
        });
        if (existing) { skipped++; continue; }

        // Apply late fee if dueDate has passed
        const now = new Date();
        const lateFee = dueDate < now
          ? Number(config.monthlyFee) * (Number(config.lateFeePercent) / 100)
          : 0;

        await this.prisma.invoice.create({
          data: {
            studentId: student.id,
            academicYearId: dto.academicYearId,
            month: dto.month,
            amount: config.monthlyFee,
            lateFee,
            dueDate,
          },
        });
        created++;
      }
    }

    return { created, skipped, month: dto.month };
  }

  async findInvoices(query: QueryInvoiceDto) {
    const { studentId, academicYearId, status, month, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (academicYearId) where.academicYearId = academicYearId;
    if (status) where.status = status;
    if (month) where.month = month;

    // Auto-update overdue status
    await this.prisma.invoice.updateMany({
      where: { status: 'PENDING', dueDate: { lt: new Date() } },
      data: { status: 'OVERDUE' },
    });

    const [data, total] = await this.prisma.$transaction([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dueDate: 'asc' },
        include: {
          student: { include: { user: { select: { firstName: true, lastName: true } } } },
          payment: true,
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getStudentBalance(studentId: string) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Estudiante no encontrado');

    await this.prisma.invoice.updateMany({
      where: { studentId, status: 'PENDING', dueDate: { lt: new Date() } },
      data: { status: 'OVERDUE' },
    });

    const invoices = await this.prisma.invoice.findMany({
      where: { studentId },
      include: { payment: true },
      orderBy: { month: 'asc' },
    });

    const pending = invoices.filter((i) => i.status === 'PENDING' || i.status === 'OVERDUE');
    const totalDebt = pending.reduce((s, i) => s + Number(i.amount) + Number(i.lateFee), 0);

    return { invoices, totalDebt, pendingCount: pending.length };
  }

  // ─── Payments ──────────────────────────────────────────────────────────────

  async registerPayment(dto: RegisterPaymentDto) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: dto.invoiceId } });
    if (!invoice) throw new NotFoundException('Factura no encontrada');
    if (invoice.status === 'PAID') throw new ConflictException('Esta factura ya fue pagada');

    const receiptExists = await this.prisma.payment.findUnique({ where: { receiptNumber: dto.receiptNumber } });
    if (receiptExists) throw new ConflictException('El número de recibo ya existe');

    const [payment] = await this.prisma.$transaction([
      this.prisma.payment.create({
        data: {
          invoiceId: dto.invoiceId,
          receiptNumber: dto.receiptNumber,
          paidAt: new Date(dto.paidAt),
          amount: dto.amount,
        },
      }),
      this.prisma.invoice.update({
        where: { id: dto.invoiceId },
        data: { status: 'PAID' },
      }),
    ]);

    return payment;
  }

  // ─── Finance Summary (para Dashboard y Reportes) ───────────────────────────

  async getSummary(academicYearId: string) {
    const [totalInvoiced, totalPaid, overdue, pending] = await this.prisma.$transaction([
      this.prisma.invoice.aggregate({ where: { academicYearId }, _sum: { amount: true, lateFee: true } }),
      this.prisma.invoice.aggregate({ where: { academicYearId, status: 'PAID' }, _sum: { amount: true } }),
      this.prisma.invoice.count({ where: { academicYearId, status: 'OVERDUE' } }),
      this.prisma.invoice.count({ where: { academicYearId, status: 'PENDING' } }),
    ]);

    const billed = Number(totalInvoiced._sum.amount ?? 0) + Number(totalInvoiced._sum.lateFee ?? 0);
    const collected = Number(totalPaid._sum.amount ?? 0);

    return { billed, collected, portfolio: billed - collected, overdueCount: overdue, pendingCount: pending };
  }

  async getMonthlyReport(academicYearId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { academicYearId },
      select: { month: true, amount: true, lateFee: true, status: true },
    });

    const byMonth: Record<number, { billed: number; collected: number; overdue: number }> = {};
    for (const inv of invoices) {
      if (!byMonth[inv.month]) byMonth[inv.month] = { billed: 0, collected: 0, overdue: 0 };
      byMonth[inv.month].billed += Number(inv.amount) + Number(inv.lateFee);
      if (inv.status === 'PAID') byMonth[inv.month].collected += Number(inv.amount);
      if (inv.status === 'OVERDUE') byMonth[inv.month].overdue++;
    }

    return Object.entries(byMonth)
      .map(([month, data]) => ({ month: Number(month), ...data }))
      .sort((a, b) => a.month - b.month);
  }
}
