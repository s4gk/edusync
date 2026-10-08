import { Injectable, BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';

/**
 * Forma mínima del archivo que entrega multer (memoryStorage, por defecto en
 * FileInterceptor). No dependemos de @types/multer para no añadir dependencias.
 */
export interface UploadedFileLike {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

const ALLOWED: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
};

@Injectable()
export class UploadsService {
  // Carpeta servida como estática en main.ts bajo el prefijo /api/uploads/.
  private readonly dir = join(process.cwd(), 'uploads');

  async save(file: UploadedFileLike) {
    const fallbackExt = ALLOWED[file.mimetype];
    if (!fallbackExt) {
      throw new BadRequestException('Tipo de archivo no permitido (solo imágenes o PDF).');
    }
    await fs.mkdir(this.dir, { recursive: true });

    const ext = extname(file.originalname) || fallbackExt;
    const filename = `${randomUUID()}${ext}`;
    await fs.writeFile(join(this.dir, filename), file.buffer);

    return {
      url: `/api/uploads/${filename}`,
      name: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }
}
