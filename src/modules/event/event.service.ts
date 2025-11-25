import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/config/prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { ErrorMessages } from '@/common/helper/error-messages';
import { InstagramValidatorService } from './services/instagram-validator.service';
import { InstagramEmbedService } from './services/instagram-embed.service';

@Injectable()
export class EventService {
  constructor(
    private prisma: PrismaService,
    private instagramValidator: InstagramValidatorService,
    private instagramEmbedService: InstagramEmbedService
  ) {}

  async create(dto: CreateEventDto) {
    const eventData = await this.prepareEventData(dto);
    return this.prisma.event.create({ data: eventData });
  }

  private async prepareEventData(dto: CreateEventDto) {
    if (dto.embedded_instagram) {
      dto.embedded_instagram = await this.instagramValidator.validate(
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
      const urls = this.extractUrls(events);

      if (urls.length === 0) return events;

      const embeds = await this.instagramEmbedService.generateEmbeds(urls);
      return this.mergeEmbedsWithEvents(events, embeds);
    } catch (err) {
      throw err instanceof BadRequestException
        ? err
        : new BadRequestException('Não foi possível obter embeds do Instagram');
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

    if (!events || events.length === 0) {
      throw new NotFoundException(ErrorMessages.EVENT_NOT_FOUND);
    }

    return events;
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
