import { Injectable } from '@nestjs/common';
import { Event } from '@/domain/entities';
import {
  CreateEventData,
  EventRepository,
  UpdateEventData,
} from '@/domain/repositories';
import { PrismaService } from '../prisma.service';
import { toDomain } from '../prisma-transaction-manager';

@Injectable()
export class EventPrismaRepository extends EventRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(data: CreateEventData): Promise<Event> {
    return toDomain(await this.prisma.event.create({ data }));
  }

  async findAll(): Promise<Event[]> {
    return toDomain(await this.prisma.event.findMany());
  }

  async findAllActives(): Promise<Event[]> {
    return toDomain(await this.prisma.event.findMany({ where: { active: true } }));
  }

  async findById(id: string): Promise<Event | null> {
    return toDomain(await this.prisma.event.findUnique({ where: { id } }));
  }

  async update(id: string, data: UpdateEventData): Promise<Event> {
    return toDomain(await this.prisma.event.update({ where: { id }, data }));
  }

  async findUpcoming(from: Date, limit?: number): Promise<Event[]> {
    return toDomain(
      await this.prisma.event.findMany({
        where: { date: { gte: from }, active: true },
        orderBy: { date: 'asc' },
        ...(limit ? { take: limit } : {}),
      })
    );
  }

  async findPast(before: Date, limit: number): Promise<Event[]> {
    return toDomain(
      await this.prisma.event.findMany({
        where: { date: { lt: before }, active: true },
        orderBy: { date: 'desc' },
        take: limit,
      })
    );
  }

  async findRecentWithInstagram(limit: number): Promise<Event[]> {
    return toDomain(
      await this.prisma.event.findMany({
        where: {
          active: true,
          embedded_instagram: { not: null, notIn: [''] },
        },
        orderBy: { date: 'desc' },
        take: limit,
      })
    );
  }

  async findPaginated(skip: number, take: number): Promise<Event[]> {
    return toDomain(
      await this.prisma.event.findMany({
        skip,
        take,
        orderBy: { date: 'desc' },
        where: { active: true },
      })
    );
  }

  countActives(): Promise<number> {
    return this.prisma.event.count({ where: { active: true } });
  }
}
