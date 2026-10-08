import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateScheduleSlotDto {
  @ApiProperty({ description: 'Materia (define grupo y docente)' })
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @ApiProperty({ example: 1, description: 'Día de la semana (1=Lunes … 5=Viernes)' })
  @IsInt()
  @Min(1)
  @Max(5)
  dayOfWeek: number;

  @ApiProperty({ example: 1, description: 'Bloque/hora del día (1..8)' })
  @IsInt()
  @Min(1)
  @Max(8)
  block: number;

  @ApiPropertyOptional({ example: '204' })
  @IsOptional()
  @IsString()
  room?: string;
}

export class UpdateScheduleSlotDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  room?: string;
}
