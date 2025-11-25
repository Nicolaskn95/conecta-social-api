import { NotFoundException } from '@nestjs/common';
import { FamilyService } from './family.service';
import { FamilyRepository } from './repositories/family.repository.interface';

describe('FamilyService', () => {
  let repository: jest.Mocked<FamilyRepository>;
  let service: FamilyService;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findAllActives: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      findPaginated: jest.fn(),
      countActives: jest.fn(),
    };

    service = new FamilyService(repository as any);
  });

  it('cria família via repositório', async () => {
    repository.create.mockResolvedValue({ id: 'f1' } as any);
    const dto = { name: 'Família' } as any;
    const result = await service.create(dto);
    expect(repository.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: 'f1' });
  });

  it('lança NotFound quando não encontra família', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('retorna paginação correta', async () => {
    repository.findPaginated.mockResolvedValue([{ id: 'f1' } as any]);
    repository.countActives.mockResolvedValue(4);

    const result = await service.findAllPaginated(2, 2);

    expect(repository.findPaginated).toHaveBeenCalledWith(2, 2);
    expect(result).toEqual(
      expect.objectContaining({
        page: 2,
        next_page: 2,
        previous_page: 1,
        total_pages: 2,
        is_last_page: true,
        list: [{ id: 'f1' }],
      })
    );
  });

  it('faz soft delete após validar existência', async () => {
    repository.findById.mockResolvedValue({ id: 'f1' } as any);
    repository.softDelete.mockResolvedValue({ id: 'f1', active: false } as any);

    const result = await service.remove('f1');

    expect(repository.findById).toHaveBeenCalledWith('f1');
    expect(repository.softDelete).toHaveBeenCalledWith('f1');
    expect(result).toEqual({ id: 'f1', active: false });
  });
});
