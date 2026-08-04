import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import {
  AgentEngine,
  identityFrom,
  type AgentDefinition,
  type AgentResolver,
  type AgentUser,
  type InboundMessage,
} from '@s4gk/wa-agent';
import { AnthropicProvider } from '@s4gk/wa-agent/anthropic';
import { PrismaService } from '../../prisma/prisma.service';
import { KapsoTransport } from '../whatsapp/kapso.transport';
import {
  AGENTE_ACUDIENTE, AGENTE_ADMIN, AGENTE_DOCENTE, AGENTE_PUBLICO,
  ChatbotIdentityService,
} from './chatbot-identity.service';
import { ChatbotGateService } from './chatbot-gate.service';
import { PrismaSessionStore } from './prisma-session.store';
import { AcudienteToolset } from './toolsets/acudiente.toolset';
import { DocenteToolset } from './toolsets/docente.toolset';
import { AdminToolset } from './toolsets/admin.toolset';
import { PublicoToolset } from './toolsets/publico.toolset';
import { promptAcudiente, promptAdmin, promptDocente, promptPublico, saludo } from './chatbot.prompts';

/**
 * Monta y arranca el agente de WhatsApp sobre @s4gk/wa-agent.
 *
 * Cuatro agentes lógicos comparten un solo motor, un solo transporte y un solo
 * proveedor LLM; lo único que cambia entre ellos es el prompt y el toolset:
 *
 *   acudiente     → familia identificada por su teléfono (lo suyo y solo lo suyo)
 *   docente       → sus materias y sus estudiantes
 *   administrativo→ cifras del colegio
 *   publico       → número desconocido: solo admisiones
 *
 * El motor se MONTA siempre que haya API key, encendido o no. Quién decide si se
 * atiende cada mensaje es el gate, y por eso el interruptor de la UI surte efecto
 * en segundos sin reiniciar: apagar el bot con `pm2 restart` no sirve cuando hay
 * familias escribiendo. Montado y apagado no cuesta nada: ningún mensaje llega
 * al modelo.
 */
@Injectable()
export class ChatbotService implements OnModuleInit {
  private readonly logger = new Logger('Chatbot');
  private engine: AgentEngine | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly transport: KapsoTransport,
    private readonly identity: ChatbotIdentityService,
    private readonly gate: ChatbotGateService,
    private readonly store: PrismaSessionStore,
    private readonly acudiente: AcudienteToolset,
    private readonly docente: DocenteToolset,
    private readonly admin: AdminToolset,
    private readonly publico: PublicoToolset,
  ) {}

  get montado(): boolean {
    return this.engine !== null;
  }

  async onModuleInit(): Promise<void> {
    if (!process.env.ANTHROPIC_API_KEY) {
      this.logger.warn('ANTHROPIC_API_KEY no configurada: el agente de WhatsApp NO se monta.');
      return;
    }

    const agentes: AgentDefinition[] = [
      { name: AGENTE_ACUDIENTE, systemPrompt: promptAcudiente, toolset: this.acudiente },
      { name: AGENTE_DOCENTE, systemPrompt: promptDocente, toolset: this.docente },
      { name: AGENTE_ADMIN, systemPrompt: promptAdmin, toolset: this.admin },
      { name: AGENTE_PUBLICO, systemPrompt: () => promptPublico(), toolset: this.publico },
    ];

    // Quién atiende ya se decidió al resolver la identidad por teléfono. No se le
    // pregunta al modelo: si el enrutado dependiera del texto del mensaje, bastaría
    // con que alguien escribiera "soy el rector" para cambiar de agente.
    const resolver: AgentResolver = {
      resolve: async (user: AgentUser) => (user.meta?.agente as string) ?? AGENTE_PUBLICO,
    };

    this.engine = new AgentEngine({
      provider: new AnthropicProvider({
        model: process.env.WHATSAPP_BOT_MODEL ?? 'claude-haiku-4-5-20251001',
      }),
      transports: [this.transport],
      identity: identityFrom((telefono: string) => this.identity.resolver(telefono)),
      store: this.store,
      agents: agentes,
      agentResolver: resolver,

      // Config heredada (el motor la exige aunque con agentResolver no se use):
      // el agente público es el destino más restrictivo posible si algo fallara.
      systemPrompt: () => promptPublico(),
      toolsets: [this.publico],

      greeting: saludo,
      maxTokens: 700,
      maxToolIterations: 5,

      // El texto del "¿confirmas?" sale del resumen que armó la herramienta, no
      // de una vuelta extra del modelo: así lo que se confirma es exactamente lo
      // que se va a ejecutar, y se ahorra una ida y vuelta completa.
      confirmPrompt: (p) => p.summary,

      audit: async (e) => {
        try {
          await this.prisma.auditLog.create({
            data: {
              userId: e.userId,
              action: e.action,
              entity: 'whatsapp',
              newValues: { summary: e.summary, via: e.via ?? 'whatsapp' } as object,
            },
          });
        } catch (err) {
          this.logger.warn(`No se pudo auditar: ${(err as Error).message}`);
        }
      },

      logger: {
        log: (m: string) => this.logger.log(m),
        warn: (m: string) => this.logger.warn(m),
        error: (m: string) => this.logger.error(m),
      },
    });

    // El corte va ANTES del motor: se envuelve el handler que el motor registró.
    this.interceptar();

    await this.engine.start();

    const cfg = await this.gate.config();
    const estado = cfg.encendido
      ? cfg.piloto
        ? `ENCENDIDO en PILOTO (solo ${cfg.allowlist.length} número(s))`
        : 'ENCENDIDO para todos'
      : 'apagado';
    this.logger.log(`Agente de WhatsApp montado · ${estado} · agentes: acudiente, docente, administrativo, público.`);

    if (cfg.encendido) {
      const probe = await this.transport.probe();
      if (!probe.ok) {
        // Con credenciales muertas el bot pensaría en el vacío: mejor gritarlo.
        this.logger.error(`El bot está ENCENDIDO pero NO puede responder: ${probe.error}`);
      } else {
        this.logger.log(`WhatsApp listo: ${probe.name ?? '?'} (${probe.phone ?? '?'})`);
      }
    }
  }

  /**
   * Único punto de corte del bot. Si el gate dice que no, el mensaje NO llega al
   * motor (cero LLM, cero respuesta) — pero el log de conversación ya lo guardó
   * en el transporte, así que el mensaje queda para que lo atienda una persona.
   */
  private interceptar(): void {
    const original = (this.transport as any)['handler'] as ((m: InboundMessage) => unknown) | null;
    if (!original) {
      this.logger.error('El motor no registró handler en el transporte: el bot no atenderá.');
      return;
    }

    this.transport.onInbound(async (msg: InboundMessage) => {
      const { ok, motivo, aviso } = await this.gate.debeAtender(msg.from);
      if (!ok) {
        this.logger.log(`Mensaje de ${msg.from} no atendido por el bot (${motivo}).`);
        if (aviso) {
          // El único veto que no puede resolverse en silencio: la familia acaba
          // de escribir y merece saber que su mensaje llegó.
          void this.transport.sendText(msg.from, aviso).catch(() => undefined);
        }
        return;
      }

      await this.gate.registrarUso(`${this.transport.name}:${msg.from}`, msg.from);
      await original(msg);
    });
  }
}
