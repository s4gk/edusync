import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@school/shared';
import { SettingsService } from './settings.service';
import { UpdateSchoolDto } from './dto/settings.dto';

@ApiTags('settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  // Leer es transversal: secretaría lo necesita para los certificados y el
  // encabezado del colegio aparece en pantallas de todos los roles.
  @Get('school')
  @Roles(
    Role.SUPER_ADMIN, Role.RECTOR, Role.COORDINATOR_ACADEMIC,
    Role.COORDINATOR_CONVIVENCIA, Role.SECRETARY, Role.ACCOUNTANT, Role.TEACHER,
  )
  @ApiOperation({ summary: 'Identidad de la institución + qué falta por configurar' })
  getSchool() {
    return this.settings.getSchoolStatus();
  }

  // Editarlo cambia lo que sale impreso en constancias y en la política de
  // datos: se queda en rectoría.
  @Put('school')
  @Roles(Role.SUPER_ADMIN, Role.RECTOR)
  @ApiOperation({ summary: 'Actualizar identidad de la institución' })
  updateSchool(@Body() dto: UpdateSchoolDto) {
    return this.settings.updateSchool(dto);
  }
}
