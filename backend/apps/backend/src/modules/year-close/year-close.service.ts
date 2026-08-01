import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** Máx. de áreas perdidas para promoción con recuperación (regla institucional típica). */
const MAX_FAILS = 2;
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
}
