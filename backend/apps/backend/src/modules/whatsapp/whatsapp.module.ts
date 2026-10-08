import { Module } from '@nestjs/common';
import { KapsoTransport } from './kapso.transport';
import { WhatsappWebhookController } from './whatsapp-webhook.controller';

/**
 * El canal de WhatsApp, sin nada de inteligencia: solo entrada (webhook) y salida
 * (envío). Quién contesta y qué contesta es asunto del ChatbotModule, que importa
 * a este. La separación permite que mañana finanzas mande un recordatorio de pago
 * por el mismo número sin arrastrar consigo el motor del agente.
 */
@Module({
  controllers: [WhatsappWebhookController],
  providers: [KapsoTransport],
  exports: [KapsoTransport],
})
export class WhatsappModule {}
