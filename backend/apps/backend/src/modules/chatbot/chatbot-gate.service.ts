import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { normalizarTelefono } from './chatbot-identity.service';

export const CLAVE_ENCENDIDO = 'chatbot.enabled';
export const CLAVE_PILOTO = 'chatbot.allowlist';
export const CLAVE_TOPE_DIARIO = 'chatbot.topeDiario';

/** Por qué no se atiende un mensaje, en clave estable (no en texto en español). */
export type MotivoVeto = 'apagado' | 'piloto' | 'tope';

export interface Config {
  encendido: boolean;
  piloto: boolean;
  allowlist: string[];
  topeDiario: number;
}

/**
 * El interruptor del bot, y el único punto donde se decide si un mensaje llega
 * al modelo.
 *
 * Vive en base y no en el .env porque apagarlo tiene que surtir efecto en
 * SEGUNDOS: cuando el bot le está diciendo algo incorrecto a una familia, un
 * `pm2 restart` no es una respuesta aceptable. La caché de 5s es el compromiso
 * entre eso y no consultar la base en cada mensaje.
 */
@Injectable()
export class ChatbotGateService {
  private readonly logger = new Logger('ChatbotGate');
  private cache: { valor: Config; hasta: number } | null = null;
  private static readonly TTL_MS = 5000;

  constructor(private readonly prisma: PrismaService) {}

  async config(): Promise<Config> {
    if (this.cache && this.cache.hasta > Date.now()) return this.cache.valor;

    const filas = await this.prisma.setting.findMany({
      where: { key: { in: [CLAVE_ENCENDIDO, CLAVE_PILOTO, CLAVE_TOPE_DIARIO] } },
    });
    const get = (k: string) => filas.find((f) => f.key === k)?.value;

    const allowlist = (get(CLAVE_PILOTO) ?? '')
      .split(',')
      .map((s) => normalizarTelefono(s))
      .filter((s): s is string => Boolean(s));

    const valor: Config = {
      // APAGADO por omisión, y a conciencia: desplegar el código no debe poner a
      // un bot a hablar con las familias. Se enciende cuando el colegio lo decida.
      encendido: get(CLAVE_ENCENDIDO) === 'true',
      piloto: allowlist.length > 0,
      allowlist,
      topeDiario: Number(get(CLAVE_TOPE_DIARIO) ?? 300),
    };

    this.cache = { valor, hasta: Date.now() + ChatbotGateService.TTL_MS };
    return valor;
  }

  async guardar(cambios: Partial<Record<string, string>>): Promise<Config> {
    for (const [key, value] of Object.entries(cambios)) {
      if (value === undefined) continue;
      await this.prisma.setting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      });
    }
    this.cache = null; // que el siguiente mensaje vea el cambio ya
    return this.config();
  }

  /**
   * ¿Atiende el bot este mensaje? Es el corte: si dice que no, el mensaje NO
   * llega al motor (cero LLM, cero respuesta), pero el log de conversación sí lo
   * registró — apagar el bot deja el canal exactamente como estaba antes de que
   * existiera.
   */
  async debeAtender(telefono: string): Promise<{ ok: boolean; motivo?: MotivoVeto; aviso?: string }> {
    const cfg = await this.config();
    if (!cfg.encendido) return { ok: false, motivo: 'apagado' };

    const tel = normalizarTelefono(telefono);
    if (cfg.piloto && (!tel || !cfg.allowlist.includes(tel))) {
      return { ok: false, motivo: 'piloto' };
    }

    const dia = new Date().toISOString().slice(0, 10);
    const usados = await this.prisma.chatbotUsage.aggregate({
      where: { day: dia },
      _sum: { messages: true },
    });
    if ((usados._sum.messages ?? 0) >= cfg.topeDiario) {
      return {
        ok: false,
        motivo: 'tope',
        // Un veto por cupo NO puede resolverse en silencio: la familia acaba de
        // escribir y merece saber que su mensaje llegó. El texto no menciona
        // topes ni fallas técnicas: eso no le incumbe y solo genera desconfianza.
        aviso: 'Recibimos tu mensaje. En un momento te responde una persona del colegio.',
      };
    }

    return { ok: true };
  }

  /** Suma un mensaje al consumo del día (lo llama el motor tras responder). */
  async registrarUso(convKey: string, phone: string, tokensIn = 0, tokensOut = 0) {
    const day = new Date().toISOString().slice(0, 10);
    try {
      await this.prisma.chatbotUsage.upsert({
        where: { day_convKey: { day, convKey } },
        create: { day, convKey, phone, messages: 1, tokensIn, tokensOut },
        update: {
          messages: { increment: 1 },
          tokensIn: { increment: tokensIn },
          tokensOut: { increment: tokensOut },
        },
      });
    } catch (e) {
      this.logger.warn(`No se pudo registrar el consumo: ${(e as Error).message}`);
    }
  }

  /** ¿Ya vimos este mensaje? Meta reintenta el webhook y duplicaría respuestas. */
  async yaVisto(messageId?: string): Promise<boolean> {
    if (!messageId) return false;
    try {
      await this.prisma.chatbotSeenMessage.create({ data: { messageId } });
      return false;
    } catch {
      return true; // choque de clave única = ya estaba
    }
  }
}
