import { NotFoundException } from '@nestjs/common';
import { EventService } from './event.service';
import { PrismaService } from '@/config/prisma/prisma.service';
import { InstagramContentService } from './services/instagram-content.service';

describe('EventService', () => {
  let prisma: {
    event: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
    };
  };
  let instagramContentService: {
    validateUrl: jest.Mock;
    generateEmbeds: jest.Mock;
  };
  let service: EventService;

  beforeEach(() => {
    prisma = {
      event: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
    };
    instagramContentService = {
      validateUrl: jest.fn(),
      generateEmbeds: jest.fn(),
    };

    service = new EventService(
      prisma as unknown as PrismaService,
      instagramContentService as unknown as InstagramContentService
    );
  });

  it('cria evento validando embed e convertendo data', async () => {
    const dto = {
      name: 'Evento',
      date: '2025-12-24T18:00:00Z',
      status: 'SCHEDULED',
      cep: '01001-000',
      street: 'Rua',
      neighborhood: 'Centro',
      number: '123',
      city: 'São Paulo',
      state: 'SP',
      embedded_instagram: 'https://insta/abc',
    };

    instagramContentService.validateUrl.mockReturnValue(
      'https://insta/abc-normalized'
    );
    prisma.event.create.mockResolvedValue({ id: '1', ...dto });

    const result = await service.create(dto as any);

    expect(instagramContentService.validateUrl).toHaveBeenCalledWith(
      'https://insta/abc'
    );
    expect(prisma.event.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        embedded_instagram: 'https://insta/abc-normalized',
        active: true,
        date: expect.any(Date),
      }),
    });
    expect(result).toBeDefined();
  });

  it('lança NotFound ao buscar evento inexistente', async () => {
    prisma.event.findUnique.mockResolvedValue(null);
    await expect(service.findOne('missing-id')).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('retorna embeds do instagram mesclados em eventos recentes', async () => {
    prisma.event.findMany.mockResolvedValue([
      { id: '1', embedded_instagram: 'url1', active: true },
      { id: '2', embedded_instagram: 'url2', active: true },
    ]);
    instagramContentService.generateEmbeds.mockReturnValue([
      '<embed1>',
      '<embed2>',
    ]);

    const events = await service.getRecentEventsWithInstagramEmbeds(2);

    expect(instagramContentService.generateEmbeds).toHaveBeenCalledWith([
      'url1',
      'url2',
    ]);
    expect(events[0].embedded_instagram).toBe('<embed1>');
    expect(events[1].embedded_instagram).toBe('<embed2>');
  });

  it('lança NotFound quando não há próximos eventos', async () => {
    prisma.event.findMany.mockResolvedValue([]);
    await expect(service.getUpcomingEvents()).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('retorna estrutura paginada em findAllPaginated', async () => {
    prisma.event.findMany.mockResolvedValue([{ id: '1' }]);
    prisma.event.count.mockResolvedValue(5);

    const result = await service.findAllPaginated(2, 2);

    expect(prisma.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 2, take: 2 })
    );
    expect(result).toEqual(
      expect.objectContaining({
        page: 2,
        next_page: 3,
        previous_page: 1,
        total_pages: 3,
        is_last_page: false,
        list: [{ id: '1' }],
      })
    );
  });
});
