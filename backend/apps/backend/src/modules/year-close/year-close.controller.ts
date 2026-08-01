import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@school/shared';
import { YearCloseService } from './year-close.service';

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
}
