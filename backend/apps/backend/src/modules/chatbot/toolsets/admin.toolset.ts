import { Injectable } from '@nestjs/common';
import { PERMISSION_DENIED, cop, type Toolset, type ToolContext, type ToolDef } from '@s4gk/wa-agent';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Consultas de dirección: los números que un rector o un coordinador pide de
 * memoria cuando no está frente al computador.
 *
 * Solo lectura y solo agregados o fichas puntuales. Nada de generar boletines,
 * cerrar periodos ni mover estudiantes: son acciones irreversibles o de alto
 * impacto, y confirmarlas con un "sí" en un chat no es garantía suficiente.
 */
@Injectable()
export class AdminToolset implements Toolset {
  constructor(private readonly prisma: PrismaService) {}

  definitions(): ToolDef[] {
    return [
      {
        name: 'resumen_del_colegio',
        description:
          'Cifras generales: estudiantes matriculados, docentes, cursos y estudiantes sin grupo asignado. Úsala cuando pregunten cuántos estudiantes hay, cómo va la matrícula o el estado general.',
        input_schema: { type: 'object', properties: {} },
      },
      {
        name: 'estado_de_cartera',
        description:
          'Cartera: cuánto se ha facturado, cuánto se ha recaudado y cuánto está pendiente o vencido. Úsala cuando pregunten por pagos, cartera, deuda o recaudo.',
        input_schema: { type: 'object', properties: {} },
      },
      {
        name: 'buscar_estudiante',
        description:
          'Busca un estudiante por nombre y devuelve su curso, acudiente y estado de pagos. Úsala cuando pregunten por un estudiante concreto.',
        input_schema: {
          type: 'object',
          properties: { nombre: { type: 'string', description: 'Nombre o apellido a buscar.' } },
          required: ['nombre'],
        },
      },
      {
        name: 'rendimiento_por_curso',
        description:
          'Promedio y número de materias perdidas por curso. Úsala cuando pregunten qué cursos van mejor o peor, o por el rendimiento académico.',
        input_schema: { type: 'object', properties: {} },
      },
    ];
  }

  async execute(name: string, input: Record<string, unknown>, ctx: ToolContext): Promise<string> {
    if (!ctx.can('admin.consultar')) return PERMISSION_DENIED;

    switch (name) {
      case 'resumen_del_colegio': return this.resumen();
      case 'estado_de_cartera': return this.cartera();
      case 'buscar_estudiante': return this.buscar(String(input.nombre ?? ''));
      case 'rendimiento_por_curso': return this.rendimiento();
      default: return `Herramienta desconocida: ${name}`;
    }
  }

  private async resumen(): Promise<string> {
    const [estudiantes, sinGrupo, docentes, cursos, acudientes] = await Promise.all([
      this.prisma.student.count({ where: { user: { isActive: true, deletedAt: null } } }),
      this.prisma.student.count({ where: { gradeGroupId: null, user: { isActive: true, deletedAt: null } } }),
      this.prisma.teacher.count(),
      this.prisma.gradeGroup.count(),
      this.prisma.guardian.count(),
    ]);

    return [
      'Resumen del colegio:',
      `• Estudiantes activos: ${estudiantes}`,
      sinGrupo ? `• Sin curso asignado: ${sinGrupo}` : '• Todos con curso asignado',
      `• Docentes: ${docentes}`,
      `• Cursos: ${cursos}`,
      `• Acudientes registrados: ${acudientes}`,
    ].join('\n');
  }

  private async cartera(): Promise<string> {
    const facturas = await this.prisma.invoice.findMany({
      select: { amount: true, lateFee: true, status: true },
    });
    if (!facturas.length) return 'No hay facturas registradas.';

    const suma = (f: typeof facturas) => f.reduce((s, x) => s + Number(x.amount) + Number(x.lateFee), 0);
    const pagadas = facturas.filter((f) => f.status === 'PAID');
    const vencidas = facturas.filter((f) => f.status === 'OVERDUE' || f.status === 'IN_ARREARS');
    const pendientes = facturas.filter((f) => f.status === 'PENDING');
    const total = suma(facturas);
    const recaudado = suma(pagadas);

    return [
      'Estado de cartera:',
      `• Facturado: ${cop(total)} (${facturas.length} facturas)`,
      `• Recaudado: ${cop(recaudado)} (${pagadas.length}) — ${((recaudado / total) * 100).toFixed(1)}%`,
      `• Pendiente: ${cop(suma(pendientes))} (${pendientes.length})`,
      `• Vencido: ${cop(suma(vencidas))} (${vencidas.length})`,
    ].join('\n');
  }

  private async buscar(nombre: string): Promise<string> {
    if (nombre.trim().length < 2) return 'Dime al menos dos letras del nombre para buscar.';

    const estudiantes = await this.prisma.student.findMany({
      where: {
        user: {
          isActive: true, deletedAt: null,
          OR: [
            { firstName: { contains: nombre, mode: 'insensitive' } },
            { lastName: { contains: nombre, mode: 'insensitive' } },
          ],
        },
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
        gradeGroup: { select: { name: true } },
        guardians: {
          where: { isPrimary: true },
          include: { guardian: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } } },
        },
        invoices: { where: { status: { in: ['PENDING', 'OVERDUE', 'IN_ARREARS'] } }, select: { amount: true, lateFee: true } },
      },
      take: 5,
    });

    if (!estudiantes.length) return `No encontré estudiantes que coincidan con "${nombre}".`;

    const fichas = estudiantes.map((e) => {
      const acu = e.guardians[0]?.guardian.user;
      const deuda = e.invoices.reduce((s, i) => s + Number(i.amount) + Number(i.lateFee), 0);
      return [
        `• ${e.user.firstName} ${e.user.lastName} — ${e.gradeGroup?.name ?? 'sin curso'}`,
        acu ? `  Acudiente: ${acu.firstName} ${acu.lastName}${acu.phone ? ` (${acu.phone})` : ''}` : '  Sin acudiente registrado',
        deuda > 0 ? `  Pendiente de pago: ${cop(deuda)}` : '  Al día en pagos',
      ].join('\n');
    });

    return [`${estudiantes.length} resultado(s):`, ...fichas].join('\n');
  }

  private async rendimiento(): Promise<string> {
    const notas = await this.prisma.gradeRecord.findMany({
      select: {
        score: true,
        student: { select: { gradeGroup: { select: { name: true } } } },
      },
    });
    if (!notas.length) return 'Todavía no hay notas registradas.';

    const porCurso = new Map<string, { suma: number; n: number; perdidas: number }>();
    for (const n of notas) {
      const curso = n.student.gradeGroup?.name ?? 'Sin curso';
      const e = porCurso.get(curso) ?? { suma: 0, n: 0, perdidas: 0 };
      const v = Number(n.score);
      e.suma += v; e.n += 1;
      if (v < 3.0) e.perdidas += 1;
      porCurso.set(curso, e);
    }

    const lineas = [...porCurso.entries()]
      .map(([curso, e]) => ({ curso, prom: e.suma / e.n, perdidas: e.perdidas }))
      .sort((a, b) => a.prom - b.prom)
      .map((x) => `• ${x.curso}: promedio ${x.prom.toFixed(2)} — ${x.perdidas} nota(s) por debajo de 3.0`);

    return ['Rendimiento por curso (de menor a mayor promedio):', ...lineas].join('\n');
  }
}
