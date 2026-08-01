import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { Role } from '@school/shared';

const SAFE_SELECT = {
  id: true,
  email: true,
  role: true,
  status: true,
  firstName: true,
  lastName: true,
  phone: true,
  avatarUrl: true,
  profile: true,
  isActive: true,
  mustChangePassword: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  userRoles: { select: { role: true } },
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryUserDto) {
    const { search, role, roles, status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (roles?.length) where.role = { in: roles };
    else if (role) where.role = role;
    if (status) where.status = status;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({ where, select: SAFE_SELECT, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.user.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { ...SAFE_SELECT, documents: true },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async create(dto: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('El correo ya está registrado');

    const rawPassword = dto.password ?? this.generatePassword();
    const passwordHash = await bcrypt.hash(rawPassword, 12);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          role: dto.role,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          avatarUrl: dto.avatarUrl,
          profile: (dto.profile as any) ?? undefined,
          mustChangePassword: dto.mustChangePassword ?? true,
          userRoles: dto.additionalRoles?.length
            ? { create: dto.additionalRoles.map((r) => ({ role: r })) }
            : undefined,
          documents: dto.documents?.length
            ? {
                create: dto.documents.map((d) => ({
                  category: d.category,
                  name: d.name,
                  fileUrl: d.fileUrl,
                  mimeType: d.mimeType,
                  size: d.size,
                })),
              }
            : undefined,
        },
        select: SAFE_SELECT,
      });

      // Un docente necesita su perfil Teacher para poder recibir materias y
      // que su vista quede acotada a lo suyo. Lo creamos junto con la cuenta.
      if (dto.role === Role.TEACHER) {
        await tx.teacher.create({ data: { userId: created.id, speciality: dto.speciality } });
      }

      return created;
    });

    return { user, temporaryPassword: dto.password ? undefined : rawPassword };
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    const data: any = {};
    if (dto.email) data.email = dto.email;
    if (dto.firstName) data.firstName = dto.firstName;
    if (dto.lastName) data.lastName = dto.lastName;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.avatarUrl !== undefined) data.avatarUrl = dto.avatarUrl || null;
    if (dto.profile !== undefined) data.profile = (dto.profile as any) ?? undefined;
    if (dto.status) data.status = dto.status;
    if (dto.role) data.role = dto.role;
    if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, 12);

    if (dto.additionalRoles !== undefined) {
      await this.prisma.userRole.deleteMany({ where: { userId: id } });
      if (dto.additionalRoles.length) {
        await this.prisma.userRole.createMany({
          data: dto.additionalRoles.map((r) => ({ userId: id, role: r })),
          skipDuplicates: true,
        });
      }
    }

    // Campos del perfil específico del rol (se actualizan si existe el registro).
    if (dto.speciality !== undefined) {
      await this.prisma.teacher.updateMany({ where: { userId: id }, data: { speciality: dto.speciality || null } });
    }
    if (dto.relation !== undefined && dto.relation) {
      await this.prisma.guardian.updateMany({ where: { userId: id }, data: { relation: dto.relation } });
    }

    return this.prisma.user.update({ where: { id }, data, select: SAFE_SELECT });
  }

  async softDelete(id: string) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
      select: { id: true, deletedAt: true },
    });
  }

  async addRole(userId: string, role: Role) {
    await this.findOne(userId);
    try {
      await this.prisma.userRole.create({ data: { userId, role } });
    } catch {
      throw new ConflictException('El usuario ya tiene ese rol');
    }
    return this.findOne(userId);
  }

  async removeRole(userId: string, role: Role) {
    await this.findOne(userId);
    const deleted = await this.prisma.userRole.deleteMany({ where: { userId, role } });
    if (!deleted.count) throw new NotFoundException('El usuario no tiene ese rol');
    return this.findOne(userId);
  }

  async resetPassword(id: string) {
    await this.findOne(id);
    const newPassword = this.generatePassword();
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash, mustChangePassword: true },
    });
    return { temporaryPassword: newPassword };
  }

  private generatePassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!';
    return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }
}
