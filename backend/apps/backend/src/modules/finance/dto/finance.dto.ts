import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpsertTuitionConfigDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  academicYearId: string;

  @ApiProperty({ example: 10, description: 'Grado (0=Preescolar, 1-11)' })
  @IsInt()
  @Min(0)
  @Max(11)
  gradeLevel: number;

  @ApiProperty({ example: 500000 })
  @IsNumber()
  @Min(0)
  enrollmentFee: number;

  @ApiProperty({ example: 350000 })
  @IsNumber()
  @Min(0)
  monthlyFee: number;

  @ApiPropertyOptional({ example: 5, description: '% mora mensual' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  lateFeePercent?: number;
}

export class GenerateInvoicesDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  academicYearId: string;

  @ApiProperty({ example: 4, description: 'Mes (1-12)' })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiPropertyOptional({ description: 'Solo para un grupo específico; si se omite genera para todos' })
  @IsOptional()
  @IsString()
  gradeGroupId?: string;

  @ApiProperty({ example: '2025-04-05', description: 'Fecha límite de pago' })
  @IsDateString()
  dueDate: string;
}

export class RegisterPaymentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  invoiceId: string;

  @ApiProperty({ example: 'REC-2025-001' })
  @IsString()
  @IsNotEmpty()
  receiptNumber: string;

  @ApiProperty({ example: '2025-04-03' })
  @IsDateString()
  paidAt: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount: number;
}

export class QueryInvoiceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  academicYearId?: string;

  @ApiPropertyOptional({ enum: ['PENDING', 'PAID', 'OVERDUE', 'IN_ARREARS'] })
  @IsOptional()
  @IsEnum(['PENDING', 'PAID', 'OVERDUE', 'IN_ARREARS'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 50;
}
