import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@school/shared';
import { YearCloseService } from './year-close.service';
import { PromoteDto } from './dto/promote.dto';

@ApiTags('year-close')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.RECTOR, Role.COORDINATOR_ACADEMIC, Role.SECRETARY)
@Controller('year-close')
export class YearCloseController {
  constructor(private readonly yearCloseService: YearCloseService) {}

  @Get('consolidation')
  @ApiOperation({ summary: 'Acta de consolidación/promoción del año por grupo (definitiva por área, promedio, áreas perdidas, estado)' })
  @ApiQuery({ name: 'academicYearId', required: true })
  @ApiQuery({ name: 'gradeGroupId', required: true })
  consolidation(@Query('academicYearId') academicYearId: string, @Query('gradeGroupId') gradeGroupId: string) {
    return this.yearCloseService.consolidation(academicYearId, gradeGroupId);
  }

  @Get('promotion-preview')
  @ApiOperation({ summary: 'Simula la promoción al año siguiente. NO escribe nada.' })
  @ApiQuery({ name: 'fromYearId', required: true })
  @ApiQuery({ name: 'toYearId', required: true })
  promotionPreview(@Query('fromYearId') fromYearId: string, @Query('toYearId') toYearId: string) {
    return this.yearCloseService.promotionPreview(fromYearId, toYearId);
  }

  // Mueve estudiantes de grado: se queda en rectoría y superadmin. Secretaría y
  // coordinación pueden ver el acta y la simulación, pero no ejecutarla.
  @Post('promote')
  @Roles(Role.SUPER_ADMIN, Role.RECTOR)
  @ApiOperation({ summary: 'Ejecuta la promoción: asigna cada estudiante a su curso del año destino' })
  promote(@Body() dto: PromoteDto, @Req() req: any) {
    return this.yearCloseService.promote(dto, req.user.id);
  }
}
