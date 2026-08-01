import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAnnouncementDto, AnnouncementTarget, QueryAnnouncementDto } from './dto/announcement.dto';

@Injectable()
export class CommunicationsService {
  constructor(private readonly prisma: PrismaService) {}

  // RF-COM-01/02: Crear aviso con segmentación
  async createAnnouncement(dto: CreateAnnouncementDto, authorId: string) {
    if (dto.target === AnnouncementTarget.GRADE_LEVEL && dto.gradeLevel === undefined) {
      throw new BadRequestException('gradeLevel es requerido para target=GRADE_LEVEL');
    }
    if (dto.target === AnnouncementTarget.GRADE_GROUP && !dto.gradeGroupId) {
      throw new BadRequestException('gradeGroupId es requerido para target=GRADE_GROUP');
    }
    if (dto.target === AnnouncementTarget.STUDENT && !dto.studentId) {
      throw new BadRequestException('studentId es requerido para target=STUDENT');
    }

    return this.prisma.announcement.create({
      data: { ...dto, authorId },
      include: { author: { select: { firstName: true, lastName: true } } },
    });
  }

  async findAnnouncements(query: QueryAnnouncementDto) {
    const { target, gradeGroupId, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const where: any = { isPublished: true };
    if (target) where.target = target;
    if (gradeGroupId) where.gradeGroupId = gradeGroupId;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.announcement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { publishedAt: 'desc' },
        include: { author: { select: { firstName: true, lastName: true } } },
      }),
      this.prisma.announcement.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  // RF-COM-03/04: Publicar y notificar en-app
  async publish(id: string) {
    const announcement = await this.prisma.announcement.findUnique({ where: { id } });
    if (!announcement) throw new NotFoundException('Aviso no encontrado');
    if (announcement.isPublished) throw new BadRequestException('El aviso ya está publicado');

    const published = await this.prisma.announcement.update({
      where: { id },
      data: { isPublished: true, publishedAt: new Date() },
    });

    // RF-COM-04: crear notificaciones in-app según segmentación
    await this.fanoutNotifications(published);

    return published;
  }

  private async fanoutNotifications(announcement: any) {
    let userIds: string[] = [];

    switch (announcement.target) {
      case AnnouncementTarget.ALL: {
        const users = await this.prisma.user.findMany({
          where: { isActive: true, deletedAt: null },
          select: { id: true },
        });
        userIds = users.map((u) => u.id);
        break;
      }
      case AnnouncementTarget.GRADE_LEVEL: {
        const students = await this.prisma.student.findMany({
          where: { gradeGroup: { gradeLevel: announcement.gradeLevel } },
          include: {
            user: { select: { id: true } },
            guardians: { include: { guardian: { select: { userId: true } } } },
          },
        });
        for (const s of students) {
          userIds.push(s.user.id);
          s.guardians.forEach((g) => userIds.push(g.guardian.userId));
        }
        break;
      }
      case AnnouncementTarget.GRADE_GROUP: {
        const students = await this.prisma.student.findMany({
          where: { gradeGroupId: announcement.gradeGroupId },
          include: {
            user: { select: { id: true } },
            guardians: { include: { guardian: { select: { userId: true } } } },
          },
        });
        for (const s of students) {
          userIds.push(s.user.id);
          s.guardians.forEach((g) => userIds.push(g.guardian.userId));
        }
        break;
      }
      case AnnouncementTarget.STUDENT: {
        const student = await this.prisma.student.findUnique({
          where: { id: announcement.studentId },
          include: {
            user: { select: { id: true } },
            guardians: { include: { guardian: { select: { userId: true } } } },
          },
        });
        if (student) {
          userIds.push(student.user.id);
          student.guardians.forEach((g) => userIds.push(g.guardian.userId));
        }
        break;
      }
    }

    const unique = [...new Set(userIds)];
    if (unique.length) {
      await this.prisma.notification.createMany({
        data: unique.map((userId) => ({
          userId,
          title: `📢 ${announcement.title}`,
          body: announcement.body.slice(0, 200),
        })),
        skipDuplicates: true,
      });
    }
  }

  async deleteAnnouncement(id: string) {
    const a = await this.prisma.announcement.findUnique({ where: { id } });
    if (!a) throw new NotFoundException('Aviso no encontrado');
    return this.prisma.announcement.delete({ where: { id } });
  }
}
