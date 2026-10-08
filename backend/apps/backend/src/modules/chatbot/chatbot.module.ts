import { Module } from '@nestjs/common';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { ChatbotIdentityService } from './chatbot-identity.service';
import { ChatbotGateService } from './chatbot-gate.service';
import { PrismaSessionStore } from './prisma-session.store';
import { AcudienteToolset } from './toolsets/acudiente.toolset';
import { DocenteToolset } from './toolsets/docente.toolset';
import { AdminToolset } from './toolsets/admin.toolset';
import { PublicoToolset } from './toolsets/publico.toolset';

/**
 * El agente de WhatsApp. Es el CONSUMIDOR final: importa el canal y consulta los
 * datos, y nadie lo importa a él. Mantenerlo en la punta del grafo evita ciclos
 * y, sobre todo, garantiza que quitarlo no rompa nada del resto del colegio.
 */
@Module({
  imports: [WhatsappModule],
  controllers: [ChatbotController],
  providers: [
    ChatbotService,
    ChatbotIdentityService,
    ChatbotGateService,
    PrismaSessionStore,
    AcudienteToolset,
    DocenteToolset,
    AdminToolset,
    PublicoToolset,
  ],
})
export class ChatbotModule {}
