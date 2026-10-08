import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PromoteDto } from './dto/promote.dto';

/** Máx. de áreas perdidas para promoción con recuperación (regla institucional típica). */
const MAX_FAILS = 2;
/** Grado 11 es el último de la educación media: de ahí se gradúa, no se sube. */
const MAX_GRADE_LEVEL = 11;
const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Cierre de año: consolida la definitiva del año por estudiante y área
 * (promedio ponderado por el peso de cada periodo), calcula áreas perdidas y
 * el estado de promoción. SOLO LECTURA — no mueve estudiantes de grado.
 */
@Injectable()
export class YearCloseService {
  constructor(private readonly prisma: PrismaService) {}

  async consolidation(academicYearId: string, gradeGroupId: string) {
    const group = await this.prisma.gradeGroup.findUnique({
      where: { id: gradeGroupId },
      select: {
        id: true,
        name: true,
        gradeLevel: true,
        subjects: { select: { id: true, name: true }, orderBy: { name: 'asc' } },
        students: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
      },
    });
    if (!group) throw new NotFoundException('Grupo no encontrado');

    const periods = await this.prisma.academicPeriod.findMany({
      where: { academicYearId },
      select: { periodNumber: true, weightPercent: true },
    });
    const weightOf = new Map<number, number>();
    periods.forEach((p) => weightOf.set(p.periodNumber, Number(p.weightPercent) || 0));
    const hasWeights = [...weightOf.values()].some((w) => w > 0);

    const studentIds = group.students.map((s) => s.id);
    const records = studentIds.length
      ? await this.prisma.gradeRecord.findMany({
          where: { studentId: { in: studentIds }, subject: { gradeGroupId } },
          select: { studentId: true, subjectId: true, period: true, score: true },
        })
      : [];

    // studentId -> subjectId -> { sum ponderado, peso total }
    const acc = new Map<string, Map<string, { sum: number; w: number }>>();
    for (const r of records) {
      const pn = parseInt(String(r.period).replace('P', ''), 10);
      const w = hasWeights ? weightOf.get(pn) ?? 0 : 1; // sin pesos definidos → promedio simple
      if (w <= 0) continue;
      if (!acc.has(r.studentId)) acc.set(r.studentId, new Map());
      const sm = acc.get(r.studentId)!;
      const cur = sm.get(r.subjectId) ?? { sum: 0, w: 0 };
      cur.sum += Number(r.score) * w;
      cur.w += w;
      sm.set(r.subjectId, cur);
    }

    const students = group.students
      .map((st) => {
        const sm = acc.get(st.id) ?? new Map<string, { sum: number; w: number }>();
        const finals: Record<string, number | null> = {};
        const vals: number[] = [];
        let failed = 0;
        for (const subj of group.subjects) {
          const a = sm.get(subj.id);
          const f = a && a.w > 0 ? round1(a.sum / a.w) : null;
          finals[subj.id] = f;
          if (f != null) {
            vals.push(f);
            if (f < 3.0) failed += 1;
          }
        }
        const overall = vals.length ? round1(vals.reduce((x, y) => x + y, 0) / vals.length) : null;
        let status: 'PROMOVIDO' | 'RECUPERACION' | 'REPROBADO' | 'SIN_NOTAS';
        if (overall == null) status = 'SIN_NOTAS';
        else if (failed === 0) status = 'PROMOVIDO';
        else if (failed <= MAX_FAILS) status = 'RECUPERACION';
        else status = 'REPROBADO';
        return { studentId: st.id, name: `${st.user.firstName} ${st.user.lastName}`, finals, overall, failed, status };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    const graded = students.filter((s) => s.overall != null);
    const summary = {
      total: students.length,
      promovidos: students.filter((s) => s.status === 'PROMOVIDO').length,
      recuperacion: students.filter((s) => s.status === 'RECUPERACION').length,
      reprobados: students.filter((s) => s.status === 'REPROBADO').length,
      sinNotas: students.filter((s) => s.status === 'SIN_NOTAS').length,
      promedioGrupo: graded.length ? round1(graded.reduce((x, y) => x + (y.overall as number), 0) / graded.length) : null,
    };

    return {
      group: { id: group.id, name: group.name, gradeLevel: group.gradeLevel },
      subjects: group.subjects.map((s) => ({ id: s.id, name: s.name })),
      maxFails: MAX_FAILS,
      students,
      summary,
    };
  }

  // ─── Promoción al año siguiente ─────────────────────────────────────────────

  /**
   * Simula la promoción de un año a otro SIN escribir nada.
   *
   * Es a propósito un paso aparte: mover estudiantes de grado es lo más
   * parecido a un acto administrativo que hace el sistema, y quien lo firma
   * tiene que poder ver antes, estudiante por estudiante, a dónde va a quedar
   * y qué casos no tienen destino.
   */
  async promotionPreview(fromYearId: string, toYearId: string) {
    const [fromYear, toYear] = await Promise.all([
      this.prisma.academicYear.findUnique({ where: { id: fromYearId } }),
      this.prisma.academicYear.findUnique({ where: { id: toYearId } }),
    ]);
    if (!fromYear) throw new NotFoundException('Año de origen no encontrado');
    if (!toYear) throw new NotFoundException('Año de destino no encontrado');
    if (fromYearId === toYearId) throw new BadRequestException('El año de origen y el de destino no pueden ser el mismo.');

    const origen = await this.prisma.gradeGroup.findMany({
      where: { academicYearId: fromYearId },
      select: { id: true, name: true, gradeLevel: true },
      orderBy: [{ gradeLevel: 'asc' }, { name: 'asc' }],
    });
    const destino = await this.prisma.gradeGroup.findMany({
      where: { academicYearId: toYearId },
      select: { id: true, name: true, gradeLevel: true, _count: { select: { students: true } } },
      orderBy: [{ gradeLevel: 'asc' }, { name: 'asc' }],
    });

    // Se conserva la letra del curso cuando existe (6A → 7A); si no, cae al
    // primer curso del grado destino.
    const letra = (nombre: string) => nombre.replace(/[^A-Za-z]/g, '').toUpperCase();
    const destinoPara = (nivel: number, nombreActual: string) =>
      destino.find((d) => d.gradeLevel === nivel && letra(d.name) === letra(nombreActual)) ??
      destino.find((d) => d.gradeLevel === nivel) ??
      null;

    const filas: any[] = [];
    for (const g of origen) {
      const acta = await this.consolidation(fromYearId, g.id);
      for (const st of acta.students) {
        // REPROBADO y SIN_NOTAS repiten grado; el resto sube uno.
        const repite = st.status === 'REPROBADO' || st.status === 'SIN_NOTAS';
        const nivelDestino = repite ? g.gradeLevel : g.gradeLevel + 1;
        const target = nivelDestino > MAX_GRADE_LEVEL ? null : destinoPara(nivelDestino, g.name);

        filas.push({
          studentId: st.studentId,
          name: st.name,
          status: st.status,
          overall: st.overall,
          failed: st.failed,
          from: { id: g.id, name: g.name, gradeLevel: g.gradeLevel },
          to: target ? { id: target.id, name: target.name, gradeLevel: target.gradeLevel } : null,
          accion: nivelDestino > MAX_GRADE_LEVEL ? 'GRADUA' : repite ? 'REPITE' : 'PROMUEVE',
          // Sin curso destino no se puede mover: o falta crearlo, o el
          // estudiante se gradúa.
          bloqueado: !target && nivelDestino <= MAX_GRADE_LEVEL,
        });
      }
    }

    const cuenta = (f: (x: any) => boolean) => filas.filter(f).length;
    return {
      fromYear: { id: fromYear.id, year: fromYear.year },
      toYear: { id: toYear.id, year: toYear.year },
      cursosDestino: destino.map((d) => ({ id: d.id, name: d.name, gradeLevel: d.gradeLevel, estudiantes: d._count.students })),
      rows: filas.sort((a, b) => a.from.gradeLevel - b.from.gradeLevel || a.from.name.localeCompare(b.from.name) || a.name.localeCompare(b.name)),
      summary: {
        total: filas.length,
        promueve: cuenta((f) => f.accion === 'PROMUEVE' && !f.bloqueado),
        repite: cuenta((f) => f.accion === 'REPITE' && !f.bloqueado),
        gradua: cuenta((f) => f.accion === 'GRADUA'),
        bloqueados: cuenta((f) => f.bloqueado),
      },
    };
  }

  /**
   * Ejecuta la promoción: mueve cada estudiante al curso indicado.
   *
   * Solo cambia `Student.gradeGroupId`. Las notas, la asistencia y el
   * observador cuelgan de las materias del año viejo, así que el historial
   * queda intacto y un traslado equivocado se corrige moviendo al estudiante
   * de vuelta desde Cursos.
   */
  async promote(dto: PromoteDto, userId: string) {
    if (!dto.assignments?.length) throw new BadRequestException('No hay estudiantes para promover.');

    const studentIds = dto.assignments.map((a) => a.studentId);
    const groupIds = [...new Set(dto.assignments.map((a) => a.gradeGroupId))];

    const [estudiantes, grupos] = await Promise.all([
      this.prisma.student.findMany({ where: { id: { in: studentIds } }, select: { id: true } }),
      this.prisma.gradeGroup.findMany({
        where: { id: { in: groupIds }, academicYearId: dto.toYearId },
        select: { id: true },
      }),
    ]);
    if (estudiantes.length !== studentIds.length) {
      throw new BadRequestException('Alguno de los estudiantes ya no existe.');
    }
    const validos = new Set(grupos.map((g) => g.id));
    const ajenos = groupIds.filter((g) => !validos.has(g));
    if (ajenos.length) {
      throw new BadRequestException('Hay cursos de destino que no pertenecen al año lectivo indicado.');
    }

    await this.prisma.$transaction(
      dto.assignments.map((a) =>
        this.prisma.student.update({ where: { id: a.studentId }, data: { gradeGroupId: a.gradeGroupId } }),
      ),
    );

    // Queda registrado como un solo acto, con el detalle de a dónde fue cada
    // quien: es lo que se consulta cuando una familia pregunta por qué su hijo
    // quedó en otro curso.
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'YEAR_PROMOTE',
        entity: 'Promoción',
        entityId: dto.toYearId,
        newValues: {
          desde: dto.fromYearId,
          hacia: dto.toYearId,
          estudiantes: dto.assignments.length,
          detalle: dto.assignments.slice(0, 200) as unknown as Prisma.InputJsonValue,
        } as Prisma.InputJsonObject,
      },
    }).catch(() => {});

    return { movidos: dto.assignments.length };
  }
}
