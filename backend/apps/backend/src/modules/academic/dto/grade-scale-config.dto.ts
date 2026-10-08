import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsEnum, IsNotEmpty, IsNumber, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
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
  // Sin @IsArray/@ValidateNested el ValidationPipe global (whitelist +
  // forbidNonWhitelisted) rechazaba la propiedad entera: la escala de
  // valoración del Decreto 1290 no se podía guardar por ningún medio.
  @ApiProperty({ type: [UpsertGradeScaleConfigDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => UpsertGradeScaleConfigDto)
  scales: UpsertGradeScaleConfigDto[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  academicYearId: string;
}
