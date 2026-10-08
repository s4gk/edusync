import { Injectable, Logger } from '@nestjs/common';
import type { AgentUser } from '@s4gk/wa-agent';
import { PrismaService } from '../../prisma/prisma.service';

/** Agentes lógicos. Un solo motor; cambia el prompt y las herramientas. */
export const AGENTE_ACUDIENTE = 'acudiente';
export const AGENTE_DOCENTE = 'docente';
export const AGENTE_ADMIN = 'administrativo';
export const AGENTE_PUBLICO = 'publico';

/**
 * Normaliza a E.164 sin '+', que es como llegan los números de Meta.
 *
 * En Colombia la gente guarda su celular de seis formas distintas
 * (`3001112233`, `+57 300 111 2233`, `57 300-111-2233`…). Si no se normaliza a
 * una sola forma, el mismo acudiente resuelve unas veces y otras no, y el fallo
 * parece aleatorio.
 */
export function normalizarTelefono(bruto: string | null | undefined): string | null {
  if (!bruto) return null;
  let d = String(bruto).replace(/\D/g, '');
  if (!d) return null;
  d = d.replace(/^0+/, '');
  // 10 dígitos que empiezan por 3 es un celular colombiano sin indicativo.
  if (d.length === 10 && d.startsWith('3')) d = '57' + d;
  return d.length >= 10 ? d : null;
}

/**
 * Resuelve el número que escribe a una persona del colegio.
 *
 * Un número desconocido NO es un error: es alguien preguntando por admisiones, y
 * lo atiende el agente público con información que ya es pública. Lo que nunca
 * puede pasar es lo contrario — que un desconocido reciba datos de un menor.
 */
@Injectable()
export class ChatbotIdentityService {
  private readonly logger = new Logger('ChatbotIdentity');

  constructor(private readonly prisma: PrismaService) {}

  async resolver(telefono: string): Promise<AgentUser> {
    const tel = normalizarTelefono(telefono);
    if (!tel) return this.publico(telefono);

    // Se compara sobre los dígitos del teléfono guardado, no sobre el texto:
    // en la base hay '+573001112233' y '300 111 2233' conviviendo.
    const candidatos = await this.prisma.user.findMany({
      where: { isActive: true, deletedAt: null, phone: { not: null } },
      select: {
        id: true, firstName: true, lastName: true, phone: true, role: true,
        teacher: { select: { id: true } },
        guardian: {
          select: {
            id: true,
            students: {
              select: {
                isPrimary: true,
                student: {
                  select: {
                    id: true,
                    user: { select: { firstName: true, lastName: true } },
                    gradeGroup: { select: { id: true, name: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    const user = candidatos.find((u) => normalizarTelefono(u.phone) === tel);
    if (!user) return this.publico(tel);

    const nombre = `${user.firstName} ${user.lastName}`.trim();

    if (user.guardian) {
      const hijos = user.guardian.students.map((v) => ({
        id: v.student.id,
        nombre: `${v.student.user.firstName} ${v.student.user.lastName}`.trim(),
        grupo: v.student.gradeGroup?.name ?? null,
        grupoId: v.student.gradeGroup?.id ?? null,
        principal: v.isPrimary,
      }));
      return {
        id: user.id,
        name: nombre,
        // Permisos deliberadamente mínimos: el acudiente solo consulta, y solo
        // lo suyo. El alcance real (qué estudiantes) va en meta y lo aplica cada
        // herramienta; no se confía en que el modelo se acuerde de filtrar.
        permissions: ['acudiente.consultar'],
        meta: { agente: AGENTE_ACUDIENTE, telefono: tel, hijos },
      };
    }

    if (user.teacher) {
      return {
        id: user.id,
        name: nombre,
        permissions: ['docente.consultar'],
        meta: { agente: AGENTE_DOCENTE, telefono: tel, teacherId: user.teacher.id },
      };
    }

    const ADMINISTRATIVOS = ['SUPER_ADMIN', 'RECTOR', 'COORDINATOR_ACADEMIC', 'COORDINATOR_CONVIVENCIA', 'SECRETARY', 'ACCOUNTANT'];
    if (ADMINISTRATIVOS.includes(user.role)) {
      return {
        id: user.id,
        name: nombre,
        permissions: ['admin.consultar'],
        meta: { agente: AGENTE_ADMIN, telefono: tel, rol: user.role },
      };
    }

    // Estudiante u otro rol sin canal propio todavía.
    return this.publico(tel);
  }

  private publico(telefono: string): AgentUser {
    return {
      id: `publico:${telefono}`,
      name: 'Visitante',
      permissions: [],
      meta: { agente: AGENTE_PUBLICO, telefono },
    };
  }
}
