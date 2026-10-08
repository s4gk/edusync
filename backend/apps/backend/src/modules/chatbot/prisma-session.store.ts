import { Injectable, Logger } from '@nestjs/common';
import type { SessionStore, StoredPending, Turn } from '@s4gk/wa-agent';
import { PrismaService } from '../../prisma/prisma.service';

/** Cuántos turnos se conservan. Suficiente contexto sin disparar el costo por mensaje. */
const MAX_TURNOS = 24;
/** Una confirmación pendiente caduca. Un "sí" media hora después ya no significa lo mismo. */
const PENDIENTE_VIVE_MS = 15 * 60 * 1000;

/**
 * Sesión del chatbot persistida en Postgres, no en memoria.
 *
 * El motivo no es el reinicio del proceso en abstracto, es este caso concreto: el
 * bot pregunta "¿confirmo que registro la excusa médica?", el backend se
 * reinicia, el acudiente responde "sí" — y con estado en memoria ese "sí" queda
 * huérfano o, peor, se interpreta en la conversación equivocada.
 */
@Injectable()
export class PrismaSessionStore implements SessionStore {
  private readonly logger = new Logger('ChatbotStore');

  constructor(private readonly prisma: PrismaService) {}

  private telefonoDe(convKey: string): string {
    // convKey es `transporte:telefono`.
    return convKey.split(':').pop() ?? convKey;
  }

  async getHistory(convKey: string): Promise<Turn[]> {
    const fila = await this.prisma.chatbotSession.findUnique({ where: { convKey } });
    return (fila?.history as unknown as Turn[]) ?? [];
  }

  async setHistory(convKey: string, turns: Turn[]): Promise<void> {
    const recortado = turns.slice(-MAX_TURNOS);
    await this.prisma.chatbotSession.upsert({
      where: { convKey },
      create: {
        convKey,
        phone: this.telefonoDe(convKey),
        history: recortado as unknown as object,
      },
      update: { history: recortado as unknown as object },
    });
  }

  async getPending(convKey: string): Promise<StoredPending | null> {
    const fila = await this.prisma.chatbotSession.findUnique({ where: { convKey } });
    const p = fila?.pending as unknown as StoredPending | null;
    if (!p) return null;

    if (Date.now() - p.createdAt > PENDIENTE_VIVE_MS) {
      await this.setPending(convKey, null);
      return null;
    }
    return p;
  }

  async setPending(convKey: string, pending: StoredPending | null): Promise<void> {
    await this.prisma.chatbotSession.upsert({
      where: { convKey },
      create: {
        convKey,
        phone: this.telefonoDe(convKey),
        history: [] as unknown as object,
        pending: (pending ?? undefined) as unknown as object,
      },
      update: { pending: (pending ?? null) as unknown as object },
    });
  }

  /** true si el mensaje YA se había visto. */
  async seen(messageId: string): Promise<boolean> {
    if (!messageId) return false;
    try {
      await this.prisma.chatbotSeenMessage.create({ data: { messageId } });
      return false;
    } catch {
      return true;
    }
  }
}
