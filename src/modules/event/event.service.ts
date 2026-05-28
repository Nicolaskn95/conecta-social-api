import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/config/prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventBasicDto } from './dto/update-event-basic.dto';
import { ErrorMessages } from '@/common/helper/error-messages';
import { InstagramContentService } from './services/instagram-content.service';
import {
  AuditActionType,
  AuditEntityType,
  Employee,
  EmployeeRole,
  EventStatus,
} from '@prisma/client';
import { AuditLogService } from '@/modules/audit-log/audit-log.service';

@Injectable()
export class EventService {
  constructor(
    private prisma: PrismaService,
    private instagramContentService: InstagramContentService,
    private readonly auditLogService: AuditLogService
  ) {}

  async create(dto: CreateEventDto, actor?: Employee) {
    const eventData = await this.prepareEventData(dto);
    const event = await this.prisma.event.create({ data: eventData });

    await this.auditLogService.write({
      entityType: AuditEntityType.EVENT,
      entityId: event.id,
      actionType: AuditActionType.CREATE,
      actor,
      message: 'Evento criado.',
      metadata: {
        name: event.name,
        date: new Date(event.date).toISOString(),
        status: event.status,
      },
    });

    return event;
  }

  private async prepareEventData(dto: CreateEventDto) {
    if (dto.embedded_instagram) {
      dto.embedded_instagram = this.instagramContentService.validateUrl(
        dto.embedded_instagram
      );
    }

    return {
      ...dto,
      date: new Date(dto.date),
      active: dto.active ?? true,
    };
  }

  findAll() {
    return this.prisma.event.findMany();
  }

  findAllActives() {
    return this.prisma.event.findMany({
      where: { active: true },
    });
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });

    if (!event) {
      throw new NotFoundException(ErrorMessages.EVENT_NOT_FOUND);
    }

    return event;
  }

  async update(id: string, dto: UpdateEventBasicDto, actor?: Employee) {
    await this.findOne(id);

    const event = await this.prisma.event.update({
      where: { id },
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : undefined,
      },
    });

    await this.auditLogService.write({
      entityType: AuditEntityType.EVENT,
      entityId: id,
      actionType: AuditActionType.UPDATE,
      actor,
      message: 'Evento atualizado.',
      metadata: {
        updated_fields: Object.keys(dto),
      },
    });

    return event;
  }

  async updateStatus(id: string, status: EventStatus, actor: Employee) {
    await this.findOne(id);

    if (actor.role === EmployeeRole.VOLUNTEER && status !== EventStatus.COMPLETED) {
      throw new ForbiddenException(
        'Voluntários só podem marcar eventos como concluídos.'
      );
    }

    const event = await this.prisma.event.update({
      where: { id },
      data: { status },
    });

    await this.auditLogService.write({
      entityType: AuditEntityType.EVENT,
      entityId: id,
      actionType: AuditActionType.UPDATE_STATUS,
      actor,
      message: 'Status do evento atualizado.',
      metadata: {
        status,
      },
    });

    return event;
  }

  async updateAttendance(id: string, attendance: number, actor?: Employee) {
    await this.findOne(id);

    const event = await this.prisma.event.update({
      where: { id },
      data: { attendance },
    });

    await this.auditLogService.write({
      entityType: AuditEntityType.EVENT,
      entityId: id,
      actionType: AuditActionType.UPDATE_ATTENDANCE,
      actor,
      message: 'Presença do evento atualizada.',
      metadata: {
        attendance,
      },
    });

    return event;
  }

  async updateInstagram(
    id: string,
    embeddedInstagram?: string,
    actor?: Employee
  ) {
    await this.findOne(id);

    const normalizedInstagram = embeddedInstagram
      ? this.instagramContentService.validateUrl(embeddedInstagram)
      : null;

    const event = await this.prisma.event.update({
      where: { id },
      data: { embedded_instagram: normalizedInstagram },
    });

    await this.auditLogService.write({
      entityType: AuditEntityType.EVENT,
      entityId: id,
      actionType: AuditActionType.UPDATE_INSTAGRAM,
      actor,
      message: 'Post do Instagram do evento atualizado.',
      metadata: {
        embedded_instagram: normalizedInstagram,
      },
    });

    return event;
  }

  async remove(id: string, actor?: Employee) {
    await this.findOne(id);

    const event = await this.prisma.event.update({
      where: { id },
      data: { active: false },
    });

    await this.auditLogService.write({
      entityType: AuditEntityType.EVENT,
      entityId: id,
      actionType: AuditActionType.SOFT_DELETE,
      actor,
      message: 'Evento desativado.',
    });

    return event;
  }

  async getUpcomingEvents(limit?: number) {
    const today = new Date();
    const take = limit && limit > 0 ? limit : undefined;
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
      ...(take ? { take } : {}),
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
    try {
      const events = await this.fetchRecentWithInstagramLinks(limit);
      if (!events.length) return [];

      const urls = this.extractUrls(events);

      if (urls.length === 0) return events;

      const embeds = this.instagramContentService.generateEmbeds(urls);
      return this.mergeEmbedsWithEvents(events, embeds);
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      if (err instanceof NotFoundException) return [];
      throw new BadRequestException(
        'Não foi possível obter embeds do Instagram'
      );
    }
  }

  private async fetchRecentWithInstagramLinks(limit: number) {
    const events = await this.prisma.event.findMany({
      where: {
        active: true,
        embedded_instagram: {
          not: null,
          notIn: [''],
        },
      },
      orderBy: { date: 'desc' },
      take: limit,
    });

    return events ?? [];
  }

  private extractUrls(events: any[]): string[] {
    return events
      .map((e) =>
        typeof e.embedded_instagram === 'string' ? e.embedded_instagram : null
      )
      .filter((u): u is string => !!u);
  }

  private mergeEmbedsWithEvents(events: any[], embeds: string[]) {
    return events.map((event, idx) => {
      const embedHtml = embeds[idx] ?? event.embedded_instagram;
      return {
        ...event,
        embedded_instagram: embedHtml,
      };
    });
  }

  async findAllPaginated(page = 1, size = 10) {
    const skip = (page - 1) * size;

    try {
      const [events, total] = await Promise.all([
        this.prisma.event.findMany({
          skip,
          take: size,
          orderBy: { date: 'desc' },
          where: { active: true },
        }),
        this.prisma.event.count({ where: { active: true } }),
      ]);

      const totalPages = Math.ceil(total / size);
      const isLastPage = page >= totalPages;

      const response = {
        page,
        next_page: isLastPage ? page : page + 1,
        is_last_page: isLastPage,
        previous_page: page > 1 ? page - 1 : 1,
        total_pages: totalPages,
        list: events,
      };

      return response;
    } catch (error) {
      throw error;
    }
  }
}
