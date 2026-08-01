import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// ─── Achievement (Logro) ──────────────────────────────────────────────────────

export class CreateAchievementDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @ApiProperty({ example: 1, description: 'Número de periodo (1-4)' })
  @IsInt()
  @Min(1)
  @Max(4)
  periodNumber: number;

  @ApiProperty({ example: 'Pensamiento numérico' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 50, description: 'Peso en la nota de la materia (%)' })
  @IsNumber()
  @Min(1)
  @Max(100)
  weightPercent: number;
}

export class UpdateAchievementDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  weightPercent?: number;
}

// ─── Activity (Actividad evaluativa) ─────────────────────────────────────────

export class CreateActivityDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  achievementId: string;

  @ApiProperty({ example: 'Taller #1' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 40, description: 'Peso dentro del logro (%)' })
  @IsNumber()
  @Min(1)
  @Max(100)
  weightPercent: number;

  @ApiPropertyOptional({ default: 5.0 })
  @IsOptional()
  @IsNumber()
  maxScore?: number;

  @ApiPropertyOptional({ example: '2025-03-15' })
  @IsOptional()
  @IsDateString()
  date?: string;
}

export class UpdateActivityDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  weightPercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date?: string;
}

// ─── Scores (Notas) ───────────────────────────────────────────────────────────

export class ScoreEntryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ example: 4.5 })
  @IsNumber()
  @Min(0)
  @Max(5)
  score: number;
}

export class SaveScoresDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  activityId: string;

  @ApiProperty({ type: [ScoreEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScoreEntryDto)
  scores: ScoreEntryDto[];
}

export class QueryGradesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(4)
  periodNumber?: number;
}
