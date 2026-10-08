import {
  Controller, Get, Post, Patch, Delete,
  Param, Query, UseGuards, HttpCode, HttpStatus, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@school/shared';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('run-alerts')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.SUPER_ADMIN, Role.RECTOR, Role.COORDINATOR_ACADEMIC, Role.COORDINATOR_CONVIVENCIA)
  @ApiOperation({ summary: 'Genera alertas automáticas (bajo rendimiento, inasistencia) para acudientes' })
  runAlerts() {
    return this.notificationsService.runAlerts();
  }

  @Get()
  @ApiOperation({ summary: 'Listar notificaciones del usuario autenticado (RF-COM-04)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(@Request() req: any, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.notificationsService.findAll(req.user.id, Number(page) || 1, Number(limit) || 20);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Cantidad de notificaciones no leídas' })
  unreadCount(@Request() req: any) {
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar todas las notificaciones como leídas' })
  markAllRead(@Request() req: any) {
    return this.notificationsService.markAllRead(req.user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marcar una notificación como leída' })
  markRead(@Param('id') id: string, @Request() req: any) {
    return this.notificationsService.markRead(id, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar notificación' })
  deleteOne(@Param('id') id: string, @Request() req: any) {
    return this.notificationsService.deleteOne(id, req.user.id);
  }
}
