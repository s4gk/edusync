import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@school/shared';
import { CertificatesService } from './certificates.service';

@ApiTags('certificates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.RECTOR, Role.COORDINATOR_ACADEMIC, Role.SECRETARY)
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Get(':type/:studentId')
  @ApiOperation({ summary: 'Genera un certificado en PDF (type: estudio | notas | paz-y-salvo)' })
  async get(@Param('type') type: string, @Param('studentId') studentId: string, @Res() res: Response) {
    const { buffer, filename, contentType } = await this.certificatesService.generate(type, studentId);
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${filename}"`,
    });
    res.send(buffer);
  }
}
