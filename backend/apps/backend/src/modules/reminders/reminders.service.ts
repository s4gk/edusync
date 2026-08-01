import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RemindersService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.reminder.findMany({
      where: { userId },
      orderBy: [{ done: 'asc' }, { createdAt: 'desc' }],
    });
  }

  create(userId: string, text: string) {
    return this.prisma.reminder.create({ data: { userId, text } });
  }

  async toggle(id: string, userId: string) {
    const r = await this.prisma.reminder.findFirst({ where: { id, userId } });
    if (!r) throw new NotFoundException('Recordatorio no encontrado');
    return this.prisma.reminder.update({ where: { id }, data: { done: !r.done } });
  }

  async remove(id: string, userId: string) {
    await this.prisma.reminder.deleteMany({ where: { id, userId } });
    return { id };
  }
}
