import {
  Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@school/shared';
import { ScheduleService } from './schedule.service';
import { CreateScheduleSlotDto, UpdateScheduleSlotDto } from './dto/schedule.dto';

const WRITE_ROLES = [Role.SUPER_ADMIN, Role.RECTOR, Role.COORDINATOR_ACADEMIC];
const READ_ROLES = [Role.SUPER_ADMIN, Role.RECTOR, Role.COORDINATOR_ACADEMIC, Role.SECRETARY, Role.TEACHER];

@ApiTags('schedule')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get('teachers')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Docentes con materias y carga horaria (vista admin)' })
  listTeachers() {
    return this.scheduleService.listTeachers();
  }

  @Get('me')
  @Roles(Role.TEACHER, Role.SUPER_ADMIN, Role.RECTOR, Role.COORDINATOR_ACADEMIC)
  @ApiOperation({ summary: 'Mi horario (docente logueado)' })
  mySchedule(@Request() req: any) {
    return this.scheduleService.findByUser(req.user.id);
  }

  @Get()
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Horario por grupo o por docente' })
  find(@Query('gradeGroupId') gradeGroupId?: string, @Query('teacherId') teacherId?: string) {
    if (teacherId) return this.scheduleService.findByTeacher(teacherId);
    if (gradeGroupId) return this.scheduleService.findByGroup(gradeGroupId);
    return [];
  }

  @Post()
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Asignar materia a un día/bloque (valida cruces)' })
  create(@Body() dto: CreateScheduleSlotDto) {
    return this.scheduleService.create(dto);
  }

  @Put(':id')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Actualizar aula de un slot' })
  update(@Param('id') id: string, @Body() dto: UpdateScheduleSlotDto) {
    return this.scheduleService.update(id, dto);
  }

  @Delete(':id')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Quitar una asignación del horario' })
  remove(@Param('id') id: string) {
    return this.scheduleService.remove(id);
  }
}
