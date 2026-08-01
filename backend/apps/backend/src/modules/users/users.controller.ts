import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@school/shared';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.RECTOR, Role.SECRETARY)
  @ApiOperation({ summary: 'Listar usuarios con filtros y paginación' })
  findAll(@Query() query: QueryUserDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.RECTOR, Role.SECRETARY)
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Crear usuario y generar credenciales iniciales' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Actualizar usuario' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete de usuario (nunca borrado físico)' })
  softDelete(@Param('id') id: string) {
    return this.usersService.softDelete(id);
  }

  @Post(':id/roles/:role')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Agregar rol adicional al usuario' })
  addRole(@Param('id') id: string, @Param('role') role: Role) {
    return this.usersService.addRole(id, role);
  }

  @Delete(':id/roles/:role')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Remover rol del usuario' })
  removeRole(@Param('id') id: string, @Param('role') role: Role) {
    return this.usersService.removeRole(id, role);
  }

  @Post(':id/reset-password')
  @Roles(Role.SUPER_ADMIN, Role.SECRETARY)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generar nueva contraseña temporal' })
  resetPassword(@Param('id') id: string) {
    return this.usersService.resetPassword(id);
  }
}
