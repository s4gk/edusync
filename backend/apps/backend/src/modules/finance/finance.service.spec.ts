import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';

import { FinanceService } from './finance.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GenerateInvoicesDto, RegisterPaymentDto } from './dto/finance.dto';

// ─── Prisma mock ─────────────────────────────────────────────────────────────

const mockPrisma = {
  academicYear: { findUnique: jest.fn() },
  gradeGroup: { findMany: jest.fn() },
  tuitionConfig: { findUnique: jest.fn(), findMany: jest.fn(), upsert: jest.fn() },
  invoice: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  payment: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  student: { findUnique: jest.fn() },
  $transaction: jest.fn(),
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildAcademicYear(id = 'year-1') {
  return { id, name: '2025', startDate: new Date('2025-01-01'), endDate: new Date('2025-12-31') };
}

function buildTuitionConfig(overrides: Partial<Record<string, any>> = {}) {
  return {
    id: 'tc-1',
    academicYearId: 'year-1',
    gradeLevel: 10,
    enrollmentFee: 500000,
    monthlyFee: 350000,
    lateFeePercent: 5,
    ...overrides,
  };
}

function buildStudent(id = 'student-1') {
  return { id, academicYearId: 'year-1' };
}

function buildGradeGroup(students: any[] = [buildStudent()]) {
  return {
    id: 'group-1',
    name: '10A',
    gradeLevel: 10,
    academicYearId: 'year-1',
    students,
    academicYear: buildAcademicYear(),
  };
}

function buildInvoice(overrides: Partial<Record<string, any>> = {}) {
  return {
    id: 'inv-1',
    studentId: 'student-1',
    academicYearId: 'year-1',
    month: 4,
    amount: 350000,
    lateFee: 0,
    status: 'PENDING',
    dueDate: new Date('2025-04-05'),
    ...overrides,
  };
}

describe('FinanceService', () => {
  let service: FinanceService;
  let prisma: typeof mockPrisma;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanceService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<FinanceService>(FinanceService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── generateInvoices() ──────────────────────────────────────────────────

  describe('generateInvoices()', () => {
    const dto: GenerateInvoicesDto = {
      academicYearId: 'year-1',
      month: 4,
      dueDate: '2099-04-05', // far future so no late fee
    };

    it('should throw NotFoundException when academic year does not exist', async () => {
      mockPrisma.academicYear.findUnique.mockResolvedValue(null);

      await expect(service.generateInvoices(dto)).rejects.toThrow(NotFoundException);
    });

    it('should skip (not duplicate) when invoice already exists for that month', async () => {
      mockPrisma.academicYear.findUnique.mockResolvedValue(buildAcademicYear());
      mockPrisma.gradeGroup.findMany.mockResolvedValue([buildGradeGroup()]);
      mockPrisma.tuitionConfig.findUnique.mockResolvedValue(buildTuitionConfig());
      // Invoice already exists for this student + year + month
      mockPrisma.invoice.findUnique.mockResolvedValue(buildInvoice());

      const result = await service.generateInvoices(dto);

      expect(mockPrisma.invoice.create).not.toHaveBeenCalled();
      expect(result.created).toBe(0);
      expect(result.skipped).toBe(1);
    });

    it('should create invoices for all active students when no prior invoices exist', async () => {
      const students = [buildStudent('s-1'), buildStudent('s-2')];
      mockPrisma.academicYear.findUnique.mockResolvedValue(buildAcademicYear());
      mockPrisma.gradeGroup.findMany.mockResolvedValue([buildGradeGroup(students)]);
      mockPrisma.tuitionConfig.findUnique.mockResolvedValue(buildTuitionConfig());
      // No existing invoice for either student
      mockPrisma.invoice.findUnique.mockResolvedValue(null);
      mockPrisma.invoice.create.mockResolvedValue({});

      const result = await service.generateInvoices(dto);

      expect(mockPrisma.invoice.create).toHaveBeenCalledTimes(2);
      expect(result.created).toBe(2);
      expect(result.skipped).toBe(0);
      expect(result.month).toBe(4);
    });

    it('should skip students whose gradeGroup has no tuition config', async () => {
      const students = [buildStudent('s-1')];
      mockPrisma.academicYear.findUnique.mockResolvedValue(buildAcademicYear());
      mockPrisma.gradeGroup.findMany.mockResolvedValue([buildGradeGroup(students)]);
      // No config found
      mockPrisma.tuitionConfig.findUnique.mockResolvedValue(null);

      const result = await service.generateInvoices(dto);

      expect(mockPrisma.invoice.create).not.toHaveBeenCalled();
      expect(result.skipped).toBe(1);
      expect(result.created).toBe(0);
    });
  });

  // ─── registerPayment() ───────────────────────────────────────────────────

  describe('registerPayment()', () => {
    const dto: RegisterPaymentDto = {
      invoiceId: 'inv-1',
      receiptNumber: 'REC-001',
      paidAt: '2025-04-03',
      amount: 350000,
    };

    it('should throw NotFoundException when invoice is not found', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(null);

      await expect(service.registerPayment(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when invoice is already paid', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(buildInvoice({ status: 'PAID' }));

      await expect(service.registerPayment(dto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when receiptNumber already exists', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(buildInvoice({ status: 'PENDING' }));
      // Receipt already in DB
      mockPrisma.payment.findUnique.mockResolvedValue({ id: 'pay-old', receiptNumber: 'REC-001' });

      await expect(service.registerPayment(dto)).rejects.toThrow(ConflictException);
    });

    it('should create payment and mark invoice as PAID on success', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(buildInvoice({ status: 'PENDING' }));
      mockPrisma.payment.findUnique.mockResolvedValue(null);

      const newPayment = { id: 'pay-1', receiptNumber: 'REC-001', amount: 350000 };
      mockPrisma.$transaction.mockResolvedValue([newPayment]);

      const result = await service.registerPayment(dto);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual(newPayment);
    });
  });

  // ─── getSummary() ────────────────────────────────────────────────────────

  describe('getSummary()', () => {
    it('should return billed, collected, portfolio, overdueCount and pendingCount', async () => {
      const totalInvoiced = { _sum: { amount: 1000000, lateFee: 50000 } };
      const totalPaid = { _sum: { amount: 600000 } };
      const overdueCount = 3;
      const pendingCount = 5;

      mockPrisma.$transaction.mockResolvedValue([totalInvoiced, totalPaid, overdueCount, pendingCount]);

      const result = await service.getSummary('year-1');

      expect(result.billed).toBe(1050000);       // 1000000 + 50000
      expect(result.collected).toBe(600000);
      expect(result.portfolio).toBe(450000);      // billed - collected
      expect(result.overdueCount).toBe(3);
      expect(result.pendingCount).toBe(5);
    });

    it('should handle null aggregate sums gracefully (no invoices)', async () => {
      const totalInvoiced = { _sum: { amount: null, lateFee: null } };
      const totalPaid = { _sum: { amount: null } };

      mockPrisma.$transaction.mockResolvedValue([totalInvoiced, totalPaid, 0, 0]);

      const result = await service.getSummary('year-1');

      expect(result.billed).toBe(0);
      expect(result.collected).toBe(0);
      expect(result.portfolio).toBe(0);
    });
  });
});
