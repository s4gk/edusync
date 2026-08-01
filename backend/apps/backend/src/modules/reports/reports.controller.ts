import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@school/shared';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.RECTOR, Role.COORDINATOR_ACADEMIC, Role.COORDINATOR_CONVIVENCIA, Role.SECRETARY)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('course-performance')
  @ApiOperation({ summary: 'RF-REP-01: Rendimiento académico por curso/materia' })
  @ApiQuery({ name: 'academicYearId', required: true })
  @ApiQuery({ name: 'period', required: false, enum: ['P1', 'P2', 'P3', 'P4'] })
  @ApiQuery({ name: 'gradeGroupId', required: false })
  coursePerformance(
    @Query('academicYearId') academicYearId: string,
    @Query('period') period?: string,
    @Query('gradeGroupId') gradeGroupId?: string,
  ) {
    return this.reportsService.coursePerformance(academicYearId, period, gradeGroupId);
  }

  @Get('teacher-performance')
  @ApiOperation({ summary: 'RF-REP-02: Rendimiento por docente' })
  @ApiQuery({ name: 'academicYearId', required: true })
  @ApiQuery({ name: 'period', required: false, enum: ['P1', 'P2', 'P3', 'P4'] })
  teacherPerformance(
    @Query('academicYearId') academicYearId: string,
    @Query('period') period?: string,
  ) {
    return this.reportsService.teacherPerformance(academicYearId, period);
  }

  @Get('at-risk')
  @ApiOperation({ summary: 'RF-REP-03: Estudiantes en riesgo (2+ BAJO en el período)' })
  @ApiQuery({ name: 'academicYearId', required: true })
  @ApiQuery({ name: 'period', required: false, enum: ['P1', 'P2', 'P3', 'P4'] })
  atRiskStudents(
    @Query('academicYearId') academicYearId: string,
    @Query('period') period?: string,
  ) {
    return this.reportsService.atRiskStudents(academicYearId, period);
  }

  @Get('attendance')
  @ApiOperation({ summary: 'RF-REP-04: Reporte consolidado de asistencia' })
  @ApiQuery({ name: 'academicYearId', required: true })
  @ApiQuery({ name: 'gradeGroupId', required: false })
  @ApiQuery({ name: 'from', required: false, description: 'ISO date' })
  @ApiQuery({ name: 'to', required: false, description: 'ISO date' })
  attendanceReport(
    @Query('academicYearId') academicYearId: string,
    @Query('gradeGroupId') gradeGroupId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.attendanceReport(
      academicYearId,
      gradeGroupId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get('financial')
  @Roles(Role.SUPER_ADMIN, Role.RECTOR, Role.ACCOUNTANT, Role.SECRETARY)
  @ApiOperation({ summary: 'RF-REP-05: Reporte financiero' })
  @ApiQuery({ name: 'academicYearId', required: true })
  @ApiQuery({ name: 'month', required: false, description: '1-12' })
  @ApiQuery({ name: 'year', required: false })
  financialReport(
    @Query('academicYearId') academicYearId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.reportsService.financialReport(
      academicYearId,
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
    );
  }

  @Get('grade-progression')
  @ApiOperation({ summary: 'RF-REP-06: Progresión de notas por período' })
  @ApiQuery({ name: 'academicYearId', required: true })
  @ApiQuery({ name: 'gradeGroupId', required: false })
  @ApiQuery({ name: 'studentId', required: false })
  gradeProgression(
    @Query('academicYearId') academicYearId: string,
    @Query('gradeGroupId') gradeGroupId?: string,
    @Query('studentId') studentId?: string,
  ) {
    return this.reportsService.gradeProgression(academicYearId, gradeGroupId, studentId);
  }
}
