import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@school/shared';
import { GradesService } from './grades.service';
import {
  CreateAchievementDto, UpdateAchievementDto,
  CreateActivityDto, UpdateActivityDto,
  SaveScoresDto, QueryGradesDto,
} from './dto/grades.dto';

@ApiTags('grades')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  // ─── Achievements (Logros) ─────────────────────────────────────────────────

  @Get('achievements')
  @Roles(Role.TEACHER, Role.COORDINATOR_ACADEMIC, Role.RECTOR, Role.SUPER_ADMIN, Role.STUDENT, Role.GUARDIAN)
  @ApiOperation({ summary: 'Listar logros por materia/periodo (RF-CAL-01)' })
  findAchievements(@Query('subjectId') subjectId: string, @Request() req: any, @Query('periodNumber') periodNumber?: number) {
    return this.gradesService.findAchievements(subjectId, periodNumber ? Number(periodNumber) : undefined, req.user);
  }

  @Post('achievements')
  @Roles(Role.TEACHER, Role.COORDINATOR_ACADEMIC, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Crear logro con peso% (RF-CAL-01/05)' })
  createAchievement(@Body() dto: CreateAchievementDto, @Request() req: any) {
    return this.gradesService.createAchievement(dto, req.user);
  }

  @Put('achievements/:id')
  @Roles(Role.TEACHER, Role.COORDINATOR_ACADEMIC, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Actualizar logro' })
  updateAchievement(@Param('id') id: string, @Body() dto: UpdateAchievementDto) {
    return this.gradesService.updateAchievement(id, dto);
  }

  @Delete('achievements/:id')
  @Roles(Role.TEACHER, Role.COORDINATOR_ACADEMIC, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Eliminar logro' })
  deleteAchievement(@Param('id') id: string) {
    return this.gradesService.deleteAchievement(id);
  }

  // ─── Activities ────────────────────────────────────────────────────────────

  @Post('activities')
  @Roles(Role.TEACHER, Role.COORDINATOR_ACADEMIC, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Crear actividad evaluativa con peso% (RF-CAL-01/05)' })
  createActivity(@Body() dto: CreateActivityDto, @Request() req: any) {
    return this.gradesService.createActivity(dto, req.user);
  }

  @Put('activities/:id')
  @Roles(Role.TEACHER, Role.COORDINATOR_ACADEMIC, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Actualizar actividad' })
  updateActivity(@Param('id') id: string, @Body() dto: UpdateActivityDto) {
    return this.gradesService.updateActivity(id, dto);
  }

  @Delete('activities/:id')
  @Roles(Role.TEACHER, Role.COORDINATOR_ACADEMIC, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Eliminar actividad' })
  deleteActivity(@Param('id') id: string) {
    return this.gradesService.deleteActivity(id);
  }

  // ─── Scores (Notas) ────────────────────────────────────────────────────────

  @Post('scores')
  @Roles(Role.TEACHER, Role.COORDINATOR_ACADEMIC, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Ingresar notas en matriz — batch (RF-CAL-02). Calcula automáticamente nota ponderada y escala.' })
  saveScores(@Body() dto: SaveScoresDto, @Request() req: any) {
    return this.gradesService.saveScores(dto, req.user);
  }

  // ─── Matrix View ───────────────────────────────────────────────────────────

  @Get('matrix')
  @Roles(Role.TEACHER, Role.COORDINATOR_ACADEMIC, Role.RECTOR, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Matriz de calificaciones: estudiantes x actividades (RF-CAL-02)' })
  getMatrix(@Query('subjectId') subjectId: string, @Query('periodNumber') periodNumber: string, @Request() req: any) {
    return this.gradesService.getMatrix(subjectId, Number(periodNumber), req.user);
  }

  @Get()
  @Roles(Role.TEACHER, Role.COORDINATOR_ACADEMIC, Role.RECTOR, Role.SUPER_ADMIN, Role.STUDENT, Role.GUARDIAN)
  @ApiOperation({ summary: 'Consultar notas finales por materia/estudiante/periodo (RF-CAL-03/04)' })
  getStudentGrades(@Query() query: QueryGradesDto, @Request() req: any) {
    return this.gradesService.getStudentGrades(query, req.user);
  }

  // ─── Period Validation (RF-CIERRE-01) ─────────────────────────────────────

  @Get('validate-close')
  @Roles(Role.COORDINATOR_ACADEMIC, Role.RECTOR, Role.SUPER_ADMIN)
  @ApiOperation({ summary: '¿Todos los profes subieron notas? Validación previa al cierre (RF-CIERRE-01/02)' })
  validatePeriodClose(
    @Query('academicYearId') academicYearId: string,
    @Query('periodNumber') periodNumber: string,
  ) {
    return this.gradesService.validatePeriodClose(academicYearId, Number(periodNumber));
  }
}
