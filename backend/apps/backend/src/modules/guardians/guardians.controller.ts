import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@school/shared';
import { GuardiansService } from './guardians.service';
import { CreateGuardianDto, QueryGuardianDto } from './dto/guardian.dto';

const ADMIN = [Role.SUPER_ADMIN, Role.RECTOR, Role.COORDINATOR_ACADEMIC, Role.SECRETARY];

@ApiTags('guardians')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('guardians')
export class GuardiansController {
  constructor(private readonly guardians: GuardiansService) {}

  @Get()
  @Roles(...ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Listar acudientes con estudiantes vinculados' })
  findAll(@Query() query: QueryGuardianDto) {
    return this.guardians.findAll(query);
  }

  @Get(':id')
  @Roles(...ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Detalle de un acudiente' })
  findOne(@Param('id') id: string) {
    return this.guardians.findOne(id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.RECTOR, Role.SECRETARY)
  @ApiOperation({ summary: 'Registrar acudiente: crea la cuenta, el perfil y lo vincula a estudiantes' })
  create(@Body() dto: CreateGuardianDto) {
    return this.guardians.create(dto);
  }
}
