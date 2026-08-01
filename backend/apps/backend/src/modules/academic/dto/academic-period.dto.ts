import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateAcademicPeriodDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  academicYearId: string;

  @ApiProperty({ example: 'Primer Periodo' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 1, minimum: 1, maximum: 6 })
  @IsInt()
  @Min(1)
  @Max(6)
  periodNumber: number;

  @ApiProperty({ example: '2025-02-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2025-04-30' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: 25, description: 'Peso en la nota final (%)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  weightPercent: number;
}

export class UpdateAcademicPeriodDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  weightPercent?: number;
}
