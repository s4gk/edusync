import {
  Controller, Get, Post, Param, Body, Query, UseGuards, HttpCode, HttpStatus, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@school/shared';
import { ReportCardsService } from './report-cards.service';

@ApiTags('report-cards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('report-cards')
export class ReportCardsController {
  constructor(private readonly reportCardsService: ReportCardsService) {}

  @Post('generate/group/:gradeGroupId')
  @Roles(Role.SUPER_ADMIN, Role.RECTOR, Role.COORDINATOR_ACADEMIC)
  @ApiOperation({ summary: 'Encolar generación de boletines para todo un grupo (RF-BOL-01)' })
  enqueueForGroup(
    @Param('gradeGroupId') gradeGroupId: string,
    @Body('periodNumber') periodNumber: number,
    @Request() req: any,
  ) {
    return this.reportCardsService.enqueueForGroup(gradeGroupId, periodNumber, req.user.id);
  }

  @Post('generate/student/:studentId')
  @Roles(Role.SUPER_ADMIN, Role.RECTOR, Role.COORDINATOR_ACADEMIC, Role.SECRETARY)
  @ApiOperation({ summary: 'Encolar generación de boletín individual (RF-BOL-01)' })
  enqueueForStudent(
    @Param('studentId') studentId: string,
    @Body('periodNumber') periodNumber: number,
    @Request() req: any,
  ) {
    return this.reportCardsService.enqueueForStudent(studentId, periodNumber, req.user.id);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.RECTOR, Role.COORDINATOR_ACADEMIC, Role.SECRETARY, Role.TEACHER, Role.STUDENT, Role.GUARDIAN)
  @ApiOperation({ summary: 'Listar boletines generados con filtros (RF-BOL-06)' })
  findAll(
    @Request() req: any,
    @Query('studentId') studentId?: string,
    @Query('gradeGroupId') gradeGroupId?: string,
    @Query('period') period?: string,
  ) {
    return this.reportCardsService.findAll({ studentId, gradeGroupId, period }, req.user);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.RECTOR, Role.COORDINATOR_ACADEMIC, Role.SECRETARY, Role.STUDENT, Role.GUARDIAN)
  @ApiOperation({ summary: 'Detalle de un boletín (RF-BOL-05)' })
  findOne(@Param('id') id: string) {
    return this.reportCardsService.findOne(id);
  }

  @Post(':id/publish')
  @Roles(Role.SUPER_ADMIN, Role.RECTOR, Role.COORDINATOR_ACADEMIC)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publicar boletín individual para descarga' })
  publish(@Param('id') id: string) {
    return this.reportCardsService.publish(id);
  }

  @Post('publish-all/:gradeGroupId')
  @Roles(Role.SUPER_ADMIN, Role.RECTOR, Role.COORDINATOR_ACADEMIC)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publicar todos los boletines de un grupo para un periodo (RF-BOL-05)' })
  publishAll(@Param('gradeGroupId') gradeGroupId: string, @Body('period') period: string) {
    return this.reportCardsService.publishAll(gradeGroupId, period);
  }
}
