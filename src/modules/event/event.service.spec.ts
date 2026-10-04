import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventService } from './event.service';
import { InstagramContentService } from './services/instagram-content.service';
import { EmployeeRole, EventStatus } from '@/domain/enums';
import { AuditLogService } from '@/modules/audit-log/audit-log.service';
import { EventRepository } from '@/domain/repositories';

describe('EventService', () => {
  let eventRepository: {
    create: jest.Mock;
    findAll: jest.Mock;
    findAllActives: jest.Mock;
    findById: jest.Mock;
    update: jest.Mock;
    findUpcoming: jest.Mock;
    findPast: jest.Mock;
    findRecentWithInstagram: jest.Mock;
    findPaginated: jest.Mock;
    countActives: jest.Mock;
  };
  let instagramContentService: {
    validateUrl: jest.Mock;
    generateEmbeds: jest.Mock;
  };
  let auditLogService: {
    write: jest.Mock;
  };
  let service: EventService;

  beforeEach(() => {
    eventRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findAllActives: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      findUpcoming: jest.fn(),
      findPast: jest.fn(),
      findRecentWithInstagram: jest.fn(),
      findPaginated: jest.fn(),
      countActives: jest.fn(),
    };
    instagramContentService = {
      validateUrl: jest.fn(),
      generateEmbeds: jest.fn(),
    };
    auditLogService = {
      write: jest.fn(),
    };

    service = new EventService(
      eventRepository as unknown as EventRepository,
      instagramContentService as unknown as InstagramContentService,
      auditLogService as unknown as AuditLogService
    );
  });

  it('cria evento validando embed e convertendo data', async () => {
    const dto = {
      name: 'Evento',
      date: '2025-12-24T18:00:00Z',
      status: EventStatus.SCHEDULED,
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
    eventRepository.create.mockResolvedValue({ id: '1', ...dto });

    const result = await service.create(dto as any);

    expect(instagramContentService.validateUrl).toHaveBeenCalledWith(
      'https://insta/abc'
    );
    expect(eventRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        embedded_instagram: 'https://insta/abc-normalized',
        active: true,
        date: expect.any(Date),
      })
    );
    expect(result).toBeDefined();
  });

  it('lança NotFound ao buscar evento inexistente', async () => {
    eventRepository.findById.mockResolvedValue(null);
    await expect(service.findOne('missing-id')).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('retorna embeds do instagram mesclados em eventos recentes', async () => {
    eventRepository.findRecentWithInstagram.mockResolvedValue([
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
    eventRepository.findUpcoming.mockResolvedValue([]);
    await expect(service.getUpcomingEvents()).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('retorna estrutura paginada em findAllPaginated', async () => {
    eventRepository.findPaginated.mockResolvedValue([{ id: '1' }]);
    eventRepository.countActives.mockResolvedValue(5);

    const result = await service.findAllPaginated(2, 2);

    expect(eventRepository.findPaginated).toHaveBeenCalledWith(2, 2);
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

  it('permite voluntário marcar evento como concluído', async () => {
    eventRepository.findById.mockResolvedValue({ id: 'event-1' });
    eventRepository.update.mockResolvedValue({
      id: 'event-1',
      status: EventStatus.COMPLETED,
    });

    const result = await service.updateStatus(
      'event-1',
      EventStatus.COMPLETED,
      { role: EmployeeRole.VOLUNTEER } as any
    );

    expect(eventRepository.update).toHaveBeenCalledWith('event-1', {
      status: EventStatus.COMPLETED,
    });
    expect(result.status).toBe(EventStatus.COMPLETED);
  });

  it('bloqueia voluntário ao cancelar evento', async () => {
    eventRepository.findById.mockResolvedValue({ id: 'event-1' });

    await expect(
      service.updateStatus('event-1', EventStatus.CANCELED, {
        role: EmployeeRole.VOLUNTEER,
      } as any)
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(eventRepository.update).not.toHaveBeenCalled();
  });

  it('valida link do instagram ao atualizar publicação', async () => {
    eventRepository.findById.mockResolvedValue({ id: 'event-1' });
    instagramContentService.validateUrl.mockReturnValue(
      'https://www.instagram.com/p/abc/'
    );
    eventRepository.update.mockResolvedValue({
      id: 'event-1',
      embedded_instagram: 'https://www.instagram.com/p/abc/',
    });

    await service.updateInstagram('event-1', 'https://instagram.com/p/abc');

    expect(instagramContentService.validateUrl).toHaveBeenCalledWith(
      'https://instagram.com/p/abc'
    );
    expect(eventRepository.update).toHaveBeenCalledWith('event-1', {
      embedded_instagram: 'https://www.instagram.com/p/abc/',
    });
  });
});
