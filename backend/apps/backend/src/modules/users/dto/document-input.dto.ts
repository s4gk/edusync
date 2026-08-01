import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/** Referencia a un archivo ya subido vía POST /uploads, listo para asociar a una persona. */
export class DocumentInputDto {
  @ApiProperty({ example: 'registro_civil', description: 'Categoría/tipo de soporte' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'Registro civil.pdf' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '/api/uploads/abc.pdf', description: 'URL devuelta por POST /uploads' })
  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  size?: number;
}
