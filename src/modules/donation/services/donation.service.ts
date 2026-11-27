import { ConcurrentWriteError, retryConflictingTransaction } from '@/domain/transaction/retry-conflicting-transaction';
import { validItemSpecifications } from '@/domain/item-specifications';
import { ItemTypeRepository } from '@/domain/repositories/item-type.repository';
import { ItemSpecifications } from '@/domain/entities';
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateDonationDto } from '../dtos/create-donation.dto';
import { UpdateDonationDto } from '../dtos/update-donation.dto';
import { CreateDonationStockAdjustmentDto } from '../dtos/create-donation-stock-adjustment.dto';
import {
  DonationImageMetadata,
  DonationImageService,
} from './donation-image.service';
import {
  AuditActionType,
  AuditEntityType,
  DonationStockAdjustmentReason,
  EmployeeRole,
} from '@/domain/enums';
import { Employee } from '@/domain/entities';
import {
  DonationRepository,
  DonationStockAdjustmentRepository,
} from '@/domain/repositories';
import { TransactionManager } from '@/domain/transaction/transaction-manager';
import { AuditLogService } from '@/modules/audit-log/audit-log.service';

type DonationWithImage = {
  image_key?: string | null;
  image_bucket?: string | null;
};

@Injectable()
export class DonationService {
  private readonly logger = new Logger(DonationService.name);

  constructor(
    private readonly donationRepository: DonationRepository,
    private readonly donationStockAdjustmentRepository: DonationStockAdjustmentRepository,
    private readonly donationImageService: DonationImageService,
    private readonly transactionManager: TransactionManager,
    private readonly auditLogService: AuditLogService,
    private readonly itemTypeRepository: ItemTypeRepository
  ) {}

  async create(
    createDonationDto: CreateDonationDto,
    image?: Express.Multer.File,
    actor?: Employee
  ) {
    if (createDonationDto.initial_quantity <= 0) {
      throw new BadRequestException(
        'A quantidade inicial deve ser maior que zero'
      );
    }

    await this.validateItemDetails(createDonationDto);
    const imageMetadata = await this.uploadImageIfPresent(image);
    const donation = await this.donationRepository.create({
      ...createDonationDto,
      ...imageMetadata,
    });

    await this.auditLogService.write({
      entityType: AuditEntityType.DONATION,
      entityId: donation.id,
      actionType: AuditActionType.CREATE,
      actor,
      message: 'Doação criada.',
      metadata: {
        name: donation.name,
        category_id: donation.category_id,
        initial_quantity: donation.initial_quantity,
      },
    });

    return this.withSignedImageUrl(donation);
  }

  async findAll() {
    const donations = await this.donationRepository.findAll();
    return this.withSignedImageUrls(donations);
  }

  async findAllActives() {
    const donations = await this.donationRepository.findAllActives();
    return this.withSignedImageUrls(donations);
  }

  async findAllWithStock() {
    const donations = await this.donationRepository.findAllWithStock();
    return this.withSignedImageUrls(donations);
  }

  async findAllPaginated(page = 1, size = 10) {
    const skip = (page - 1) * size;

    const [donations, total] = await Promise.all([
      this.donationRepository.findPaginated(skip, size),
      this.donationRepository.countActives(),
    ]);

    const totalPages = Math.ceil(total / size);
    const isLastPage = page >= totalPages;

    return {
      page,
      next_page: isLastPage ? page : page + 1,
      is_last_page: isLastPage,
      previous_page: page > 1 ? page - 1 : 1,
      total_pages: totalPages,
      list: await this.withSignedImageUrls(donations),
    };
  }

  async findById(id: string) {
    const donation = await this.getActiveDonationOrThrow(id);
    return this.withSignedImageUrl(donation);
  }

  async update(
    id: string,
    updateDonationDto: UpdateDonationDto,
    image?: Express.Multer.File,
    actor?: Employee
  ) {
    const current = await this.getActiveDonationOrThrow(id);

    if (
      actor?.role === EmployeeRole.VOLUNTEER &&
      updateDonationDto.active !== undefined
    ) {
      throw new ForbiddenException(
        'Voluntários não podem desativar ou reativar doações.'
      );
    }

    if (
      updateDonationDto.category_id !== undefined ||
      updateDonationDto.item_type_id !== undefined ||
      updateDonationDto.specifications !== undefined
    ) {
      await this.validateItemDetails({
        category_id: updateDonationDto.category_id ?? current.category_id,
        item_type_id: updateDonationDto.item_type_id === undefined
          ? current.item_type_id
          : updateDonationDto.item_type_id,
        specifications: updateDonationDto.specifications === undefined
          ? current.specifications
          : updateDonationDto.specifications,
      });
    }

    const imageMetadata = await this.uploadImageIfPresent(image);
    const donation = await this.donationRepository.update(id, {
      ...updateDonationDto,
      ...imageMetadata,
    });

    await this.auditLogService.write({
      entityType: AuditEntityType.DONATION,
      entityId: donation.id,
      actionType: AuditActionType.UPDATE,
      actor,
      message: 'Doação atualizada.',
      metadata: {
        updated_fields: Object.keys(updateDonationDto),
        image_updated: Boolean(image),
      },
    });

    return this.withSignedImageUrl(donation);
  }

  private async validateItemDetails(data: {
    category_id: string;
    item_type_id?: string | null;
    specifications?: ItemSpecifications | null;
  }) {
    const itemType = data.item_type_id
      ? await this.itemTypeRepository.findById(data.item_type_id)
      : null;
    if (data.item_type_id && (!itemType?.active || itemType.category_id !== data.category_id)) {
      throw new BadRequestException('Selecione um tipo de item ativo da categoria da doação.');
    }

    if (!validItemSpecifications(data.specifications, itemType?.code)) {
      throw new BadRequestException('Especificações inválidas para o tipo de item.');
    }
  }

  async adjustStock(
    id: string,
    dto: CreateDonationStockAdjustmentDto,
    actor: Employee
  ) {
    if (!actor?.id) {
      throw new ForbiddenException(
        'Usuário autenticado não encontrado para registrar o ajuste.'
      );
    }

    if (
      actor.role !== EmployeeRole.ADMIN &&
      actor.role !== EmployeeRole.MANAGER
    ) {
      throw new ForbiddenException(
        'Apenas ADMIN e MANAGER podem ajustar estoque.'
      );
    }

    if (dto.delta_quantity === 0) {
      throw new BadRequestException(
        'O delta de estoque deve ser diferente de zero.'
      );
    }

    const normalizedNote = dto.note?.trim();
    if (
      dto.reason === DonationStockAdjustmentReason.OTHER &&
      !normalizedNote
    ) {
      throw new BadRequestException(
        'A observação é obrigatória quando o motivo for OTHER.'
      );
    }

    const result = await retryConflictingTransaction(this.transactionManager, async (ctx) => {
      const donation = await this.donationRepository.findById(id, ctx);

      if (!donation) {
        throw new NotFoundException('Doação não encontrada');
      }

      const newQuantity = donation.current_quantity + dto.delta_quantity;
      if (newQuantity > 2147483647) {
        throw new BadRequestException('O ajuste ultrapassaria o limite de estoque.');
      }
      if (newQuantity < 0) {
        throw new BadRequestException(
          'O ajuste informado deixaria o estoque negativo.'
        );
      }

      const updatedDonation = await this.donationRepository.setStock(
        donation.id,
        donation.current_quantity,
        newQuantity,
        ctx
      );

      if (!updatedDonation) throw new ConcurrentWriteError();

      const adjustment =
        await this.donationStockAdjustmentRepository.create(
          {
            id_donation: donation.id,
            id_employee: actor.id,
            delta_quantity: dto.delta_quantity,
            previous_quantity: donation.current_quantity,
            new_quantity: newQuantity,
            reason: dto.reason,
            note: normalizedNote ?? null,
          },
          ctx
        );

      await this.auditLogService.write({
        ctx,
        entityType: AuditEntityType.DONATION,
        entityId: donation.id,
        actionType: AuditActionType.STOCK_ADJUSTMENT,
        actor,
        message: 'Ajuste de estoque registrado.',
        metadata: {
          delta_quantity: dto.delta_quantity,
          previous_quantity: donation.current_quantity,
          new_quantity: newQuantity,
          reason: dto.reason,
          note: normalizedNote ?? null,
        },
      });

      return {
        adjustment,
        donation: updatedDonation,
      };
    }).catch((error: unknown) => {
      if (error instanceof ConcurrentWriteError) {
        throw new ConflictException('O estoque foi alterado. Tente novamente.');
      }
      throw error;
    });

    return {
      adjustment: result.adjustment,
      donation: await this.withSignedImageUrl(result.donation),
    };
  }

  async findStockAdjustments(id: string) {
    await this.getActiveDonationOrThrow(id);
    return this.donationStockAdjustmentRepository.findByDonation(id);
  }

  async delete(id: string, actor?: Employee) {
    await this.getActiveDonationOrThrow(id);
    await this.donationRepository.delete(id);

    await this.auditLogService.write({
      entityType: AuditEntityType.DONATION,
      entityId: id,
      actionType: AuditActionType.SOFT_DELETE,
      actor,
      message: 'Doação desativada.',
    });
  }

  private async getActiveDonationOrThrow(id: string) {
    const donation = await this.donationRepository.findById(id);

    if (!donation) {
      throw new NotFoundException('Doação não encontrada');
    }

    return donation;
  }

  private async uploadImageIfPresent(
    image?: Express.Multer.File
  ): Promise<Partial<DonationImageMetadata>> {
    if (!image) {
      return {};
    }

    return this.donationImageService.upload(image);
  }

  private async withSignedImageUrls<T extends DonationWithImage>(
    donations: T[]
  ) {
    return Promise.all(
      donations.map((donation) => this.withSignedImageUrl(donation))
    );
  }

  private async withSignedImageUrl<T extends DonationWithImage>(donation: T) {
    let imageUrl: string | null;

    // Falha ao assinar a imagem (S3 indisponível ou não configurado) não pode derrubar a doação
    try {
      imageUrl = await this.donationImageService.getSignedImageUrl(donation);
    } catch (error) {
      this.logger.warn(
        `Não foi possível assinar a imagem ${donation.image_key}: ${
          error instanceof Error ? error.message : error
        }`
      );
      return donation;
    }

    if (!imageUrl) {
      return donation;
    }

    return {
      ...donation,
      image_url: imageUrl,
    };
  }
}
