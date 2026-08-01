import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
import { Role } from '@school/shared';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Estadísticas del dashboard según rol del usuario (RF-DASH-01..05)' })
  getStats(@Request() req: any) {
    const roles: Role[] = req.user.roles ?? [req.user.role];
    return this.dashboardService.getStats(req.user.id, roles);
  }

  @Get('charts')
  @ApiOperation({ summary: 'Series para los gráficos del dashboard ejecutivo (ingresos, rendimiento, asistencia, distribución)' })
  getCharts(@Request() req: any) {
    const roles: Role[] = req.user.roles ?? [req.user.role];
    return this.dashboardService.getCharts(roles);
  }
}
