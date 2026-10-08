import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum EnrollmentStatus {
  PRE_ENROLLED = 'PRE_ENROLLED',
  FORMALIZED = 'FORMALIZED',
  RETIRED = 'RETIRED',
  TRANSFERRED = 'TRANSFERRED',
}

export class EnrollmentDocumentDto {
  @ApiProperty({ example: 'Registro civil' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  isDelivered?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateEnrollmentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  academicYearId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  gradeGroupId: string;

  @ApiPropertyOptional({ type: [EnrollmentDocumentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnrollmentDocumentDto)
  documents?: EnrollmentDocumentDto[];
}

export class UpdateEnrollmentStatusDto {
  @ApiProperty({ enum: EnrollmentStatus })
  @IsEnum(EnrollmentStatus)
  status: EnrollmentStatus;

  @ApiPropertyOptional({ description: 'Requerido si status=RETIRED o TRANSFERRED' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class LinkGuardianDto {
  @ApiProperty({ description: 'Guardian ID a vincular' })
  @IsString()
  @IsNotEmpty()
  guardianId: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  isPrimary?: boolean;
}

export class RenewEnrollmentDto {
  @ApiProperty({ description: 'Año lectivo destino' })
  @IsString()
  @IsNotEmpty()
  academicYearId: string;

  @ApiProperty({ description: 'Grupo destino (puede ser diferente si hay promoción)' })
  @IsString()
  @IsNotEmpty()
  gradeGroupId: string;
}
