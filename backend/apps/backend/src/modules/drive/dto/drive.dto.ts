import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFolderDto {
  @ApiProperty({ example: 'Talleres 2026' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Carpeta padre (vacío = raíz)' })
  @IsOptional()
  @IsString()
  parentId?: string;
}

export class CreateFileDto {
  @ApiProperty({ example: 'taller-1.pdf' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'URL devuelta por POST /uploads' })
  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  folderId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  size?: number;
}

export class RenameDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;
}
