import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateAchievementDto,
  UpdateAchievementDto,
  CreateActivityDto,
  UpdateActivityDto,
  SaveScoresDto,
  QueryGradesDto,
} from './dto/grades.dto';
import { teacherScope, type ReqUser } from '../../common/scope.util';

@Injectable()
export class GradesService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Guard: el profesor solo opera sobre SUS materias ──────────────────────

  private async assertOwnsSubject(subjectId: string, user?: ReqUser) {
    const teacherId = await teacherScope(this.prisma, user);
    if (!teacherId) return; // rol privilegiado → sin restricción
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
      select: { teacherId: true },
    });
    if (!subject) throw new NotFoundException('Materia no encontrada');
    if (subject.teacherId !== teacherId) {
      throw new ForbiddenException('No tiene acceso a esta materia');
    }
  }

  // ─── Guard: periodo abierto (RF-CAL-06) ────────────────────────────────────

  private async assertPeriodOpen(subjectId: string, periodNumber: number) {
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
      include: { gradeGroup: { include: { academicYear: { include: { academicPeriods: true } } } } },
    });
    if (!subject) throw new NotFoundException('Materia no encontrada');

    const period = subject.gradeGroup.academicYear.academicPeriods.find((p) => p.periodNumber === periodNumber);
    if (period?.isClosed) {
      throw new ForbiddenException(`El periodo ${periodNumber} está cerrado. No se pueden modificar calificaciones.`);
    }
  }

  // ─── Achievements (Logros) — RF-CAL-01 ─────────────────────────────────────

  async findAchievements(subjectId: string, periodNumber?: number, user?: ReqUser) {
    await this.assertOwnsSubject(subjectId, user);
    return this.prisma.achievement.findMany({
      where: { subjectId, ...(periodNumber ? { periodNumber } : {}) },
      include: { activities: { orderBy: { createdAt: 'asc' } } },
      orderBy: { periodNumber: 'asc' },
    });
  }

  async createAchievement(dto: CreateAchievementDto, user?: ReqUser) {
    await this.assertOwnsSubject(dto.subjectId, user);
    await this.assertPeriodOpen(dto.subjectId, dto.periodNumber);

    // RF-CAL-05: validar suma de pesos del periodo ≤ 100%
    const existing = await this.prisma.achievement.findMany({
      where: { subjectId: dto.subjectId, periodNumber: dto.periodNumber },
    });
    const totalWeight = existing.reduce((s, a) => s + Number(a.weightPercent), 0) + dto.weightPercent;
    if (totalWeight > 100) {
      throw new BadRequestException(`La suma de pesos de logros del periodo excede 100% (actual: ${totalWeight - dto.weightPercent}%)`);
    }

    return this.prisma.achievement.create({ data: dto, include: { activities: true } });
  }

  async updateAchievement(id: string, dto: UpdateAchievementDto) {
    const achievement = await this.prisma.achievement.findUnique({ where: { id } });
    if (!achievement) throw new NotFoundException('Logro no encontrado');
    await this.assertPeriodOpen(achievement.subjectId, achievement.periodNumber);

    if (dto.weightPercent !== undefined) {
      const siblings = await this.prisma.achievement.findMany({
        where: { subjectId: achievement.subjectId, periodNumber: achievement.periodNumber, NOT: { id } },
      });
      const total = siblings.reduce((s, a) => s + Number(a.weightPercent), 0) + dto.weightPercent;
      if (total > 100) throw new BadRequestException(`Peso excede 100% (total quedaría: ${total}%)`);
    }

    return this.prisma.achievement.update({ where: { id }, data: dto });
  }

  async deleteAchievement(id: string) {
    const achievement = await this.prisma.achievement.findUnique({ where: { id } });
    if (!achievement) throw new NotFoundException('Logro no encontrado');
    await this.assertPeriodOpen(achievement.subjectId, achievement.periodNumber);
    return this.prisma.achievement.delete({ where: { id } });
  }

  // ─── Activities — RF-CAL-01 ─────────────────────────────────────────────────

  async createActivity(dto: CreateActivityDto, user?: ReqUser) {
    const achievement = await this.prisma.achievement.findUnique({
      where: { id: dto.achievementId },
      include: { activities: true },
    });
    if (!achievement) throw new NotFoundException('Logro no encontrado');
    await this.assertOwnsSubject(achievement.subjectId, user);
    await this.assertPeriodOpen(achievement.subjectId, achievement.periodNumber);

    // RF-CAL-05: validar suma de pesos de actividades del logro ≤ 100%
    const totalWeight = achievement.activities.reduce((s, a) => s + Number(a.weightPercent), 0) + dto.weightPercent;
    if (totalWeight > 100) {
      throw new BadRequestException(`La suma de pesos de actividades del logro excede 100% (actual: ${totalWeight - dto.weightPercent}%)`);
    }

    return this.prisma.activity.create({
      data: { ...dto, date: dto.date ? new Date(dto.date) : undefined },
    });
  }

  async updateActivity(id: string, dto: UpdateActivityDto) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: { achievement: true },
    });
    if (!activity) throw new NotFoundException('Actividad no encontrada');
    await this.assertPeriodOpen(activity.achievement.subjectId, activity.achievement.periodNumber);

    if (dto.weightPercent !== undefined) {
      const siblings = await this.prisma.activity.findMany({
        where: { achievementId: activity.achievementId, NOT: { id } },
      });
      const total = siblings.reduce((s, a) => s + Number(a.weightPercent), 0) + dto.weightPercent;
      if (total > 100) throw new BadRequestException(`Peso de actividades excede 100% (total: ${total}%)`);
    }

    return this.prisma.activity.update({
      where: { id },
      data: { ...dto, date: dto.date ? new Date(dto.date) : undefined },
    });
  }

  async deleteActivity(id: string) {
    const activity = await this.prisma.activity.findUnique({ where: { id }, include: { achievement: true } });
    if (!activity) throw new NotFoundException('Actividad no encontrada');
    await this.assertPeriodOpen(activity.achievement.subjectId, activity.achievement.periodNumber);
    return this.prisma.activity.delete({ where: { id } });
  }

  // ─── Scores — RF-CAL-02 ─────────────────────────────────────────────────────

  async saveScores(dto: SaveScoresDto, user?: ReqUser) {
    const activity = await this.prisma.activity.findUnique({
      where: { id: dto.activityId },
      include: { achievement: true },
    });
    if (!activity) throw new NotFoundException('Actividad no encontrada');
    await this.assertOwnsSubject(activity.achievement.subjectId, user);
    await this.assertPeriodOpen(activity.achievement.subjectId, activity.achievement.periodNumber);

    await this.prisma.$transaction(
      dto.scores.map((s) =>
        this.prisma.activityScore.upsert({
          where: { activityId_studentId: { activityId: dto.activityId, studentId: s.studentId } },
          create: { activityId: dto.activityId, studentId: s.studentId, score: s.score },
          update: { score: s.score },
        }),
      ),
    );

    // RF-CAL-03/04: recalcular nota final del periodo para cada estudiante
    for (const s of dto.scores) {
      await this.computeAndSaveGradeRecord(s.studentId, activity.achievement.subjectId, activity.achievement.periodNumber);
    }

    return { saved: dto.scores.length };
  }

  // ─── Grades Matrix — RF-CAL-02 ──────────────────────────────────────────────

  async getMatrix(subjectId: string, periodNumber: number, user?: ReqUser) {
    await this.assertOwnsSubject(subjectId, user);
    const achievements = await this.prisma.achievement.findMany({
      where: { subjectId, periodNumber },
      include: {
        activities: {
          include: {
            scores: { include: { student: { include: { user: { select: { firstName: true, lastName: true } } } } } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        gradeGroup: {
          include: { students: { include: { user: { select: { firstName: true, lastName: true } } } } },
        },
      },
    });

    const students = subject?.gradeGroup.students ?? [];

    return {
      subjectId,
      periodNumber,
      achievements: achievements.map((ach) => ({
        id: ach.id,
        name: ach.name,
        weightPercent: ach.weightPercent,
        activities: ach.activities.map((act) => ({
          id: act.id,
          name: act.name,
          weightPercent: act.weightPercent,
          maxScore: act.maxScore,
          scores: students.map((st) => {
            const found = act.scores.find((sc) => sc.studentId === st.id);
            return {
              studentId: st.id,
              name: `${st.user.firstName} ${st.user.lastName}`,
              score: found ? Number(found.score) : null,
            };
          }),
        })),
      })),
    };
  }

  async getStudentGrades(query: QueryGradesDto, user?: ReqUser) {
    const { subjectId, studentId, periodNumber } = query;
    const where: any = {};
    if (subjectId) where.subjectId = subjectId;
    if (studentId) where.studentId = studentId;
    if (periodNumber) where.period = `P${periodNumber}`;
    // Un profesor solo ve notas de SUS materias.
    const teacherId = await teacherScope(this.prisma, user);
    if (teacherId) where.subject = { teacherId };

    return this.prisma.gradeRecord.findMany({
      where,
      include: {
        subject: { select: { name: true } },
        student: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { period: 'asc' },
    });
  }

  // ─── RF-CAL-03/04: Cálculo ponderado + conversión a escala ─────────────────

  async computeAndSaveGradeRecord(studentId: string, subjectId: string, periodNumber: number) {
    const achievements = await this.prisma.achievement.findMany({
      where: { subjectId, periodNumber },
      include: { activities: { include: { scores: { where: { studentId } } } } },
    });

    if (!achievements.length) return null;

    let subjectScore = 0;
    for (const ach of achievements) {
      let achScore = 0;
      for (const act of ach.activities) {
        const scoreRecord = act.scores[0];
        if (scoreRecord) {
          achScore += (Number(scoreRecord.score) / Number(act.maxScore)) * 5 * (Number(act.weightPercent) / 100);
        }
      }
      subjectScore += achScore * (Number(ach.weightPercent) / 100);
    }

    const finalScore = Math.round(subjectScore * 100) / 100;

    // RF-CAL-04: conversión a escala usando GradeScaleConfig del año lectivo
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
      include: { gradeGroup: { include: { academicYear: { include: { gradeScaleConfigs: true } } } } },
    });

    let scale = this.defaultScale(finalScore);
    if (subject?.gradeGroup.academicYear.gradeScaleConfigs.length) {
      const configs = subject.gradeGroup.academicYear.gradeScaleConfigs;
      const match = configs.find((c) => finalScore >= Number(c.minScore) && finalScore <= Number(c.maxScore));
      if (match) scale = match.scale;
    }

    const periodEnum = `P${periodNumber}` as 'P1' | 'P2' | 'P3' | 'P4';

    return this.prisma.gradeRecord.upsert({
      where: { studentId_subjectId_period: { studentId, subjectId, period: periodEnum } },
      create: { studentId, subjectId, period: periodEnum, score: finalScore, scale },
      update: { score: finalScore, scale },
    });
  }

  private defaultScale(score: number): 'SUPERIOR' | 'ALTO' | 'BASICO' | 'BAJO' {
    if (score >= 4.6) return 'SUPERIOR';
    if (score >= 4.0) return 'ALTO';
    if (score >= 3.0) return 'BASICO';
    return 'BAJO';
  }

  // ─── RF-CIERRE-01: Validación previa al cierre ──────────────────────────────

  async validatePeriodClose(academicYearId: string, periodNumber: number) {
    const gradeGroups = await this.prisma.gradeGroup.findMany({
      where: { academicYearId },
      include: {
        subjects: {
          include: {
            teacher: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
            achievements: {
              where: { periodNumber },
              include: { activities: { include: { _count: { select: { scores: true } } } } },
            },
            gradeGroup: { include: { students: true } },
          },
        },
      },
    });

    const issues: any[] = [];

    for (const group of gradeGroups) {
      const studentCount = group.subjects[0]?.gradeGroup.students.length ?? 0;
      for (const subject of group.subjects) {
        for (const ach of subject.achievements) {
          for (const act of ach.activities) {
            if (act._count.scores < studentCount) {
              issues.push({
                groupName: group.name,
                subjectName: subject.name,
                teacherName: `${subject.teacher.user.firstName} ${subject.teacher.user.lastName}`,
                teacherEmail: subject.teacher.user.email,
                achievementName: ach.name,
                activityName: act.name,
                missing: studentCount - act._count.scores,
              });
            }
          }
        }
      }
    }

    return {
      canClose: issues.length === 0,
      totalIssues: issues.length,
      issues,
    };
  }
}
