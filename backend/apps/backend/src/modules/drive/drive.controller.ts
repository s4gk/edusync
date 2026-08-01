import {
  Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@school/shared';
import { DriveService } from './drive.service';
import { CreateFolderDto, CreateFileDto, RenameDto } from './dto/drive.dto';

// Drive compartido: lo manejan docentes y el área administrativa (no estudiantes/acudientes).
const DRIVE_ROLES = [
  Role.SUPER_ADMIN, Role.RECTOR, Role.COORDINATOR_ACADEMIC, Role.COORDINATOR_CONVIVENCIA,
  Role.SECRETARY, Role.ACCOUNTANT, Role.TEACHER,
];

@ApiTags('drive')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...DRIVE_ROLES)
@Controller('drive')
export class DriveController {
  constructor(private readonly drive: DriveService) {}

  @Get()
  @ApiOperation({ summary: 'Listar carpetas y archivos de una carpeta (o la raíz)' })
  list(@Query('folderId') folderId?: string) {
    return this.drive.list(folderId);
  }

  @Post('folders')
  @ApiOperation({ summary: 'Crear carpeta' })
  createFolder(@Body() dto: CreateFolderDto, @Request() req: any) {
    return this.drive.createFolder(dto, req.user.id);
  }

  @Post('files')
  @ApiOperation({ summary: 'Registrar un archivo subido (vía POST /uploads) en una carpeta' })
  createFile(@Body() dto: CreateFileDto, @Request() req: any) {
    return this.drive.createFile(dto, req.user.id);
  }

  @Put('folders/:id')
  renameFolder(@Param('id') id: string, @Body() dto: RenameDto) {
    return this.drive.renameFolder(id, dto.name);
  }

  @Put('files/:id')
  renameFile(@Param('id') id: string, @Body() dto: RenameDto) {
    return this.drive.renameFile(id, dto.name);
  }

  @Delete('folders/:id')
  deleteFolder(@Param('id') id: string) {
    return this.drive.deleteFolder(id);
  }

  @Delete('files/:id')
  deleteFile(@Param('id') id: string) {
    return this.drive.deleteFile(id);
  }
}
