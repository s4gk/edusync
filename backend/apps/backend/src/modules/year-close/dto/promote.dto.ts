import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PromotionAssignmentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ description: 'Curso del año destino al que queda asignado' })
  @IsString()
  @IsNotEmpty()
  gradeGroupId: string;
}

export class PromoteDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fromYearId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  toYearId: string;

  // La lista viene del preview, ya revisada y con los ajustes que haya hecho
  // rectoría: el servidor mueve exactamente lo que se le manda, no vuelve a
  // decidir por su cuenta.
  @ApiProperty({ type: [PromotionAssignmentDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PromotionAssignmentDto)
  assignments: PromotionAssignmentDto[];
}
