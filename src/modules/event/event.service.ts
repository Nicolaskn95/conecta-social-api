import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/config/prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { ErrorMessages } from '@/common/helper/error-messages';

@Injectable()
export class EventService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateEventDto) {
    return this.prisma.event.create({
      data: {
        ...dto,
        date: new Date(dto.date),
        active: dto.active ?? true,
      },
    });
  }

  findAll() {
    return this.prisma.event.findMany();
  }

  findAllActives() {
    return this.prisma.event.findMany({
      where: { active: true },
    });
  }

  findOne(id: string) {
    const event = this.prisma.event.findUnique({ where: { id } });

    if (!event) {
      throw new NotFoundException(ErrorMessages.EVENT_NOT_FOUND);
    }

    return event;
  }

  async update(id: string, dto: UpdateEventDto) {
    await this.findOne(id);

    return this.prisma.event.update({
      where: { id },
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.event.update({
      where: { id },
      data: { active: false },
    });
  }

  async getUpcomingEvents(limit: number) {
    const today = new Date();
    const events = await this.prisma.event.findMany({
      where: {
        date: {
          gte: today,
        },
        active: true,
      },
      orderBy: {
        date: 'asc',
      },
      take: limit,
    });

    if (events.length === 0) {
      throw new NotFoundException(ErrorMessages.EVENT_NOT_FOUND);
    }

    return events;
  }

  async getRecentEvents(limit: number) {
    const today = new Date();
    const events = await this.prisma.event.findMany({
      where: {
        date: {
          lt: today,
        },
        active: true,
      },
      orderBy: {
        date: 'desc',
      },
      take: limit,
    });

    if (events.length === 0) {
      throw new NotFoundException(ErrorMessages.EVENT_NOT_FOUND);
    }

    return events;
  }

  async getRecentEventsWithInstagramEmbeds(limit = 5) {
    const events = await this.prisma.event.findMany({
      where: {
        active: true,
        embedded_instagram: {
          not: null,
          notIn: [''],
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: limit,
    });

    if (events.length === 0) {
      throw new NotFoundException(ErrorMessages.EVENT_NOT_FOUND);
    }

    return events;
  }
}
