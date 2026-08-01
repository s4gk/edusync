import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateGradeGroupDto {
  @ApiProperty({ example: '10A' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 10, description: '0=Preescolar, 1-11=Primaria/Secundaria' })
  @IsInt()
  @Min(0)
  @Max(11)
  gradeLevel: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  academicYearId: string;
}

export class UpdateGradeGroupDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(11)
  gradeLevel?: number;

  @ApiPropertyOptional({ description: 'Teacher ID del director de grupo (titular). Vacío para quitar.' })
  @IsOptional()
  @IsString()
  directorId?: string;
}
