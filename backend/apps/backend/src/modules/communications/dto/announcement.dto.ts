import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum AnnouncementTarget {
  ALL = 'ALL',
  GRADE_LEVEL = 'GRADE_LEVEL',
  GRADE_GROUP = 'GRADE_GROUP',
  STUDENT = 'STUDENT',
}

export class CreateAnnouncementDto {
  @ApiProperty({ example: 'Reunión de padres de familia' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({ enum: AnnouncementTarget, default: AnnouncementTarget.ALL })
  @IsEnum(AnnouncementTarget)
  target: AnnouncementTarget;

  @ApiPropertyOptional({ description: 'Requerido si target=GRADE_LEVEL' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(11)
  gradeLevel?: number;

  @ApiPropertyOptional({ description: 'Requerido si target=GRADE_GROUP' })
  @IsOptional()
  @IsString()
  gradeGroupId?: string;

  @ApiPropertyOptional({ description: 'Requerido si target=STUDENT' })
  @IsOptional()
  @IsString()
  studentId?: string;
}

export class QueryAnnouncementDto {
  @ApiPropertyOptional({ enum: AnnouncementTarget })
  @IsOptional()
  @IsEnum(AnnouncementTarget)
  target?: AnnouncementTarget;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gradeGroupId?: string;

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
  @Max(100)
  limit?: number = 20;
}
