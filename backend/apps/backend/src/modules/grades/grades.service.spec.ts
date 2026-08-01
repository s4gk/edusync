import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';

import { GradesService } from './grades.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAchievementDto, SaveScoresDto } from './dto/grades.dto';

// ─── Prisma mock ─────────────────────────────────────────────────────────────

const mockPrisma = {
  subject: { findUnique: jest.fn() },
  achievement: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  activity: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  activityScore: { upsert: jest.fn() },
  gradeRecord: { upsert: jest.fn(), findMany: jest.fn() },
  gradeGroup: { findMany: jest.fn() },
  $transaction: jest.fn(),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a subject fixture that has one academic period.
 * @param periodClosed - whether the period is closed
 */
function buildSubjectWithPeriod(periodClosed: boolean, periodNumber = 1) {
  return {
    id: 'subject-1',
    gradeGroup: {
      academicYear: {
        academicPeriods: [{ periodNumber, isClosed: periodClosed }],
      },
    },
  };
}

function buildAchievement(overrides: Partial<Record<string, any>> = {}) {
  return {
    id: 'ach-1',
    subjectId: 'subject-1',
    periodNumber: 1,
    name: 'Logro 1',
    weightPercent: 30,
    activities: [],
    ...overrides,
  };
}

function buildActivity(overrides: Partial<Record<string, any>> = {}) {
  return {
    id: 'act-1',
    achievementId: 'ach-1',
    name: 'Actividad 1',
    weightPercent: 50,
    maxScore: 5,
    scores: [],
    achievement: buildAchievement(),
    ...overrides,
  };
}

describe('GradesService', () => {
  let service: GradesService;
  let prisma: typeof mockPrisma;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GradesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<GradesService>(GradesService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── createAchievement() ─────────────────────────────────────────────────

  describe('createAchievement()', () => {
    const dto: CreateAchievementDto = {
      subjectId: 'subject-1',
      periodNumber: 1,
      name: 'Pensamiento numérico',
      weightPercent: 40,
    };

    it('should throw ForbiddenException when the period is closed', async () => {
      mockPrisma.subject.findUnique.mockResolvedValue(buildSubjectWithPeriod(true));

      await expect(service.createAchievement(dto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when total weight of achievements exceeds 100%', async () => {
      // Period is open
      mockPrisma.subject.findUnique.mockResolvedValue(buildSubjectWithPeriod(false));
      // Existing achievements already occupy 70%
      mockPrisma.achievement.findMany.mockResolvedValue([
        { weightPercent: 70 },
      ]);
      // dto.weightPercent = 40 → total = 110 → exceeds 100

      await expect(service.createAchievement(dto)).rejects.toThrow(BadRequestException);
    });

    it('should create and return achievement when data is valid', async () => {
      mockPrisma.subject.findUnique.mockResolvedValue(buildSubjectWithPeriod(false));
      // Existing weight = 50, dto.weightPercent = 40 → total = 90 ≤ 100
      mockPrisma.achievement.findMany.mockResolvedValue([{ weightPercent: 50 }]);
      const created = buildAchievement({ name: dto.name, weightPercent: dto.weightPercent });
      mockPrisma.achievement.create.mockResolvedValue(created);

      const result = await service.createAchievement({ ...dto, weightPercent: 40 });

      expect(mockPrisma.achievement.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ subjectId: 'subject-1' }) }),
      );
      expect(result).toEqual(created);
    });

    it('should allow creating achievement when no existing achievements exist (total = weightPercent)', async () => {
      mockPrisma.subject.findUnique.mockResolvedValue(buildSubjectWithPeriod(false));
      mockPrisma.achievement.findMany.mockResolvedValue([]);
      const created = buildAchievement({ weightPercent: 100 });
      mockPrisma.achievement.create.mockResolvedValue(created);

      const result = await service.createAchievement({ ...dto, weightPercent: 100 });

      expect(result).toEqual(created);
    });
  });

  // ─── saveScores() ────────────────────────────────────────────────────────

  describe('saveScores()', () => {
    const dto: SaveScoresDto = {
      activityId: 'act-1',
      scores: [{ studentId: 'student-1', score: 4.5 }],
    };

    it('should throw NotFoundException when activity does not exist', async () => {
      mockPrisma.activity.findUnique.mockResolvedValue(null);

      await expect(service.saveScores(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when the period is closed', async () => {
      const activity = buildActivity({
        achievement: buildAchievement({ subjectId: 'subject-1', periodNumber: 1 }),
      });
      mockPrisma.activity.findUnique.mockResolvedValue(activity);
      // Period closed
      mockPrisma.subject.findUnique.mockResolvedValue(buildSubjectWithPeriod(true));

      await expect(service.saveScores(dto)).rejects.toThrow(ForbiddenException);
    });

    it('should upsert scores and return saved count when period is open', async () => {
      const activity = buildActivity({
        achievement: buildAchievement({ subjectId: 'subject-1', periodNumber: 1 }),
      });
      mockPrisma.activity.findUnique.mockResolvedValue(activity);
      mockPrisma.subject.findUnique.mockResolvedValue(buildSubjectWithPeriod(false));
      mockPrisma.$transaction.mockResolvedValue([]);

      // computeAndSaveGradeRecord internals
      mockPrisma.achievement.findMany.mockResolvedValue([]);

      const result = await service.saveScores(dto);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual({ saved: 1 });
    });
  });

  // ─── deleteActivity() ────────────────────────────────────────────────────

  describe('deleteActivity()', () => {
    it('should throw NotFoundException when activity does not exist', async () => {
      mockPrisma.activity.findUnique.mockResolvedValue(null);

      await expect(service.deleteActivity('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should delete and return activity when period is open', async () => {
      const activity = buildActivity();
      mockPrisma.activity.findUnique.mockResolvedValue(activity);
      mockPrisma.subject.findUnique.mockResolvedValue(buildSubjectWithPeriod(false));
      mockPrisma.activity.delete.mockResolvedValue(activity);

      const result = await service.deleteActivity('act-1');

      expect(mockPrisma.activity.delete).toHaveBeenCalledWith({ where: { id: 'act-1' } });
      expect(result).toEqual(activity);
    });

    it('should throw ForbiddenException when trying to delete an activity in a closed period', async () => {
      const activity = buildActivity();
      mockPrisma.activity.findUnique.mockResolvedValue(activity);
      mockPrisma.subject.findUnique.mockResolvedValue(buildSubjectWithPeriod(true));

      await expect(service.deleteActivity('act-1')).rejects.toThrow(ForbiddenException);
      expect(mockPrisma.activity.delete).not.toHaveBeenCalled();
    });
  });

  // ─── getMatrix() ─────────────────────────────────────────────────────────

  describe('getMatrix()', () => {
    it('should return structure with achievements and students mapped by scores', async () => {
      const student = {
        id: 'student-1',
        user: { firstName: 'Ana', lastName: 'García' },
      };

      const achievements = [
        {
          id: 'ach-1',
          name: 'Logro 1',
          weightPercent: 60,
          createdAt: new Date(),
          activities: [
            {
              id: 'act-1',
              name: 'Taller #1',
              weightPercent: 100,
              maxScore: 5,
              scores: [{ studentId: 'student-1', score: 4.0, student: { user: student.user } }],
            },
          ],
        },
      ];

      const subjectWithStudents = {
        id: 'subject-1',
        gradeGroup: { students: [student] },
      };

      mockPrisma.achievement.findMany.mockResolvedValue(achievements);
      mockPrisma.subject.findUnique.mockResolvedValue(subjectWithStudents);

      const result = await service.getMatrix('subject-1', 1);

      expect(result).toHaveProperty('subjectId', 'subject-1');
      expect(result).toHaveProperty('periodNumber', 1);
      expect(result.achievements).toHaveLength(1);
      expect(result.achievements[0].activities[0].scores).toHaveLength(1);
      expect(result.achievements[0].activities[0].scores[0]).toMatchObject({
        studentId: 'student-1',
        name: 'Ana García',
        score: 4.0,
      });
    });

    it('should return null score when student has no score for an activity', async () => {
      const student = { id: 'student-1', user: { firstName: 'Luis', lastName: 'Pérez' } };
      const achievements = [
        {
          id: 'ach-1',
          name: 'Logro 1',
          weightPercent: 100,
          createdAt: new Date(),
          activities: [
            {
              id: 'act-1',
              name: 'Examen',
              weightPercent: 100,
              maxScore: 5,
              scores: [], // no scores at all
            },
          ],
        },
      ];

      mockPrisma.achievement.findMany.mockResolvedValue(achievements);
      mockPrisma.subject.findUnique.mockResolvedValue({
        id: 'subject-1',
        gradeGroup: { students: [student] },
      });

      const result = await service.getMatrix('subject-1', 1);

      expect(result.achievements[0].activities[0].scores[0].score).toBeNull();
    });
  });
});
