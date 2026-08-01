import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFolderDto, CreateFileDto } from './dto/drive.dto';

const USER_SEL = { select: { id: true, firstName: true, lastName: true } };

@Injectable()
export class DriveService {
  constructor(private readonly prisma: PrismaService) {}

  /** Contenido de una carpeta (o de la raíz si no hay folderId) + migas de pan. */
  async list(folderId?: string) {
    let folder: any = null;
    const breadcrumbs: { id: string; name: string }[] = [];

    if (folderId) {
      folder = await this.prisma.driveFolder.findUnique({ where: { id: folderId } });
      if (!folder) throw new NotFoundException('Carpeta no encontrada');
      let cur: any = folder;
      while (cur) {
        breadcrumbs.unshift({ id: cur.id, name: cur.name });
        cur = cur.parentId ? await this.prisma.driveFolder.findUnique({ where: { id: cur.parentId } }) : null;
      }
    }

    const folders = await this.prisma.driveFolder.findMany({
      where: { parentId: folderId ?? null },
      orderBy: { name: 'asc' },
      include: { createdBy: USER_SEL, _count: { select: { children: true, files: true } } },
    });
    const files = await this.prisma.driveFile.findMany({
      where: { folderId: folderId ?? null },
      orderBy: { createdAt: 'desc' },
      include: { uploadedBy: USER_SEL },
    });

    return { folder, breadcrumbs, folders, files };
  }

  createFolder(dto: CreateFolderDto, userId: string) {
    return this.prisma.driveFolder.create({
      data: { name: dto.name, parentId: dto.parentId ?? null, createdById: userId },
    });
  }

  createFile(dto: CreateFileDto, userId: string) {
    return this.prisma.driveFile.create({
      data: {
        name: dto.name,
        folderId: dto.folderId ?? null,
        fileUrl: dto.fileUrl,
        mimeType: dto.mimeType,
        size: dto.size,
        uploadedById: userId,
      },
    });
  }

  renameFolder(id: string, name: string) {
    return this.prisma.driveFolder.update({ where: { id }, data: { name } });
  }
  renameFile(id: string, name: string) {
    return this.prisma.driveFile.update({ where: { id }, data: { name } });
  }

  async deleteFolder(id: string) {
    await this.prisma.driveFolder.delete({ where: { id } }); // cascade: subcarpetas + archivos
    return { id };
  }
  async deleteFile(id: string) {
    await this.prisma.driveFile.delete({ where: { id } });
    return { id };
  }
}
