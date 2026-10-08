import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, UseGuards, HttpCode, HttpStatus, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@school/shared';
import { StudentsService } from './students.service';
import { CreateStudentDto, UpdateStudentDto, QueryStudentDto } from './dto/student.dto';
import { CreateEnrollmentDto, UpdateEnrollmentStatusDto, LinkGuardianDto, RenewEnrollmentDto } from './dto/enrollment.dto';

const ADMIN = [Role.SUPER_ADMIN, Role.RECTOR, Role.COORDINATOR_ACADEMIC, Role.SECRETARY];

@ApiTags('students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @Roles(...ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Listar estudiantes con filtros' })
  findAll(@Query() query: QueryStudentDto, @Request() req: any) {
    return this.studentsService.findAll(query, req.user);
  }

  @Get(':id')
  @Roles(...ADMIN, Role.TEACHER, Role.GUARDIAN)
  @ApiOperation({ summary: 'Perfil completo del estudiante con matrículas y acudientes' })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.studentsService.findOne(id, req.user);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.SECRETARY)
  @ApiOperation({ summary: 'Crear perfil de estudiante' })
  create(@Body() dto: CreateStudentDto) {
    return this.studentsService.create(dto);
  }

  @Put(':id')
  @Roles(...ADMIN)
  @ApiOperation({ summary: 'Actualizar datos del estudiante' })
  update(@Param('id') id: string, @Body() dto: UpdateStudentDto) {
    return this.studentsService.update(id, dto);
  }

  // ─── Guardians ─────────────────────────────────────────────────────────────

  @Post(':id/guardians')
  @Roles(...ADMIN)
  @ApiOperation({ summary: 'Vincular acudiente a estudiante (RF-USR-03/04)' })
  linkGuardian(@Param('id') id: string, @Body() dto: LinkGuardianDto) {
    return this.studentsService.linkGuardian(id, dto);
  }

  @Delete(':id/guardians/:guardianId')
  @Roles(Role.SUPER_ADMIN, Role.SECRETARY)
  @ApiOperation({ summary: 'Desvincular acudiente' })
  unlinkGuardian(@Param('id') id: string, @Param('guardianId') guardianId: string) {
    return this.studentsService.unlinkGuardian(id, guardianId);
  }

  // ─── Enrollments ───────────────────────────────────────────────────────────

  @Get(':id/enrollments')
  @Roles(...ADMIN, Role.TEACHER, Role.GUARDIAN, Role.STUDENT)
  @ApiOperation({ summary: 'Historial de matrículas del estudiante (RF-MAT-05)' })
  getEnrollmentHistory(@Param('id') id: string) {
    return this.studentsService.getEnrollmentHistory(id);
  }

  @Post('enrollments')
  @Roles(...ADMIN)
  @ApiOperation({ summary: 'Crear matrícula (RF-MAT-01)' })
  createEnrollment(@Body() dto: CreateEnrollmentDto) {
    return this.studentsService.createEnrollment(dto);
  }

  @Put('enrollments/:enrollmentId/status')
  @Roles(...ADMIN)
  @ApiOperation({ summary: 'Cambiar estado de matrícula (RF-MAT-03): PRE→FORMALIZADA→RETIRADO/TRASLADADO' })
  updateEnrollmentStatus(@Param('enrollmentId') id: string, @Body() dto: UpdateEnrollmentStatusDto) {
    return this.studentsService.updateEnrollmentStatus(id, dto);
  }

  @Post(':id/enrollments/renew')
  @Roles(...ADMIN)
  @ApiOperation({ summary: 'Renovar matrícula para nuevo año lectivo (RF-MAT-02)' })
  renewEnrollment(@Param('id') id: string, @Body() dto: RenewEnrollmentDto) {
    return this.studentsService.renewEnrollment(id, dto);
  }

  @Put('documents/:docId')
  @Roles(...ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar documento como entregado/pendiente (RF-MAT-04)' })
  updateDocument(
    @Param('docId') docId: string,
    @Body('isDelivered') isDelivered: boolean,
    @Body('notes') notes?: string,
  ) {
    return this.studentsService.updateDocument(docId, isDelivered, notes);
  }
}
