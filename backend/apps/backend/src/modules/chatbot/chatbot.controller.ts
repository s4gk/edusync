import { Body, Controller, Get, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsBooleanString, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@school/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { KapsoTransport } from '../whatsapp/kapso.transport';
import { ChatbotGateService, CLAVE_ENCENDIDO, CLAVE_PILOTO, CLAVE_TOPE_DIARIO } from './chatbot-gate.service';
import { ChatbotService } from './chatbot.service';

class ActualizarConfigDto {
  @IsOptional() @IsBooleanString() encendido?: string;
  @IsOptional() @IsString() allowlist?: string;
  @IsOptional() @IsString() topeDiario?: string;
}

/**
 * Panel del chatbot. Restringido a dirección: encender el bot es decidir que una
 * máquina hable en nombre del colegio con las familias, y eso no es una
 * configuración de usuario.
 */
@ApiTags('chatbot')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.RECTOR)
@Controller('chatbot')
export class ChatbotController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gate: ChatbotGateService,
    private readonly chatbot: ChatbotService,
    private readonly transport: KapsoTransport,
  ) {}

  @Get('config')
  @ApiOperation({ summary: 'Estado del agente de WhatsApp' })
  async config() {
    const cfg = await this.gate.config();
    const dia = new Date().toISOString().slice(0, 10);
    const uso = await this.prisma.chatbotUsage.aggregate({
      where: { day: dia },
      _sum: { messages: true, tokensIn: true, tokensOut: true },
    });

    return {
      ...cfg,
      // Tres cosas distintas que se confunden todo el tiempo:
      montado: this.chatbot.montado,        // ¿hay API key del LLM?
      canalListo: this.transport.ready,     // ¿hay credenciales de WhatsApp?
      // ...y `encendido`, que es la decisión del colegio. El bot solo responde
      // si las tres son ciertas.
      usoHoy: {
        mensajes: uso._sum.messages ?? 0,
        tokensEntrada: uso._sum.tokensIn ?? 0,
        tokensSalida: uso._sum.tokensOut ?? 0,
      },
    };
  }

  @Put('config')
  @ApiOperation({ summary: 'Encender/apagar el bot, definir piloto y tope diario' })
  async actualizar(@Body() dto: ActualizarConfigDto) {
    return this.gate.guardar({
      ...(dto.encendido !== undefined ? { [CLAVE_ENCENDIDO]: dto.encendido } : {}),
      ...(dto.allowlist !== undefined ? { [CLAVE_PILOTO]: dto.allowlist } : {}),
      ...(dto.topeDiario !== undefined ? { [CLAVE_TOPE_DIARIO]: dto.topeDiario } : {}),
    });
  }

  @Post('probar')
  @ApiOperation({ summary: 'Comprobar contra Kapso que las credenciales sirven' })
  probar() {
    return this.transport.probe();
  }

  @Get('conversaciones')
  @ApiOperation({ summary: 'Últimos mensajes del canal (entrantes y salientes)' })
  async conversaciones(@Query('limit') limit?: string) {
    const take = Math.min(Number(limit) || 50, 200);
    const mensajes = await this.prisma.whatsappMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take,
    });
    return { data: mensajes };
  }
}
