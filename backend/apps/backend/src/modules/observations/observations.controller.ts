import {
  Controller, Get, Post, Delete,
  Param, Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@school/shared';
import { ObservationsService } from './observations.service';
import { CreateObservationDto, QueryObservationDto } from './dto/observation.dto';

@ApiTags('observations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('observations')
export class ObservationsController {
  constructor(private readonly observationsService: ObservationsService) {}

  @Post()
  @Roles(Role.TEACHER, Role.COORDINATOR_ACADEMIC, Role.COORDINATOR_CONVIVENCIA, Role.RECTOR, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Crear observación académica o disciplinaria (RF-OBS-01/02/03). Notifica automáticamente al acudiente si es grave/gravísima (RF-OBS-04).' })
  create(@Body() dto: CreateObservationDto, @Request() req: any) {
    return this.observationsService.create(dto, req.user.id, req.user.roles);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.RECTOR, Role.COORDINATOR_ACADEMIC, Role.COORDINATOR_CONVIVENCIA, Role.TEACHER, Role.SECRETARY)
  @ApiOperation({ summary: 'Listar observaciones con filtros' })
  findAll(@Query() query: QueryObservationDto, @Request() req: any) {
    return this.observationsService.findAll(query, req.user);
  }

  @Get('student/:studentId')
  @Roles(Role.SUPER_ADMIN, Role.RECTOR, Role.COORDINATOR_ACADEMIC, Role.COORDINATOR_CONVIVENCIA, Role.TEACHER, Role.GUARDIAN, Role.STUDENT)
  @ApiOperation({ summary: 'Historial de observaciones de un estudiante' })
  findByStudent(@Param('studentId') studentId: string, @Request() req: any) {
    return this.observationsService.findByStudent(studentId, req.user);
  }

  @Delete(':id')
  @Roles(Role.TEACHER, Role.COORDINATOR_CONVIVENCIA, Role.RECTOR, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Eliminar observación (solo el autor o admin)' })
  delete(@Param('id') id: string, @Request() req: any) {
    return this.observationsService.delete(id, req.user.id, req.user.roles);
  }
}
