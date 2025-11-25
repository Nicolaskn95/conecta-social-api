import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DonationService } from './donation.service';
import { DonationRepository } from '../repositories/donation.repository';

describe('DonationService', () => {
  let repository: jest.Mocked<DonationRepository>;
  let service: DonationService;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findAllActives: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findPaginated: jest.fn(),
      countActives: jest.fn(),
    } as any;

    service = new DonationService(repository as any);
  });

  it('rejeita criação com quantidade inicial <= 0', async () => {
    await expect(
      service.create({ initial_quantity: 0 } as any)
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lança NotFound quando doação não existe', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(service.findById('missing')).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('retorna paginação correta', async () => {
    repository.findPaginated.mockResolvedValue([{ id: 'd1' } as any]);
    repository.countActives.mockResolvedValue(3);

    const result = await service.findAllPaginated(1, 2);

    expect(repository.findPaginated).toHaveBeenCalledWith(0, 2);
    expect(result).toEqual(
      expect.objectContaining({
        page: 1,
        next_page: 2,
        previous_page: 1,
        total_pages: 2,
        is_last_page: false,
        list: [{ id: 'd1' }],
      })
    );
  });

  it('faz soft delete após validar existência', async () => {
    repository.findById.mockResolvedValue({ id: 'd1' } as any);
    repository.delete.mockResolvedValue(undefined as any);

    await service.delete('d1');

    expect(repository.findById).toHaveBeenCalledWith('d1');
    expect(repository.delete).toHaveBeenCalledWith('d1');
  });
});
