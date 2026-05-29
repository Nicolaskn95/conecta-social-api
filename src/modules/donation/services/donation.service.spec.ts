import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DonationService } from './donation.service';
import { DonationRepository } from '../repositories/donation.repository';
import { DonationImageService } from './donation-image.service';
import { DonationStockAdjustmentReason, EmployeeRole } from '@prisma/client';

describe('DonationService', () => {
  let repository: jest.Mocked<DonationRepository>;
  let imageService: jest.Mocked<DonationImageService>;
  let prisma: any;
  let tx: {
    donation: {
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    donationStockAdjustment: {
      create: jest.Mock;
    };
  };
  let service: DonationService;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findAllActives: jest.fn(),
      findAllWithStock: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findPaginated: jest.fn(),
      countActives: jest.fn(),
    } as any;

    imageService = {
      upload: jest.fn(),
      getSignedImageUrl: jest.fn(),
    } as any;

    tx = {
      donation: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      donationStockAdjustment: {
        create: jest.fn(),
      },
    };

    prisma = {
      $transaction: jest.fn(async (callback: any) => callback(tx)),
      donationStockAdjustment: {
        findMany: jest.fn(),
      },
    } as any;

    imageService.getSignedImageUrl.mockResolvedValue(null);

    service = new DonationService(
      repository as any,
      imageService as any,
      prisma as any
    );
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

  it('retorna image_url assinada quando doação possui imagem', async () => {
    repository.findById.mockResolvedValue({
      id: 'd1',
      image_key: 'donations/image.jpg',
      image_bucket: 'bucket',
    } as any);
    imageService.getSignedImageUrl.mockResolvedValue(
      'https://signed-url.example/image.jpg'
    );

    const result = await service.findById('d1');

    expect(imageService.getSignedImageUrl).toHaveBeenCalledWith(
      expect.objectContaining({ image_key: 'donations/image.jpg' })
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: 'd1',
        image_url: 'https://signed-url.example/image.jpg',
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

  it('bloqueia voluntário ao enviar active na atualização', async () => {
    repository.findById.mockResolvedValue({ id: 'd1' } as any);

    await expect(
      service.update(
        'd1',
        { active: false },
        undefined,
        { role: EmployeeRole.VOLUNTEER } as any
      )
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('ajusta estoque com delta negativo e atualiza disponibilidade derivada', async () => {
    tx.donation.findFirst.mockResolvedValue({
      id: 'd1',
      current_quantity: 2,
      category: { id: 'c1' },
    });
    tx.donation.update.mockResolvedValue({
      id: 'd1',
      current_quantity: 0,
      available: false,
      category: { id: 'c1' },
    });
    tx.donationStockAdjustment.create.mockResolvedValue({
      id: 'a1',
      id_donation: 'd1',
      id_employee: 'e1',
      delta_quantity: -2,
      previous_quantity: 2,
      new_quantity: 0,
      reason: DonationStockAdjustmentReason.SPOILAGE,
      note: null,
    });

    const result = await service.adjustStock(
      'd1',
      {
        delta_quantity: -2,
        reason: DonationStockAdjustmentReason.SPOILAGE,
      },
      {
        id: 'e1',
        role: EmployeeRole.MANAGER,
      } as any
    );

    expect(tx.donation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'd1' },
        data: {
          current_quantity: 0,
          available: false,
        },
      })
    );
    expect(tx.donationStockAdjustment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          id_donation: 'd1',
          id_employee: 'e1',
          delta_quantity: -2,
          previous_quantity: 2,
          new_quantity: 0,
          reason: DonationStockAdjustmentReason.SPOILAGE,
        }),
      })
    );
    expect(result).toEqual(
      expect.objectContaining({
        donation: expect.objectContaining({
          current_quantity: 0,
          available: false,
        }),
      })
    );
  });

  it('ajusta estoque com delta positivo', async () => {
    tx.donation.findFirst.mockResolvedValue({
      id: 'd1',
      current_quantity: 0,
      category: { id: 'c1' },
    });
    tx.donation.update.mockResolvedValue({
      id: 'd1',
      current_quantity: 3,
      available: true,
      category: { id: 'c1' },
    });
    tx.donationStockAdjustment.create.mockResolvedValue({
      id: 'a1',
      id_donation: 'd1',
      id_employee: 'e1',
      delta_quantity: 3,
      previous_quantity: 0,
      new_quantity: 3,
      reason: DonationStockAdjustmentReason.INVENTORY_CORRECTION,
      note: 'contagem',
    });

    const result = await service.adjustStock(
      'd1',
      {
        delta_quantity: 3,
        reason: DonationStockAdjustmentReason.INVENTORY_CORRECTION,
        note: 'contagem',
      },
      {
        id: 'e1',
        role: EmployeeRole.ADMIN,
      } as any
    );

    expect(tx.donation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          current_quantity: 3,
          available: true,
        },
      })
    );
    expect(result.donation.current_quantity).toBe(3);
    expect(result.donation.available).toBe(true);
  });

  it('falha ao ajustar estoque para valor negativo', async () => {
    tx.donation.findFirst.mockResolvedValue({
      id: 'd1',
      current_quantity: 1,
      category: { id: 'c1' },
    });

    await expect(
      service.adjustStock(
        'd1',
        {
          delta_quantity: -2,
          reason: DonationStockAdjustmentReason.DAMAGE,
        },
        {
          id: 'e1',
          role: EmployeeRole.ADMIN,
        } as any
      )
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(tx.donation.update).not.toHaveBeenCalled();
    expect(tx.donationStockAdjustment.create).not.toHaveBeenCalled();
  });

  it('falha quando delta é zero', async () => {
    await expect(
      service.adjustStock(
        'd1',
        {
          delta_quantity: 0,
          reason: DonationStockAdjustmentReason.LOSS,
        },
        {
          id: 'e1',
          role: EmployeeRole.ADMIN,
        } as any
      )
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('falha quando motivo OTHER não possui observação', async () => {
    await expect(
      service.adjustStock(
        'd1',
        {
          delta_quantity: -1,
          reason: DonationStockAdjustmentReason.OTHER,
        },
        {
          id: 'e1',
          role: EmployeeRole.ADMIN,
        } as any
      )
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('falha de autorização para voluntário no ajuste de estoque', async () => {
    await expect(
      service.adjustStock(
        'd1',
        {
          delta_quantity: -1,
          reason: DonationStockAdjustmentReason.LOSS,
        },
        {
          id: 'e1',
          role: EmployeeRole.VOLUNTEER,
        } as any
      )
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('lista histórico de ajuste por doação', async () => {
    repository.findById.mockResolvedValue({ id: 'd1' } as any);
    prisma.donationStockAdjustment.findMany.mockResolvedValue([
      { id: 'a1' },
    ] as any);

    const result = await service.findStockAdjustments('d1');

    expect(prisma.donationStockAdjustment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id_donation: 'd1',
        },
      })
    );
    expect(result).toEqual([{ id: 'a1' }]);
  });
});
