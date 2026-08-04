import { Injectable } from '@nestjs/common';
import { PERMISSION_DENIED, cop, type Toolset, type ToolContext, type ToolDef } from '@s4gk/wa-agent';
import { PrismaService } from '../../../prisma/prisma.service';

interface Hijo {
  id: string;
  nombre: string;
  grupo: string | null;
  principal: boolean;
}

const MESES = ['', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/**
 * Lo que un acudiente puede consultar por WhatsApp sobre SUS hijos.
 *
 * Regla que atraviesa todo el archivo: el alcance NO se le pregunta al modelo.
 * Cada herramienta resuelve el estudiante contra la lista de hijos que trae la
 * identidad, y si el nombre no casa, no responde. Si el modelo alucinara un id
 * de otro estudiante —o alguien intentara inducirlo con un mensaje— aquí no
 * pasa: el filtro es de código, no de prompt.
 *
 * Todo es de LECTURA. El canal de WhatsApp no escribe en el expediente de un
 * menor: para eso está la plataforma, con sesión y auditoría.
 */
@Injectable()
export class AcudienteToolset implements Toolset {
  constructor(private readonly prisma: PrismaService) {}

  private hijos(ctx: ToolContext): Hijo[] {
    return (ctx.user.meta?.hijos as Hijo[]) ?? [];
  }

  /** Resuelve "Iván", "mi hijo" o nada → un hijo concreto, o un mensaje claro. */
  private resolverHijo(ctx: ToolContext, nombre?: string): Hijo | string {
    const hijos = this.hijos(ctx);
    if (!hijos.length) return 'No tengo ningún estudiante asociado a este número.';
    if (hijos.length === 1) return hijos[0];

    if (!nombre) {
      return `Tienes varios estudiantes asociados: ${hijos.map((h) => h.nombre).join(', ')}. ¿Sobre cuál preguntas?`;
    }
    const buscado = nombre.toLowerCase().trim();
    const encontrado =
      hijos.find((h) => h.nombre.toLowerCase() === buscado) ??
      hijos.find((h) => h.nombre.toLowerCase().includes(buscado)) ??
      hijos.find((h) => buscado.includes(h.nombre.toLowerCase().split(' ')[0]));

    return encontrado ?? `No encontré a "${nombre}" entre los estudiantes asociados a este número (${hijos.map((h) => h.nombre).join(', ')}).`;
  }

  definitions(ctx: ToolContext): ToolDef[] {
    const nombres = this.hijos(ctx).map((h) => h.nombre).join(', ');
    const paramEstudiante = {
      estudiante: {
        type: 'string',
        description: `Nombre del estudiante. Solo si hay más de uno asociado (${nombres || 'ninguno'}).`,
      },
    };

    return [
      {
        name: 'consultar_notas',
        description:
          'Notas del estudiante por materia en un periodo. Úsala cuando pregunten por calificaciones, cómo va, si perdió algo, o el rendimiento en una materia.',
        input_schema: {
          type: 'object',
          properties: {
            ...paramEstudiante,
            periodo: { type: 'integer', description: 'Número de periodo (1 a 4). Si se omite, el más reciente con notas.' },
          },
        },
      },
      {
        name: 'consultar_asistencia',
        description:
          'Resumen de asistencia del estudiante: cuántas clases asistió, faltó, llegó tarde o tuvo excusa. Úsala cuando pregunten por faltas, inasistencias o si el estudiante ha estado yendo a clase.',
        input_schema: { type: 'object', properties: { ...paramEstudiante } },
      },
      {
        name: 'consultar_pagos',
        description:
          'Estado de la pensión: facturas pendientes, vencidas y pagadas. Úsala cuando pregunten por pagos, pensión, cuánto deben o si están al día.',
        input_schema: { type: 'object', properties: { ...paramEstudiante } },
      },
      {
        name: 'consultar_observaciones',
        description:
          'Anotaciones del observador del estudiante (académicas, reconocimientos, convivencia). Úsala cuando pregunten por el comportamiento, si hubo alguna anotación o algún reporte.',
        input_schema: { type: 'object', properties: { ...paramEstudiante } },
      },
      {
        name: 'datos_del_estudiante',
        description:
          'Datos básicos: curso, código de matrícula y director de grupo. Úsala cuando pregunten en qué curso está o quién es su director de grupo.',
        input_schema: { type: 'object', properties: { ...paramEstudiante } },
      },
    ];
  }

  async execute(name: string, input: Record<string, unknown>, ctx: ToolContext): Promise<string> {
    if (!ctx.can('acudiente.consultar')) return PERMISSION_DENIED;

    const hijo = this.resolverHijo(ctx, input.estudiante as string | undefined);
    if (typeof hijo === 'string') return hijo;

    switch (name) {
      case 'consultar_notas': return this.notas(hijo, input.periodo as number | undefined);
      case 'consultar_asistencia': return this.asistencia(hijo);
      case 'consultar_pagos': return this.pagos(hijo);
      case 'consultar_observaciones': return this.observaciones(hijo);
      case 'datos_del_estudiante': return this.datos(hijo);
      default: return `Herramienta desconocida: ${name}`;
    }
  }

  private async notas(hijo: Hijo, periodo?: number): Promise<string> {
    const where: any = { studentId: hijo.id };
    if (periodo) where.period = `P${periodo}`;

    const notas = await this.prisma.gradeRecord.findMany({
      where,
      include: { subject: { select: { name: true } } },
      orderBy: [{ period: 'desc' }, { subject: { name: 'asc' } }],
    });
    if (!notas.length) {
      return `Todavía no hay notas registradas para ${hijo.nombre}${periodo ? ` en el periodo ${periodo}` : ''}.`;
    }

    // Sin periodo pedido, se muestra el más reciente que tenga notas: dar todos
    // los periodos de golpe en un WhatsApp es ilegible.
    const objetivo = periodo ? `P${periodo}` : notas[0].period;
    const delPeriodo = notas.filter((n) => n.period === objetivo);

    const lineas = delPeriodo.map((n) => {
      const v = Number(n.score);
      return `• ${n.subject.name}: ${v.toFixed(1)} (${n.scale.toLowerCase()})`;
    });
    const promedio = delPeriodo.reduce((s, n) => s + Number(n.score), 0) / delPeriodo.length;
    const perdidas = delPeriodo.filter((n) => Number(n.score) < 3.0);

    return [
      `Notas de ${hijo.nombre} — periodo ${objetivo.replace('P', '')}:`,
      ...lineas,
      `Promedio: ${promedio.toFixed(2)}`,
      perdidas.length
        ? `Materias por debajo de 3.0: ${perdidas.map((n) => n.subject.name).join(', ')}.`
        : 'No tiene materias por debajo de 3.0.',
    ].join('\n');
  }

  private async asistencia(hijo: Hijo): Promise<string> {
    const registros = await this.prisma.attendance.findMany({
      where: { studentId: hijo.id },
      select: { status: true, date: true },
      orderBy: { date: 'desc' },
    });
    if (!registros.length) return `Aún no hay registros de asistencia para ${hijo.nombre}.`;

    const cuenta = (s: string) => registros.filter((r) => r.status === s).length;
    const total = registros.length;
    const presentes = cuenta('PRESENT');
    const ausentes = cuenta('ABSENT');
    const tarde = cuenta('LATE');
    const excusa = cuenta('EXCUSED') + cuenta('PERMISSION');
    const evasion = cuenta('EVASION');
    const pct = ((presentes + tarde) / total) * 100;

    const partes = [
      `Asistencia de ${hijo.nombre} (${total} registros):`,
      `• Asistió: ${presentes}`,
      ausentes ? `• Faltó: ${ausentes}` : null,
      tarde ? `• Llegó tarde: ${tarde}` : null,
      excusa ? `• Con excusa: ${excusa}` : null,
      evasion ? `• Evasión: ${evasion}` : null,
      `Porcentaje de asistencia: ${pct.toFixed(1)}%`,
    ].filter(Boolean);

    if (ausentes) {
      const ultimas = registros.filter((r) => r.status === 'ABSENT').slice(0, 3);
      partes.push(`Últimas faltas: ${ultimas.map((r) => r.date.toISOString().slice(0, 10)).join(', ')}.`);
    }
    return partes.join('\n');
  }

  private async pagos(hijo: Hijo): Promise<string> {
    const facturas = await this.prisma.invoice.findMany({
      where: { studentId: hijo.id },
      orderBy: { month: 'asc' },
    });
    if (!facturas.length) return `No hay facturas registradas para ${hijo.nombre}.`;

    const pendientes = facturas.filter((f) => f.status === 'PENDING' || f.status === 'OVERDUE' || f.status === 'IN_ARREARS');
    if (!pendientes.length) {
      return `${hijo.nombre} está al día: no hay facturas pendientes. Se registran ${facturas.filter((f) => f.status === 'PAID').length} pago(s).`;
    }

    const deuda = pendientes.reduce((s, f) => s + Number(f.amount) + Number(f.lateFee), 0);
    const lineas = pendientes.map((f) => {
      const mora = Number(f.lateFee) > 0 ? ` (incluye ${cop(Number(f.lateFee))} de mora)` : '';
      const vencida = f.status !== 'PENDING' ? ' — VENCIDA' : '';
      return `• ${MESES[f.month] ?? `mes ${f.month}`}: ${cop(Number(f.amount) + Number(f.lateFee))}${mora}${vencida}`;
    });

    return [
      `Pensión de ${hijo.nombre} — ${pendientes.length} factura(s) pendiente(s):`,
      ...lineas,
      `Total: ${cop(deuda)}`,
      'Para pagar o aclarar un pago ya hecho, comunícate con la secretaría del colegio.',
    ].join('\n');
  }

  private async observaciones(hijo: Hijo): Promise<string> {
    const obs = await this.prisma.observation.findMany({
      where: { studentId: hijo.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    if (!obs.length) return `No hay anotaciones registradas para ${hijo.nombre}.`;

    const etiqueta: Record<string, string> = {
      ACADEMIC: 'Académica',
      DISCIPLINARY_POSITIVE: 'Reconocimiento',
      DISCIPLINARY_NEUTRAL: 'Convivencia',
      DISCIPLINARY_MILD: 'Convivencia (leve)',
      DISCIPLINARY_SERIOUS: 'Convivencia (grave)',
      DISCIPLINARY_VERY_SERIOUS: 'Convivencia (muy grave)',
    };

    const lineas = obs.map((o) => {
      const fecha = o.createdAt.toISOString().slice(0, 10);
      return `• ${fecha} — ${etiqueta[o.type] ?? o.type}: ${o.content.slice(0, 200)}`;
    });
    return [`Últimas anotaciones de ${hijo.nombre}:`, ...lineas].join('\n');
  }

  private async datos(hijo: Hijo): Promise<string> {
    const est = await this.prisma.student.findUnique({
      where: { id: hijo.id },
      select: {
        enrollmentCode: true,
        gradeGroup: {
          select: {
            name: true,
            gradeLevel: true,
            director: { select: { user: { select: { firstName: true, lastName: true } } } },
          },
        },
      },
    });
    if (!est) return `No encontré los datos de ${hijo.nombre}.`;

    const dir = est.gradeGroup?.director?.user;
    return [
      `${hijo.nombre}`,
      `• Curso: ${est.gradeGroup?.name ?? 'sin asignar'}`,
      `• Código de matrícula: ${est.enrollmentCode ?? 'no registrado'}`,
      dir ? `• Director de grupo: ${dir.firstName} ${dir.lastName}` : '• Director de grupo: sin asignar',
    ].join('\n');
  }
}
