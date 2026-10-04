import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DonationService } from './donation.service';
import { DonationRepository, DonationStockAdjustmentRepository } from '@/domain/repositories';
import { DonationImageService } from './donation-image.service';
import { DonationStockAdjustmentReason, EmployeeRole } from '@/domain/enums';
import { AuditLogService } from '@/modules/audit-log/audit-log.service';
import { TransactionManager } from '@/domain/transaction/transaction-manager';

describe('DonationService', () => {
  let repository: jest.Mocked<DonationRepository>;
  let stockAdjustmentRepository: jest.Mocked<DonationStockAdjustmentRepository>;
  let imageService: jest.Mocked<DonationImageService>;
  let auditLogService: jest.Mocked<AuditLogService>;
  let transactionManager: jest.Mocked<TransactionManager>;
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
      decrementStockIfAvailable: jest.fn(),
      setStock: jest.fn(),
    } as any;

    stockAdjustmentRepository = {
      create: jest.fn(),
      findByDonation: jest.fn(),
    } as any;

    imageService = {
      upload: jest.fn(),
      getSignedImageUrl: jest.fn(),
    } as any;

    transactionManager = {
      run: jest.fn(async (callback: any) => callback({})),
    } as any;

    auditLogService = {
      write: jest.fn(),
    } as any;

    imageService.getSignedImageUrl.mockResolvedValue(null);

    service = new DonationService(
      repository as any,
      stockAdjustmentRepository as any,
      imageService as any,
      transactionManager as any,
      auditLogService as any
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

  it('anexa imagem assinada quando upload é fornecido', async () => {
    imageService.upload.mockResolvedValue({
      image_key: 'key',
      image_bucket: 'bucket',
      image_content_type: 'image/png',
      image_original_name: 'test.png',
    });
    repository.create.mockResolvedValue({
      id: 'd1',
      name: 'Doação',
      category_id: 'c1',
      initial_quantity: 5,
      image_key: 'key',
      image_bucket: 'bucket',
    } as any);
    imageService.getSignedImageUrl.mockResolvedValue('https://signed-url');

    const result = await service.create(
      { initial_quantity: 5, name: 'Doação' } as any,
      { buffer: Buffer.from('img') } as any,
      { id: 'emp-1' } as any
    );

    expect(imageService.upload).toHaveBeenCalled();
    expect(auditLogService.write).toHaveBeenCalledWith(
      expect.objectContaining({
        entityId: 'd1',
      })
    );
    expect(result).toEqual(
      expect.objectContaining({
        image_url: 'https://signed-url',
      })
    );
  });

  it('rejeita desativação por voluntário', async () => {
    repository.findById.mockResolvedValue({ id: 'd1' } as any);

    await expect(
      service.update(
        'd1',
        { active: false },
        undefined,
        { role: EmployeeRole.VOLUNTEER } as any
      )
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('permite atualização válida por admin', async () => {
    repository.findById.mockResolvedValue({ id: 'd1' } as any);
    repository.update.mockResolvedValue({ id: 'd1', name: 'Novo Nome' } as any);

    const result = await service.update(
      'd1',
      { name: 'Novo Nome' },
      undefined,
      { role: EmployeeRole.ADMIN } as any
    );

    expect(repository.update).toHaveBeenCalledWith('d1', {
      name: 'Novo Nome',
    });
    expect(auditLogService.write).toHaveBeenCalledWith(
      expect.objectContaining({
        entityId: 'd1',
      })
    );
    expect(result).toEqual({ id: 'd1', name: 'Novo Nome' });
  });

  it('ajusta estoque com delta negativo e atualiza availability', async () => {
    repository.findById.mockResolvedValue({
      id: 'd1',
      current_quantity: 2,
      category: { id: 'c1' },
    } as any);
    repository.setStock.mockResolvedValue({
      id: 'd1',
      current_quantity: 0,
      available: false,
      category: { id: 'c1' },
    } as any);
    stockAdjustmentRepository.create.mockResolvedValue({
      id: 'a1',
      id_donation: 'd1',
      id_employee: 'e1',
      delta_quantity: -2,
      previous_quantity: 2,
      new_quantity: 0,
      reason: DonationStockAdjustmentReason.SPOILAGE,
      note: null,
      created_at: new Date(),
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

    expect(repository.setStock).toHaveBeenCalledWith('d1', 0, expect.anything());
    expect(stockAdjustmentRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id_donation: 'd1',
        id_employee: 'e1',
        delta_quantity: -2,
        previous_quantity: 2,
        new_quantity: 0,
        reason: DonationStockAdjustmentReason.SPOILAGE,
      }),
      expect.anything()
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
    repository.findById.mockResolvedValue({
      id: 'd1',
      current_quantity: 0,
      category: { id: 'c1' },
    } as any);
    repository.setStock.mockResolvedValue({
      id: 'd1',
      current_quantity: 3,
      available: true,
      category: { id: 'c1' },
    } as any);
    stockAdjustmentRepository.create.mockResolvedValue({
      id: 'a1',
      id_donation: 'd1',
      id_employee: 'e1',
      delta_quantity: 3,
      previous_quantity: 0,
      new_quantity: 3,
      reason: DonationStockAdjustmentReason.INVENTORY_CORRECTION,
      note: 'contagem',
      created_at: new Date(),
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

    expect(repository.setStock).toHaveBeenCalledWith('d1', 3, expect.anything());
    expect(result.donation.current_quantity).toBe(3);
    expect(result.donation.available).toBe(true);
  });

  it('falha ao ajustar estoque para valor negativo', async () => {
    repository.findById.mockResolvedValue({
      id: 'd1',
      current_quantity: 1,
      category: { id: 'c1' },
    } as any);

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

    expect(repository.setStock).not.toHaveBeenCalled();
    expect(stockAdjustmentRepository.create).not.toHaveBeenCalled();
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

    expect(transactionManager.run).not.toHaveBeenCalled();
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

    expect(transactionManager.run).not.toHaveBeenCalled();
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

    expect(transactionManager.run).not.toHaveBeenCalled();
  });

  it('lista histórico de ajuste por doação', async () => {
    repository.findById.mockResolvedValue({ id: 'd1' } as any);
    stockAdjustmentRepository.findByDonation.mockResolvedValue([
      { id: 'a1' } as any,
    ]);

    const result = await service.findStockAdjustments('d1');

    expect(stockAdjustmentRepository.findByDonation).toHaveBeenCalledWith('d1');
    expect(result).toEqual([{ id: 'a1' }]);
  });
});
