import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@school/shared';
import { PrivacyService } from './privacy.service';
import { CreateConsentDto, RevokeConsentDto } from './dto/consent.dto';

const ADMIN = [Role.SUPER_ADMIN, Role.RECTOR, Role.COORDINATOR_ACADEMIC, Role.SECRETARY];

@ApiTags('privacy')
@Controller('privacy')
export class PrivacyController {
  constructor(private readonly privacy: PrivacyService) {}

  /**
   * PÚBLICO a propósito: la política de tratamiento tiene que poder leerse
   * ANTES de tener cuenta —es justamente lo que la familia lee para decidir si
   * autoriza—, y el aviso de privacidad debe ser de acceso libre.
   */
  @Get('policy')
  @ApiOperation({ summary: 'Política de tratamiento de datos vigente (pública)' })
  policy() {
    return this.privacy.politicaVigente();
  }

  @Post('consents')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN, Role.TEACHER, Role.GUARDIAN)
  @ApiOperation({ summary: 'Registrar autorización de tratamiento de datos' })
  async registrar(@Body() dto: CreateConsentDto, @Req() req: any) {
    // Mismo filtro que para leer: si no, un acudiente podría dejar una
    // autorización a nombre del hijo de otra familia, que es evidencia falsa.
    await this.privacy.assertAcceso(dto.subjectUserId, req.user);
    return this.privacy.registrar(dto, {
      // Detrás del proxy de Next el req.ip es 127.0.0.1; el XFF es lo único que
      // acerca a la IP real cuando el despliegue lo pone delante.
      ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip,
      userAgent: req.headers['user-agent'] as string,
    });
  }

  @Get('consents/:userId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN, Role.TEACHER, Role.GUARDIAN, Role.STUDENT)
  @ApiOperation({ summary: 'Autorización vigente e historial de un titular' })
  async historial(@Param('userId') userId: string, @Req() req: any) {
    await this.privacy.assertAcceso(userId, req.user);
    return this.privacy.historial(userId);
  }

  @Post('consents/:id/revoke')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN)
  @ApiOperation({ summary: 'Revocar una autorización' })
  revocar(@Param('id') id: string, @Body() dto: RevokeConsentDto) {
    return this.privacy.revocar(id, dto.reason);
  }

  @Get('compliance')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN)
  @ApiOperation({ summary: 'Quién tiene autorización vigente y a quién le falta' })
  cumplimiento(@Query('role') role?: string) {
    return this.privacy.cumplimiento(role);
  }
}
