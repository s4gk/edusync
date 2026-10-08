import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DocumentInputDto } from '../../users/dto/document-input.dto';

export class GuardianStudentLinkDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiPropertyOptional({ default: false, description: 'Acudiente principal del estudiante' })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class CreateGuardianDto {
  @ApiProperty({ example: 'maria.gomez@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'María' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Gómez' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'Madre', description: 'Parentesco con el/los estudiante(s)' })
  @IsString()
  @IsNotEmpty()
  relation: string;

  @ApiPropertyOptional({ example: '+573001234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Si se omite se genera una contraseña temporal' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({ description: 'URL de la foto (devuelta por POST /uploads)' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Datos extendidos del perfil' })
  @IsOptional()
  @IsObject()
  profile?: Record<string, unknown>;

  @ApiPropertyOptional({ type: [DocumentInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentInputDto)
  documents?: DocumentInputDto[];

  @ApiPropertyOptional({ type: [GuardianStudentLinkDto], description: 'Estudiantes a vincular' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuardianStudentLinkDto)
  students?: GuardianStudentLinkDto[];
}

export class QueryGuardianDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number;
}
