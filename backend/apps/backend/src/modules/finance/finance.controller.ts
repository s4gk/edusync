import {
  Controller, Get, Post, Put,
  Param, Body, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@school/shared';
import { FinanceService } from './finance.service';
import { UpsertTuitionConfigDto, GenerateInvoicesDto, RegisterPaymentDto, QueryInvoiceDto } from './dto/finance.dto';

const FINANCE_ROLES = [Role.SUPER_ADMIN, Role.RECTOR, Role.ACCOUNTANT, Role.SECRETARY];

@ApiTags('finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // ─── Tuition Config ────────────────────────────────────────────────────────

  @Get('tuition/:academicYearId')
  @Roles(...FINANCE_ROLES)
  @ApiOperation({ summary: 'Tarifas por grado del año lectivo' })
  getTuitionConfigs(@Param('academicYearId') academicYearId: string) {
    return this.financeService.getTuitionConfigs(academicYearId);
  }

  @Post('tuition')
  @Roles(Role.SUPER_ADMIN, Role.RECTOR, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Crear o actualizar tarifa de un grado' })
  upsertTuitionConfig(@Body() dto: UpsertTuitionConfigDto) {
    return this.financeService.upsertTuitionConfig(dto);
  }

  // ─── Invoices ──────────────────────────────────────────────────────────────

  @Get('invoices')
  @Roles(...FINANCE_ROLES, Role.GUARDIAN, Role.STUDENT)
  @ApiOperation({ summary: 'Listar facturas con filtros' })
  findInvoices(@Query() query: QueryInvoiceDto) {
    return this.financeService.findInvoices(query);
  }

  @Post('invoices/generate')
  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTANT, Role.SECRETARY)
  @ApiOperation({ summary: 'Generar facturas del mes para todos los estudiantes activos' })
  generateInvoices(@Body() dto: GenerateInvoicesDto) {
    return this.financeService.generateInvoices(dto);
  }

  @Get('invoices/student/:studentId/balance')
  @Roles(...FINANCE_ROLES, Role.GUARDIAN, Role.STUDENT)
  @ApiOperation({ summary: 'Saldo y cartera de un estudiante' })
  getStudentBalance(@Param('studentId') studentId: string) {
    return this.financeService.getStudentBalance(studentId);
  }

  // ─── Payments ──────────────────────────────────────────────────────────────

  @Post('payments')
  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTANT, Role.SECRETARY)
  @ApiOperation({ summary: 'Registrar pago de una factura con número de recibo' })
  registerPayment(@Body() dto: RegisterPaymentDto) {
    return this.financeService.registerPayment(dto);
  }

  // ─── Reports ───────────────────────────────────────────────────────────────

  @Get('summary/:academicYearId')
  @Roles(...FINANCE_ROLES)
  @ApiOperation({ summary: 'Resumen financiero: facturado, recaudado, cartera' })
  getSummary(@Param('academicYearId') academicYearId: string) {
    return this.financeService.getSummary(academicYearId);
  }

  @Get('monthly/:academicYearId')
  @Roles(...FINANCE_ROLES)
  @ApiOperation({ summary: 'Reporte de recaudo mes a mes (RF-REP-05)' })
  getMonthlyReport(@Param('academicYearId') academicYearId: string) {
    return this.financeService.getMonthlyReport(academicYearId);
  }
}
