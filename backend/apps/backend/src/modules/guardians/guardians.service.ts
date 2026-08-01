import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { Role } from '@school/shared';
import { CreateGuardianDto, QueryGuardianDto } from './dto/guardian.dto';

const GUARDIAN_INCLUDE = {
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      avatarUrl: true,
      status: true,
      profile: true,
      documents: true,
    },
  },
  students: {
    include: {
      student: {
        select: {
          id: true,
          enrollmentCode: true,
          user: { select: { firstName: true, lastName: true } },
          gradeGroup: { select: { name: true } },
        },
      },
    },
  },
};

@Injectable()
export class GuardiansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
  ) {}

  async findAll(query: QueryGuardianDto) {
    const { search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { user: { deletedAt: null } };
    if (search) {
      where.user.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.guardian.findMany({
        where,
        include: GUARDIAN_INCLUDE,
        skip,
        take: limit,
        orderBy: { user: { createdAt: 'desc' } },
      }),
      this.prisma.guardian.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const guardian = await this.prisma.guardian.findUnique({
      where: { id },
      include: GUARDIAN_INCLUDE,
    });
    if (!guardian) throw new NotFoundException('Acudiente no encontrado');
    return guardian;
  }

  async create(dto: CreateGuardianDto) {
    // Reutilizamos la creación de usuario (hash, clave temporal, documentos, foto).
    const { user, temporaryPassword } = await this.users.create({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      role: Role.GUARDIAN,
      password: dto.password,
      avatarUrl: dto.avatarUrl,
      profile: dto.profile,
      documents: dto.documents,
      mustChangePassword: !dto.password,
    });

    const guardian = await this.prisma.guardian.create({
      data: { userId: user.id, relation: dto.relation },
    });

    if (dto.students?.length) {
      await this.prisma.studentGuardian.createMany({
        data: dto.students.map((s) => ({
          guardianId: guardian.id,
          studentId: s.studentId,
          isPrimary: s.isPrimary ?? false,
        })),
        skipDuplicates: true,
      });
    }

    return { guardian: await this.findOne(guardian.id), temporaryPassword };
  }
}
