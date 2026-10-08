import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@school/shared';
import { AcademicService } from './academic.service';
import { CreateAcademicYearDto, UpdateAcademicYearDto } from './dto/academic-year.dto';
import { CreateAcademicPeriodDto, UpdateAcademicPeriodDto } from './dto/academic-period.dto';
import { CreateGradeGroupDto, UpdateGradeGroupDto } from './dto/grade-group.dto';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/subject.dto';
import { SetGradeScalesDto } from './dto/grade-scale-config.dto';

const ADMIN_ROLES = [Role.SUPER_ADMIN, Role.RECTOR, Role.COORDINATOR_ACADEMIC, Role.SECRETARY];

@ApiTags('academic')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('academic')
export class AcademicController {
  constructor(private readonly academicService: AcademicService) {}

  // ─── Years ─────────────────────────────────────────────────────────────────

  @Get('years')
  @Roles(...ADMIN_ROLES, Role.COORDINATOR_CONVIVENCIA, Role.TEACHER, Role.STUDENT, Role.GUARDIAN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Listar años lectivos' })
  findAllYears() {
    return this.academicService.findAllYears();
  }

  @Get('years/:id')
  @Roles(...ADMIN_ROLES, Role.COORDINATOR_CONVIVENCIA, Role.TEACHER, Role.STUDENT, Role.GUARDIAN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Detalle de año lectivo con periodos, grupos y escala valorativa' })
  findOneYear(@Param('id') id: string) {
    return this.academicService.findOneYear(id);
  }

  @Post('years')
  @Roles(Role.SUPER_ADMIN, Role.RECTOR)
  @ApiOperation({ summary: 'Crear año lectivo' })
  createYear(@Body() dto: CreateAcademicYearDto) {
    return this.academicService.createYear(dto);
  }

  @Put('years/:id')
  @Roles(Role.SUPER_ADMIN, Role.RECTOR)
  @ApiOperation({ summary: 'Actualizar año lectivo' })
  updateYear(@Param('id') id: string, @Body() dto: UpdateAcademicYearDto) {
    return this.academicService.updateYear(id, dto);
  }

  // ─── Periods ───────────────────────────────────────────────────────────────

  @Get('years/:yearId/periods')
  @Roles(...ADMIN_ROLES, Role.TEACHER)
  @ApiOperation({ summary: 'Listar periodos de un año lectivo' })
  findPeriods(@Param('yearId') yearId: string) {
    return this.academicService.findPeriodsByYear(yearId);
  }

  @Post('periods')
  @Roles(Role.SUPER_ADMIN, Role.RECTOR, Role.COORDINATOR_ACADEMIC)
  @ApiOperation({ summary: 'Crear periodo académico' })
  createPeriod(@Body() dto: CreateAcademicPeriodDto) {
    return this.academicService.createPeriod(dto);
  }

  @Put('periods/:id')
  @Roles(Role.SUPER_ADMIN, Role.RECTOR, Role.COORDINATOR_ACADEMIC)
  @ApiOperation({ summary: 'Actualizar periodo académico' })
  updatePeriod(@Param('id') id: string, @Body() dto: UpdateAcademicPeriodDto) {
    return this.academicService.updatePeriod(id, dto);
  }

  @Post('periods/:id/close')
  @Roles(Role.SUPER_ADMIN, Role.RECTOR, Role.COORDINATOR_ACADEMIC)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar periodo (bloquea modificación de notas y asistencia)' })
  closePeriod(@Param('id') id: string, @Request() req: any) {
    return this.academicService.closePeriod(id, req.user.id);
  }

  @Post('periods/:id/reopen')
  @Roles(Role.SUPER_ADMIN, Role.RECTOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reapertura excepcional de periodo (requiere justificación — RF-CIERRE-05)' })
  reopenPeriod(@Param('id') id: string, @Body('justification') justification: string, @Request() req: any) {
    return this.academicService.reopenPeriod(id, req.user.id, justification);
  }

  // ─── Grade Groups ──────────────────────────────────────────────────────────

  @Get('years/:yearId/groups')
  @Roles(...ADMIN_ROLES, Role.TEACHER)
  @ApiOperation({ summary: 'Listar grupos de un año lectivo' })
  findGroups(@Param('yearId') yearId: string, @Request() req: any) {
    return this.academicService.findGroupsByYear(yearId, req.user);
  }

  @Post('groups')
  @Roles(Role.SUPER_ADMIN, Role.RECTOR, Role.COORDINATOR_ACADEMIC, Role.SECRETARY)
  @ApiOperation({ summary: 'Crear grupo (ej: 10A)' })
  createGroup(@Body() dto: CreateGradeGroupDto) {
    return this.academicService.createGroup(dto);
  }

  @Put('groups/:id')
  @Roles(Role.SUPER_ADMIN, Role.RECTOR, Role.COORDINATOR_ACADEMIC)
  @ApiOperation({ summary: 'Actualizar grupo' })
  updateGroup(@Param('id') id: string, @Body() dto: UpdateGradeGroupDto) {
    return this.academicService.updateGroup(id, dto);
  }

  @Delete('groups/:id')
  @Roles(Role.SUPER_ADMIN, Role.RECTOR)
  @ApiOperation({ summary: 'Eliminar grupo (solo si no tiene estudiantes)' })
  deleteGroup(@Param('id') id: string) {
    return this.academicService.deleteGroup(id);
  }

  // ─── Subjects ──────────────────────────────────────────────────────────────

  @Get('groups/:groupId/subjects')
  @Roles(...ADMIN_ROLES, Role.TEACHER, Role.STUDENT, Role.GUARDIAN)
  @ApiOperation({ summary: 'Listar materias de un grupo con docente asignado' })
  findSubjects(@Param('groupId') groupId: string, @Request() req: any) {
    return this.academicService.findSubjectsByGroup(groupId, req.user);
  }

  @Post('subjects')
  @Roles(Role.SUPER_ADMIN, Role.RECTOR, Role.COORDINATOR_ACADEMIC)
  @ApiOperation({ summary: 'Asignar materia a grupo con docente (RF-ACAD-05/06)' })
  createSubject(@Body() dto: CreateSubjectDto) {
    return this.academicService.createSubject(dto);
  }

  @Put('subjects/:id')
  @Roles(Role.SUPER_ADMIN, Role.RECTOR, Role.COORDINATOR_ACADEMIC)
  @ApiOperation({ summary: 'Actualizar materia / reasignar docente' })
  updateSubject(@Param('id') id: string, @Body() dto: UpdateSubjectDto) {
    return this.academicService.updateSubject(id, dto);
  }

  @Delete('subjects/:id')
  @Roles(Role.SUPER_ADMIN, Role.RECTOR)
  @ApiOperation({ summary: 'Eliminar materia' })
  deleteSubject(@Param('id') id: string) {
    return this.academicService.deleteSubject(id);
  }

  // ─── Grade Scale Config (RF-ACAD-07) ───────────────────────────────────────

  @Get('years/:yearId/grade-scales')
  @Roles(...ADMIN_ROLES, Role.TEACHER)
  @ApiOperation({ summary: 'Obtener escala valorativa (Decreto 1290) del año' })
  getGradeScales(@Param('yearId') yearId: string) {
    return this.academicService.getGradeScales(yearId);
  }

  @Post('grade-scales')
  @Roles(Role.SUPER_ADMIN, Role.RECTOR)
  @ApiOperation({ summary: 'Configurar escala valorativa institucional (no hardcodeada)' })
  setGradeScales(@Body() dto: SetGradeScalesDto) {
    return this.academicService.setGradeScales(dto);
  }
}
