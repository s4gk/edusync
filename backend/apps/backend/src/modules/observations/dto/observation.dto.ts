import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum ObservationType {
  ACADEMIC = 'ACADEMIC',
  DISCIPLINARY_POSITIVE = 'DISCIPLINARY_POSITIVE',
  DISCIPLINARY_NEUTRAL = 'DISCIPLINARY_NEUTRAL',
  DISCIPLINARY_MILD = 'DISCIPLINARY_MILD',
  DISCIPLINARY_SERIOUS = 'DISCIPLINARY_SERIOUS',
  DISCIPLINARY_VERY_SERIOUS = 'DISCIPLINARY_VERY_SERIOUS',
}

export class CreateObservationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ enum: ObservationType })
  @IsEnum(ObservationType)
  type: ObservationType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class QueryObservationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiPropertyOptional({ enum: ObservationType })
  @IsOptional()
  @IsEnum(ObservationType)
  type?: ObservationType;

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
