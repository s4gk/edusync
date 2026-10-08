import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Todos opcionales: la pantalla guarda por secciones (merge en el servicio). */
export class UpdateSchoolDto {
  @ApiPropertyOptional({ example: 'Institución Educativa San Mateo' })
  @IsOptional() @IsString() @MaxLength(160)
  name?: string;

  @ApiPropertyOptional({ example: '900.123.456-7' })
  @IsOptional() @IsString() @MaxLength(40)
  nit?: string;

  @ApiPropertyOptional({ description: 'Código DANE', example: '105001000123' })
  @IsOptional() @IsString() @MaxLength(40)
  dane?: string;

  @ApiPropertyOptional({ example: 'Resolución N.° 1234 del 12 de mayo de 2019' })
  @IsOptional() @IsString() @MaxLength(200)
  resolution?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200)
  address?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80)
  city?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80)
  department?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120)
  email?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(160)
  website?: string;

  @ApiPropertyOptional({ description: 'Nombre del rector(a) que firma' })
  @IsOptional() @IsString() @MaxLength(160)
  rector?: string;

  @ApiPropertyOptional({ description: 'Correo para consultas de habeas data' })
  @IsOptional() @IsString() @MaxLength(120)
  privacyEmail?: string;

  @ApiPropertyOptional({ example: 'A' }) @IsOptional() @IsString() @MaxLength(20)
  calendar?: string;

  @ApiPropertyOptional({ example: 'Académico' }) @IsOptional() @IsString() @MaxLength(60)
  character?: string;
}
