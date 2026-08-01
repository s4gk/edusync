import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';
import { GradeScale } from '@school/shared';

export class UpsertGradeScaleConfigDto {
  @ApiProperty({ enum: GradeScale })
  @IsEnum(GradeScale)
  scale: GradeScale;

  @ApiProperty({ example: 4.6 })
  @IsNumber()
  @Min(0)
  @Max(5)
  minScore: number;

  @ApiProperty({ example: 5.0 })
  @IsNumber()
  @Min(0)
  @Max(5)
  maxScore: number;
}

export class SetGradeScalesDto {
  @ApiProperty({ type: [UpsertGradeScaleConfigDto] })
  scales: UpsertGradeScaleConfigDto[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  academicYearId: string;
}
