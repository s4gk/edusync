import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RemindersService } from './reminders.service';

class CreateReminderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(280)
  text: string;
}

// Recordatorios personales: cada usuario solo ve y maneja los suyos (scoped a req.user.id).
@ApiTags('reminders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reminders')
export class RemindersController {
  constructor(private readonly reminders: RemindersService) {}

  @Get()
  @ApiOperation({ summary: 'Mis recordatorios' })
  list(@Request() req: any) {
    return this.reminders.list(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear recordatorio' })
  create(@Body() dto: CreateReminderDto, @Request() req: any) {
    return this.reminders.create(req.user.id, dto.text);
  }

  @Put(':id/toggle')
  @ApiOperation({ summary: 'Marcar/desmarcar como hecho' })
  toggle(@Param('id') id: string, @Request() req: any) {
    return this.reminders.toggle(id, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar recordatorio' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.reminders.remove(id, req.user.id);
  }
}
