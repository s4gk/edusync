import { Controller, Get, Post, Req, Res, Query, Logger, HttpCode } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { KapsoTransport } from './kapso.transport';

/**
 * Webhook público de WhatsApp. Es la ÚNICA puerta de entrada del canal, y por eso
 * concentra las tres cosas que la hacen segura:
 *
 *   1. Verificación de firma HMAC: sin ella cualquiera que descubra la URL podría
 *      hacerse pasar por un acudiente y sacarle al bot las notas de un menor.
 *   2. Respuesta inmediata 200: Meta reintenta si tardamos, y un reintento es un
 *      mensaje duplicado. Se procesa después de responder.
 *   3. Nunca devuelve detalle del error: a un webhook público no se le explica
 *      por qué falló la firma.
 */
@ApiExcludeController()
@Controller('whatsapp')
export class WhatsappWebhookController {
  private readonly logger = new Logger('WhatsAppWebhook');

  constructor(private readonly transport: KapsoTransport) {}

  /** Handshake de verificación de Meta al registrar la URL. */
  @Get('webhook')
  verificar(@Query() q: Record<string, string>, @Res() res: Response) {
    const esperado = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
    if (q['hub.mode'] === 'subscribe' && esperado && q['hub.verify_token'] === esperado) {
      return res.status(200).send(q['hub.challenge'] ?? '');
    }
    return res.status(403).send('forbidden');
  }

  @Post('webhook')
  @HttpCode(200)
  async recibir(@Req() req: Request & { rawBody?: Buffer }, @Res() res: Response) {
    const ok = this.transport.verificarFirma(req.rawBody, {
      meta: req.headers['x-hub-signature-256'] as string | undefined,
      kapso: req.headers['x-kapso-signature'] as string | undefined,
    });

    if (!ok) {
      this.logger.warn('Webhook con firma inválida: descartado.');
      return res.status(403).send('forbidden');
    }

    // Responder YA y procesar después: si tardamos, Meta reintenta y el mensaje
    // llega dos veces. La deduplicación por messageId cubre el resto.
    res.status(200).send('ok');

    try {
      const n = await this.transport.procesarWebhook(req.body);
      if (n) this.logger.log(`Webhook: ${n} mensaje(s) entrante(s).`);
    } catch (e) {
      this.logger.error(`Error procesando el webhook: ${(e as Error).message}`);
    }
  }
}
