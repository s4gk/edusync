import {
  Controller, Get, Post, Param, Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@school/shared';
import { AttendanceService } from './attendance.service';
import { RegisterAttendanceDto, QueryAttendanceDto } from './dto/attendance.dto';

@ApiTags('attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @Roles(Role.TEACHER, Role.COORDINATOR_ACADEMIC, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Registrar asistencia por clase — batch (RF-ASIS-01/02)' })
  register(@Body() dto: RegisterAttendanceDto, @Request() req: any) {
    return this.attendanceService.register(dto, req.user.id, req.user.roles);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.RECTOR, Role.COORDINATOR_ACADEMIC, Role.SECRETARY, Role.TEACHER)
  @ApiOperation({ summary: 'Consultar registros de asistencia con filtros (RF-ASIS-07)' })
  findAll(@Query() query: QueryAttendanceDto, @Request() req: any) {
    return this.attendanceService.findAll(query, req.user);
  }

  @Get('student/:studentId/subject/:subjectId/stats')
  @Roles(Role.SUPER_ADMIN, Role.RECTOR, Role.COORDINATOR_ACADEMIC, Role.TEACHER, Role.GUARDIAN, Role.STUDENT)
  @ApiOperation({ summary: '% asistencia de un estudiante en una materia (RF-ASIS-05)' })
  getStudentStats(@Param('studentId') studentId: string, @Param('subjectId') subjectId: string) {
    return this.attendanceService.getStudentStats(studentId, subjectId);
  }

  @Get('subject/:subjectId/report')
  @Roles(Role.SUPER_ADMIN, Role.RECTOR, Role.COORDINATOR_ACADEMIC, Role.TEACHER)
  @ApiOperation({ summary: 'Reporte de asistencia por grupo/materia con alumnos en riesgo (RF-ASIS-07)' })
  getGroupReport(
    @Param('subjectId') subjectId: string,
    @Request() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.attendanceService.getGroupReport(subjectId, from, to, req.user);
  }
}
