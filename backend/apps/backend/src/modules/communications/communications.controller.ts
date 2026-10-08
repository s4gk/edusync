import {
  Controller, Get, Post, Delete,
  Param, Body, Query, UseGuards, HttpCode, HttpStatus, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@school/shared';
import { CommunicationsService } from './communications.service';
import { CreateAnnouncementDto, QueryAnnouncementDto } from './dto/announcement.dto';

@ApiTags('communications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('communications')
export class CommunicationsController {
  constructor(private readonly communicationsService: CommunicationsService) {}

  @Post('announcements')
  @Roles(Role.SUPER_ADMIN, Role.RECTOR, Role.COORDINATOR_ACADEMIC, Role.COORDINATOR_CONVIVENCIA, Role.SECRETARY)
  @ApiOperation({ summary: 'Crear aviso institucional con segmentación (RF-COM-01/02)' })
  createAnnouncement(@Body() dto: CreateAnnouncementDto, @Request() req: any) {
    return this.communicationsService.createAnnouncement(dto, req.user.id);
  }

  @Get('announcements')
  @Roles(Role.SUPER_ADMIN, Role.RECTOR, Role.COORDINATOR_ACADEMIC, Role.COORDINATOR_CONVIVENCIA,
    Role.TEACHER, Role.STUDENT, Role.GUARDIAN, Role.SECRETARY)
  @ApiOperation({ summary: 'Listar avisos publicados — tablón (RF-COM-01)' })
  findAnnouncements(@Query() query: QueryAnnouncementDto) {
    return this.communicationsService.findAnnouncements(query);
  }

  @Post('announcements/:id/publish')
  @Roles(Role.SUPER_ADMIN, Role.RECTOR, Role.COORDINATOR_ACADEMIC, Role.SECRETARY)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publicar aviso y enviar notificaciones in-app (RF-COM-03/04)' })
  publish(@Param('id') id: string) {
    return this.communicationsService.publish(id);
  }

  @Delete('announcements/:id')
  @Roles(Role.SUPER_ADMIN, Role.RECTOR)
  @ApiOperation({ summary: 'Eliminar aviso' })
  delete(@Param('id') id: string) {
    return this.communicationsService.deleteAnnouncement(id);
  }
}
