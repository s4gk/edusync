import {
  Injectable,
  ServiceUnavailableException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

/**
 * Proxy hacia la Claude API (Anthropic). La credencial vive SOLO en el backend
 * (ANTHROPIC_API_KEY); el navegador nunca la ve. Si la variable no está
 * configurada, responde 503 con un mensaje claro — el resto del producto sigue
 * funcionando y el Coach queda "listo para la key".
 *
 * Nota: se usa fetch directo (Node 20) en vez del SDK oficial porque el gestor
 * de paquetes del monorepo (pnpm 11) requiere Node 22 y no corre en este host.
 */
@Injectable()
export class CoachService {
  private readonly MODEL = 'claude-opus-4-8';
  private readonly ENDPOINT = 'https://api.anthropic.com/v1/messages';

  async chat(messages: ChatMessage[], context?: string): Promise<{ reply: string }> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'El Coach IA aún no está configurado. Falta definir ANTHROPIC_API_KEY en el backend.',
      );
    }

    const clean = (Array.isArray(messages) ? messages : [])
      .filter(
        (m) =>
          m &&
          (m.role === 'user' || m.role === 'assistant') &&
          typeof m.content === 'string' &&
          m.content.trim().length > 0,
      )
      .map((m) => ({ role: m.role, content: m.content.trim() }))
      .slice(-20);

    if (!clean.length || clean[0].role !== 'user') {
      throw new BadRequestException('La conversación debe iniciar con un mensaje del usuario.');
    }

    const system = [
      'Eres "Edusync Coach", un asistente para familias y estudiantes de un colegio en Colombia.',
      'Hablas en español, con tono cercano, claro y respetuoso. Orientas sobre desempeño académico, hábitos de estudio y comunicación con docentes.',
      'Responde directamente y de forma concisa, sin describir tu razonamiento ni tus pasos internos.',
      'Básate únicamente en la información proporcionada. Si no tienes un dato, dilo y sugiere consultarlo con el colegio. No inventes notas, fechas ni cifras.',
      'Para decisiones importantes, recomienda confirmar siempre con el docente o la coordinación.',
      context ? `\nContexto del estudiante (datos verificados del colegio):\n${context}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    let res: { ok: boolean; status: number; json: () => Promise<any> };
    try {
      res = await fetch(this.ENDPOINT, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: this.MODEL,
          max_tokens: 1024,
          system,
          messages: clean,
        }),
      });
    } catch {
      throw new InternalServerErrorException('No se pudo contactar el servicio de IA.');
    }

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new ServiceUnavailableException(
          'La credencial del Coach IA es inválida. Revisa ANTHROPIC_API_KEY en el backend.',
        );
      }
      if (res.status === 429 || res.status === 529) {
        throw new ServiceUnavailableException(
          'El Coach IA está saturado en este momento. Intenta de nuevo en unos segundos.',
        );
      }
      throw new InternalServerErrorException('El servicio de IA devolvió un error.');
    }

    const data = await res.json().catch(() => null);
    const reply = ((data?.content ?? []) as any[])
      .filter((b) => b?.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();

    return { reply: reply || 'No pude generar una respuesta en este momento.' };
  }
}
