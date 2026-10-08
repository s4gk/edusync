import { Injectable, Logger } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { BaseTransport, type TransportName } from '@s4gk/wa-agent';
import { PrismaService } from '../../prisma/prisma.service';

export const KAPSO_TRANSPORT = 'kapso';

/**
 * Transporte de WhatsApp a través de Kapso, que es un proxy sobre la Cloud API de
 * Meta y habla su mismo dialecto (`/{version}/{phoneNumberId}/messages`, webhook
 * con la forma `entry[].changes[].value.messages[]`). Por eso, migrar a Meta
 * directo sería cambiar `KAPSO_BASE_URL` y el header de autenticación, no
 * reescribir esta clase.
 *
 * Se activa solo si hay KAPSO_API_KEY y KAPSO_PHONE_NUMBER_ID. Sin ellas el
 * transporte queda inactivo y el resto del backend funciona igual: el chatbot es
 * aditivo, no cambia nada de lo que ya existe.
 */
@Injectable()
export class KapsoTransport extends BaseTransport {
  readonly name: TransportName = KAPSO_TRANSPORT;
  private readonly logger = new Logger('WhatsApp');

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private get apiKey() { return process.env.KAPSO_API_KEY ?? ''; }
  private get phoneNumberId() { return process.env.KAPSO_PHONE_NUMBER_ID ?? ''; }
  private get graphVersion() { return process.env.KAPSO_GRAPH_VERSION ?? 'v24.0'; }
  private get baseUrl() {
    return (process.env.KAPSO_BASE_URL ?? 'https://api.kapso.ai/meta/whatsapp').replace(/\/+$/, '');
  }

  get ready(): boolean {
    return Boolean(this.apiKey && this.phoneNumberId);
  }

  /** El webhook lo sirve el controller; el transporte no levanta servidor. */
  async start(): Promise<void> {}

  private headers() {
    return { 'X-API-Key': this.apiKey, Authorization: `Bearer ${this.apiKey}` };
  }

  /** Comprueba contra Kapso que las credenciales sirven de verdad. */
  async probe(): Promise<{ ok: boolean; error?: string; phone?: string; name?: string }> {
    if (!this.ready) {
      return { ok: false, error: 'Falta KAPSO_API_KEY o KAPSO_PHONE_NUMBER_ID en backend/.env.' };
    }
    try {
      const url = `${this.baseUrl}/${this.graphVersion}/${this.phoneNumberId}?fields=display_phone_number,verified_name`;
      const res = await fetch(url, { headers: this.headers() });
      if (!res.ok) return { ok: false, error: `Kapso respondió ${res.status}: ${(await res.text()).slice(0, 200)}` };
      const d: any = await res.json();
      return { ok: true, phone: d?.display_phone_number, name: d?.verified_name };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  async sendText(to: string, text: string): Promise<boolean> {
    const numero = to.replace(/\D/g, '');
    if (!this.ready) {
      this.logger.warn(`[WhatsApp inactivo] → ${numero}: ${text.slice(0, 120)}`);
      await this.registrar(numero, 'out', text, null, 'bot');
      return false;
    }
    try {
      const res = await fetch(`${this.baseUrl}/${this.graphVersion}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: { ...this.headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: numero,
          type: 'text',
          text: { body: text },
        }),
      });
      if (!res.ok) {
        this.logger.warn(`Kapso ${res.status} enviando a ${numero}: ${(await res.text()).slice(0, 200)}`);
        return false;
      }
      const d: any = await res.json().catch(() => ({}));
      await this.registrar(numero, 'out', text, d?.messages?.[0]?.id ?? null, 'bot');
      return true;
    } catch (e) {
      this.logger.warn(`Error enviando a ${numero}: ${(e as Error).message}`);
      return false;
    }
  }

  async sendDocument(
    to: string,
    buffer: Buffer,
    fileName: string,
    caption?: string,
    mimetype = 'application/pdf',
  ): Promise<boolean> {
    const numero = to.replace(/\D/g, '');
    if (!this.ready) {
      this.logger.warn(`[WhatsApp inactivo] → ${numero}: documento ${fileName}`);
      return false;
    }
    try {
      // Meta/Kapso exigen subir el binario primero y mandar el id resultante.
      const form = new FormData();
      form.append('messaging_product', 'whatsapp');
      form.append('file', new Blob([new Uint8Array(buffer)], { type: mimetype }), fileName);
      const up = await fetch(`${this.baseUrl}/${this.graphVersion}/${this.phoneNumberId}/media`, {
        method: 'POST',
        headers: this.headers(),
        body: form,
      });
      if (!up.ok) {
        this.logger.warn(`Kapso ${up.status} subiendo ${fileName}: ${(await up.text()).slice(0, 200)}`);
        return false;
      }
      const mediaId = (await up.json() as any)?.id;
      if (!mediaId) return false;

      const res = await fetch(`${this.baseUrl}/${this.graphVersion}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: { ...this.headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: numero,
          type: 'document',
          document: { id: mediaId, filename: fileName, ...(caption ? { caption } : {}) },
        }),
      });
      if (!res.ok) {
        this.logger.warn(`Kapso ${res.status} enviando documento: ${(await res.text()).slice(0, 200)}`);
        return false;
      }
      await this.registrar(numero, 'out', `[documento] ${fileName}`, null, 'bot');
      return true;
    } catch (e) {
      this.logger.warn(`Error enviando documento a ${numero}: ${(e as Error).message}`);
      return false;
    }
  }

  /**
   * Verifica la firma del webhook. Sin esto, cualquiera que conozca la URL puede
   * inventarse mensajes "de" un acudiente y hacer que el bot le conteste con las
   * notas de un menor.
   */
  verificarFirma(rawBody: Buffer | undefined, firmas: { meta?: string; kapso?: string }): boolean {
    const secreto = process.env.WHATSAPP_WEBHOOK_APP_SECRET;
    // Sin secreto configurado no se puede verificar nada. Se rechaza en vez de
    // dejar pasar: preferimos un bot mudo a un bot suplantable.
    if (!secreto || !rawBody) return false;

    const hex = createHmac('sha256', secreto).update(rawBody).digest('hex');
    if (firmas.kapso && this.comparar(firmas.kapso, hex)) return true;
    if (firmas.meta && this.comparar(firmas.meta.replace(/^sha256=/, ''), hex)) return true;
    return false;
  }

  private comparar(a: string, b: string): boolean {
    const ba = Buffer.from(a, 'utf8');
    const bb = Buffer.from(b, 'utf8');
    // timingSafeEqual exige longitudes iguales; distinta longitud ya es un no.
    return ba.length === bb.length && timingSafeEqual(ba, bb);
  }

  /**
   * Normaliza el payload de Meta/Kapso y lo empuja al motor. Devuelve cuántos
   * mensajes de entrada se procesaron (útil para el log del webhook).
   */
  async procesarWebhook(payload: any): Promise<number> {
    let n = 0;
    for (const entry of payload?.entry ?? []) {
      for (const change of entry?.changes ?? []) {
        const value = change?.value;
        for (const msg of value?.messages ?? []) {
          // Los ecos de mensajes salientes vuelven por el mismo webhook: si no se
          // filtran, el bot se contesta a sí mismo en bucle.
          if (msg?.kapso?.direction === 'outbound') continue;

          const from = String(msg.from ?? '').replace(/\D/g, '');
          if (!from) continue;

          const texto: string =
            msg.text?.body ??
            msg.button?.text ??
            msg.interactive?.button_reply?.title ??
            msg.interactive?.list_reply?.title ??
            '';

          // Adjuntos y audios: el motor no los ve, así que se describen para que
          // el modelo no finja haberlos abierto.
          const descripcion = !texto
            ? msg.type === 'audio' ? '(nota de voz)'
              : msg.type === 'image' ? '(una foto)'
              : msg.type === 'document' ? '(un documento)'
              : msg.type ? `(${msg.type})` : ''
            : '';

          const cuerpo = texto || descripcion;
          if (!cuerpo) continue;

          await this.registrar(from, 'in', cuerpo, msg.id ?? null, null);
          this.emit({ transport: this.name, from, text: cuerpo, messageId: msg.id });
          n++;
        }
      }
    }
    return n;
  }

  /**
   * Log de conversación. Se escribe SIEMPRE, atienda el bot o no: si el bot está
   * apagado o el número no está en el piloto, el mensaje igual queda registrado
   * para que lo atienda una persona.
   */
  private async registrar(
    phone: string,
    direction: 'in' | 'out',
    body: string,
    messageId: string | null,
    handledBy: string | null,
  ) {
    try {
      await this.prisma.whatsappMessage.create({
        data: { phone, direction, body: body.slice(0, 4000), messageId, handledBy },
      });
    } catch (e) {
      this.logger.warn(`No se pudo registrar el mensaje: ${(e as Error).message}`);
    }
  }
}
