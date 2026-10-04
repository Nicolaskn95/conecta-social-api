import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditActionType, AuditEntityType } from '@/domain/enums';
import { Employee } from '@/domain/entities';
import { CreateDonationToFamilyDto } from './dto/create-donation-to-family.dto';
import { AuditLogService } from '@/modules/audit-log/audit-log.service';
import {
  DonationRepository,
  DonationToFamilyRepository,
  FamilyRepository,
} from '@/domain/repositories';
import { TransactionManager } from '@/domain/transaction/transaction-manager';

@Injectable()
export class DonationToFamilyService {
  constructor(
    private readonly donationToFamilyRepository: DonationToFamilyRepository,
    private readonly donationRepository: DonationRepository,
    private readonly familyRepository: FamilyRepository,
    private readonly transactionManager: TransactionManager,
    private readonly auditLogService: AuditLogService
  ) {}

  async create(dto: CreateDonationToFamilyDto, actor?: Employee) {
    if (dto.quantity <= 0) {
      throw new BadRequestException('A quantidade deve ser maior que zero.');
    }

    return this.transactionManager.run(async (ctx) => {
      const [donation, family] = await Promise.all([
        this.donationRepository.findById(dto.id_donation, ctx),
        this.familyRepository.findActiveById(dto.id_family, ctx),
      ]);

      if (!donation) {
        throw new NotFoundException('Doação não encontrada.');
      }

      if (!family) {
        throw new NotFoundException('Família não encontrada.');
      }

      const updatedDonation =
        await this.donationRepository.decrementStockIfAvailable(
          dto.id_donation,
          dto.quantity,
          ctx
        );

      if (!updatedDonation) {
        throw new BadRequestException(
          'Estoque insuficiente para concluir esta doação.'
        );
      }

      const donationToFamily =
        await this.donationToFamilyRepository.create(
          {
            id_donation: dto.id_donation,
            id_family: dto.id_family,
            quantity: dto.quantity,
            update_message: dto.update_message,
          },
          ctx
        );

      await this.auditLogService.write({
        ctx,
        entityType: AuditEntityType.DONATION_TO_FAMILY,
        entityId: donationToFamily.id,
        actionType: AuditActionType.ALLOCATE_TO_FAMILY,
        actor,
        message: 'Doação destinada para família.',
        metadata: {
          donation_id: dto.id_donation,
          family_id: dto.id_family,
          quantity: dto.quantity,
          previous_quantity: donation.current_quantity,
          new_quantity: updatedDonation.current_quantity,
        },
      });

      return donationToFamily;
    });
  }

  findAllActives() {
    return this.donationToFamilyRepository.findAllActives();
  }

  findAll() {
    return this.donationToFamilyRepository.findAll();
  }

  async findById(id: string) {
    const donationToFamily =
      await this.donationToFamilyRepository.findActiveById(id);

    if (!donationToFamily) {
      throw new NotFoundException(
        'Registro de doação para família não encontrado.'
      );
    }

    return donationToFamily;
  }

  async findAllPaginated(page = 1, size = 10) {
    const skip = (page - 1) * size;

    const [list, total] = await Promise.all([
      this.donationToFamilyRepository.findActivePaginated(skip, size),
      this.donationToFamilyRepository.countActives(),
    ]);

    const totalPages = Math.ceil(total / size);
    const isLastPage = page >= totalPages;

    return {
      page,
      next_page: isLastPage ? page : page + 1,
      is_last_page: isLastPage,
      previous_page: page > 1 ? page - 1 : 1,
      total_pages: totalPages,
      list,
    };
  }
}
