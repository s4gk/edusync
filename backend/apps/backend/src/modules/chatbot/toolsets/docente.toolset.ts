import { Injectable } from '@nestjs/common';
import { PERMISSION_DENIED, type Toolset, type ToolContext, type ToolDef } from '@s4gk/wa-agent';
import { PrismaService } from '../../../prisma/prisma.service';

const DIAS = ['', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes'];

/**
 * Lo que un docente puede consultar por WhatsApp. Solo lectura y solo de SUS
 * materias: el `teacherId` sale de la identidad resuelta por teléfono, nunca de
 * lo que diga el mensaje.
 *
 * Pasar lista NO está aquí a propósito. Registrar asistencia por chat, sin ver el
 * curso completo y sin poder corregir, produce datos peores que no tenerlos; para
 * eso está la pantalla de Mi clase.
 */
@Injectable()
export class DocenteToolset implements Toolset {
  constructor(private readonly prisma: PrismaService) {}

  private teacherId(ctx: ToolContext): string | null {
    return (ctx.user.meta?.teacherId as string) ?? null;
  }

  definitions(): ToolDef[] {
    return [
      {
        name: 'mi_horario',
        description:
          'Horario de clases del docente. Úsala cuando pregunte qué clases tiene hoy, mañana o en la semana, o en qué salón le toca.',
        input_schema: {
          type: 'object',
          properties: {
            dia: { type: 'integer', description: 'Día de la semana: 1=lunes … 5=viernes. Si se omite, la semana completa.' },
          },
        },
      },
      {
        name: 'mis_cursos',
        description: 'Materias y cursos que dicta el docente, con cuántos estudiantes tiene cada uno.',
        input_schema: { type: 'object', properties: {} },
      },
      {
        name: 'estudiantes_en_riesgo',
        description:
          'Estudiantes del docente con notas por debajo de 3.0 o inasistencia alta. Úsala cuando pregunte quiénes van mal, quiénes están perdiendo o a quién hay que hacer seguimiento.',
        input_schema: { type: 'object', properties: {} },
      },
    ];
  }

  async execute(name: string, input: Record<string, unknown>, ctx: ToolContext): Promise<string> {
    if (!ctx.can('docente.consultar')) return PERMISSION_DENIED;
    const teacherId = this.teacherId(ctx);
    if (!teacherId) return 'Este número no está asociado a un docente del colegio.';

    switch (name) {
      case 'mi_horario': return this.horario(teacherId, input.dia as number | undefined);
      case 'mis_cursos': return this.cursos(teacherId);
      case 'estudiantes_en_riesgo': return this.riesgo(teacherId);
      default: return `Herramienta desconocida: ${name}`;
    }
  }

  private async horario(teacherId: string, dia?: number): Promise<string> {
    const slots = await this.prisma.scheduleSlot.findMany({
      where: {
        subject: { teacherId },
        ...(dia ? { dayOfWeek: dia } : {}),
      },
      include: { subject: { select: { name: true, gradeGroup: { select: { name: true } } } } },
      orderBy: [{ dayOfWeek: 'asc' }, { block: 'asc' }],
    });
    if (!slots.length) {
      return dia ? `No tienes clases asignadas el ${DIAS[dia] ?? `día ${dia}`}.` : 'No tienes clases asignadas en el horario.';
    }

    if (dia) {
      const lineas = slots.map((s) => `• Bloque ${s.block}: ${s.subject.name} — ${s.subject.gradeGroup.name}${s.room ? ` (salón ${s.room})` : ''}`);
      return [`Tus clases del ${DIAS[dia] ?? `día ${dia}`}:`, ...lineas].join('\n');
    }

    const porDia = new Map<number, string[]>();
    for (const s of slots) {
      const arr = porDia.get(s.dayOfWeek) ?? [];
      arr.push(`  ${s.block}. ${s.subject.name} — ${s.subject.gradeGroup.name}`);
      porDia.set(s.dayOfWeek, arr);
    }
    const bloques = [...porDia.entries()].map(([d, l]) => [`${DIAS[d] ?? `día ${d}`}:`, ...l].join('\n'));
    return [`Tu horario semanal (${slots.length} bloques):`, ...bloques].join('\n');
  }

  private async cursos(teacherId: string): Promise<string> {
    const materias = await this.prisma.subject.findMany({
      where: { teacherId },
      include: {
        gradeGroup: { select: { name: true, _count: { select: { students: true } } } },
      },
      orderBy: { name: 'asc' },
    });
    if (!materias.length) return 'No tienes materias asignadas.';

    const lineas = materias.map(
      (m) => `• ${m.name} — ${m.gradeGroup.name} (${m.gradeGroup._count.students} estudiantes, ${m.hoursPerWeek} h/sem)`,
    );
    return [`Dictas ${materias.length} materia(s):`, ...lineas].join('\n');
  }

  private async riesgo(teacherId: string): Promise<string> {
    const materias = await this.prisma.subject.findMany({
      where: { teacherId },
      select: { id: true, name: true },
    });
    if (!materias.length) return 'No tienes materias asignadas.';
    const ids = materias.map((m) => m.id);

    const bajas = await this.prisma.gradeRecord.findMany({
      where: { subjectId: { in: ids }, score: { lt: 3.0 } },
      include: {
        subject: { select: { name: true } },
        student: { select: { user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { score: 'asc' },
      take: 25,
    });

    if (!bajas.length) return 'Ningún estudiante tuyo tiene notas por debajo de 3.0. 👌';

    // Se agrupa por estudiante: al docente le sirve saber "quién", no repetir el
    // mismo nombre una vez por materia perdida.
    const porEstudiante = new Map<string, { materias: string[]; peor: number }>();
    for (const b of bajas) {
      const nombre = `${b.student.user.firstName} ${b.student.user.lastName}`.trim();
      const e = porEstudiante.get(nombre) ?? { materias: [], peor: 5 };
      e.materias.push(`${b.subject.name} (${Number(b.score).toFixed(1)})`);
      e.peor = Math.min(e.peor, Number(b.score));
      porEstudiante.set(nombre, e);
    }

    const lineas = [...porEstudiante.entries()]
      .sort((a, b) => a[1].peor - b[1].peor)
      .map(([nombre, e]) => `• ${nombre}: ${e.materias.join(', ')}`);

    return [`${porEstudiante.size} estudiante(s) con nota por debajo de 3.0 en tus materias:`, ...lineas].join('\n');
  }
}
