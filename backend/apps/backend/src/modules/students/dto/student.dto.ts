import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateStudentDto {
  @ApiProperty({ description: 'User ID existente o se crea uno nuevo con estos datos' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: '2025-001' })
  @IsString()
  @IsNotEmpty()
  enrollmentCode: string;

  @ApiProperty({ example: '1020304050' })
  @IsString()
  @IsNotEmpty()
  documentId: string;

  @ApiProperty({ example: '2008-05-15' })
  @IsDateString()
  birthDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Grupo inicial al crear' })
  @IsOptional()
  @IsString()
  gradeGroupId?: string;
}

export class UpdateStudentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  enrollmentCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  documentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gradeGroupId?: string;
}

export class QueryStudentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gradeGroupId?: string;

  @ApiPropertyOptional({ description: 'Filtra por grado (0=Preescolar … 11), todas sus secciones' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  gradeLevel?: number;

  @ApiPropertyOptional({ description: 'Solo estudiantes sin curso asignado' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  unassigned?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  academicYearId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  // 200 y no 100: las pantallas que piden el listado completo de un curso o del
  // colegio (Cursos, Certificados, Observaciones) piden 200, y con el tope en
  // 100 el backend respondía 400 y la lista salía vacía sin decir por qué.
  // Igual que el tope de asistencia, que ya era 200.
  @Max(200)
  limit?: number = 20;
}
