import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MinLength,
  IsArray,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Role } from '@school/shared';
import { DocumentInputDto } from './document-input.dto';

export class CreateUserDto {
  @ApiProperty({ example: 'juan.perez@colegio.edu.co' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  @ApiPropertyOptional({ description: 'Si se omite se genera automáticamente' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiProperty({ enum: Role })
  @IsEnum(Role)
  role: Role;

  @ApiPropertyOptional({ enum: Role, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(Role, { each: true })
  additionalRoles?: Role[];

  @ApiProperty({ example: 'Juan' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  firstName: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  lastName: string;

  @ApiPropertyOptional({ example: '+573001234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'URL de la foto de perfil (devuelta por POST /uploads)' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Especialidad — solo se aplica si role=TEACHER' })
  @IsOptional()
  @IsString()
  speciality?: string;

  @ApiPropertyOptional({ description: 'Datos extendidos del perfil (documento, salud, contacto, etc.)' })
  @IsOptional()
  @IsObject()
  profile?: Record<string, unknown>;

  @ApiPropertyOptional({ type: [DocumentInputDto], description: 'Archivos a asociar a la persona' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentInputDto)
  documents?: DocumentInputDto[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  mustChangePassword?: boolean;
}
