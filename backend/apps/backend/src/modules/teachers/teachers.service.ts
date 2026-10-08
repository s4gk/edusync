import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// Listado: liviano (sin perfil/documentos).
const LIST_INCLUDE = {
  user: {
    select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatarUrl: true, status: true },
  },
  subjects: {
    select: { id: true, name: true, gradeGroup: { select: { id: true, name: true } } },
  },
};

// Ficha: completo (perfil, documentos, horario, carga y dirección de grupo).
const DETAIL_INCLUDE = {
  user: {
    select: {
      id: true, firstName: true, lastName: true, email: true, phone: true,
      avatarUrl: true, status: true, profile: true, documents: true,
    },
  },
  subjects: {
    select: {
      id: true,
      name: true,
      hoursPerWeek: true,
      gradeGroup: { select: { id: true, name: true, gradeLevel: true, _count: { select: { students: true } } } },
      scheduleSlots: { select: { id: true, dayOfWeek: true, block: true, room: true } },
    },
  },
  directedGroups: { select: { id: true, name: true, gradeLevel: true } },
};

@Injectable()
export class TeachersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { search?: string; status?: string; page?: number; limit?: number }) {
    const { search, status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const userWhere: any = { deletedAt: null };
    if (status) userWhere.status = status;
    if (search) {
      userWhere.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    const where = { user: userWhere };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.teacher.findMany({ where, include: LIST_INCLUDE, skip, take: limit, orderBy: { user: { lastName: 'asc' } } }),
      this.prisma.teacher.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id }, include: DETAIL_INCLUDE });
    if (!teacher) throw new NotFoundException('Docente no encontrado');
    return teacher;
  }
}
