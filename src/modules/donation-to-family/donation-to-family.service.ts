import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import {
  AuditActionType,
  AuditEntityType,
  DonationAllocationStatus,
  NeedStatus,
} from '@/domain/enums';
import {
  Donation,
  DonationToFamilyWithRelations,
  Employee,
  Need,
} from '@/domain/entities';
import {
  DonationRepository,
  DonationToFamilyRepository,
  FamilyRepository,
} from '@/domain/repositories';
import { haveConflictingSpecifications } from '@/domain/item-specifications';
import { separableNeedBalance } from '@/domain/need-coverage';
import { NeedRepository } from '@/domain/repositories/need.repository';
import {
  TransactionContext,
  TransactionManager,
} from '@/domain/transaction/transaction-manager';
import {
  ConcurrentWriteError,
  retryConflictingTransaction,
} from '@/domain/transaction/retry-conflicting-transaction';
import { AuditLogService } from '@/modules/audit-log/audit-log.service';
import { BeneficiaryRepository } from '@/modules/beneficiary/beneficiary.repository';
import { CreateDonationToFamilyDto } from './dto/create-donation-to-family.dto';
import {
  AllocationQueryDto,
  CancelAllocationDto,
  ConfirmReceiptDto,
} from './dto/allocation-operations.dto';

const { WAITING_RECEIPT, COMPLETED, CANCELED, UNKNOWN } =
  DonationAllocationStatus;

function publicAllocation({
  request_fingerprint: _fingerprint,
  ...allocation
}: DonationToFamilyWithRelations) {
  return allocation;
}

function fingerprint(dto: CreateDonationToFamilyDto) {
  return createHash('sha256')
    .update(
      JSON.stringify([
        dto.id_donation,
        dto.id_family,
        dto.quantity,
        dto.update_message?.trim() || null,
        dto.id_beneficiary ?? null,
        dto.id_need ?? null,
        dto.delivery_mode ?? null,
      ])
    )
    .digest('hex');
}

@Injectable()
export class DonationToFamilyService {
  constructor(
    private readonly allocations: DonationToFamilyRepository,
    private readonly donations: DonationRepository,
    private readonly families: FamilyRepository,
    private readonly transactions: TransactionManager,
    private readonly audit: AuditLogService,
    private readonly needs: NeedRepository,
    private readonly beneficiaries: BeneficiaryRepository
  ) {}

  async create(dto: CreateDonationToFamilyDto, actor: Employee) {
    const signature = dto.request_id ? fingerprint(dto) : null;
    const replay = await this.replay(dto.request_id, signature);
    if (replay) return { allocation: replay, replayed: true };

    try {
      const allocation = await retryConflictingTransaction(
        this.transactions,
        (ctx) => this.separate(dto, signature, actor, ctx)
      );
      return { allocation: publicAllocation(allocation), replayed: false };
    } catch (error) {
      // A competing request can commit while this transaction is validating or writing.
      const committed = await this.replay(dto.request_id, signature);
      if (committed) return { allocation: committed, replayed: true };
      this.throwConflict(error);
    }
  }

  private async replay(
    requestId: string | undefined,
    signature: string | null
  ) {
    if (!requestId) return null;
    const allocation = await this.allocations.findByRequestId(requestId);
    if (!allocation) return null;
    if (allocation.request_fingerprint !== signature) {
      throw new ConflictException(
        'request_id já está vinculado a outra operação.'
      );
    }
    return publicAllocation(allocation);
  }

  private async separate(
    dto: CreateDonationToFamilyDto,
    signature: string | null,
    actor: Employee,
    ctx: TransactionContext
  ) {
    const donation = await this.donations.findById(dto.id_donation, ctx);
    if (!donation) throw new NotFoundException('Doação não encontrada.');
    if (!(await this.families.findActiveById(dto.id_family, ctx))) {
      throw new NotFoundException('Família não encontrada.');
    }

    const need = dto.id_need ? await this.findNeed(dto.id_need, ctx) : null;
    const beneficiaryId = need?.id_beneficiary ?? dto.id_beneficiary ?? null;
    if (beneficiaryId) {
      if (!(await this.beneficiaries.lockForNeeds(beneficiaryId, ctx))) {
        throw new BadRequestException(
          'Informe um beneficiário ativo da família.'
        );
      }
      const beneficiary = await this.beneficiaries.findById(beneficiaryId, ctx);
      if (beneficiary?.id_family !== dto.id_family) {
        throw new BadRequestException(
          'O beneficiário precisa pertencer à família.'
        );
      }
    }

    if (need) {
      if (need.status !== NeedStatus.OPEN)
        throw new ConflictException('A necessidade precisa estar aberta.');
      if (
        need.id_family !== dto.id_family ||
        (dto.id_beneficiary && need.id_beneficiary !== dto.id_beneficiary)
      ) {
        throw new BadRequestException(
          'A necessidade precisa corresponder à família e ao beneficiário.'
        );
      }
      await this.lockOpenNeed(need, ctx);
      await this.checkNeedCapacity(need, donation, dto.quantity, ctx);
    }

    const nextQuantity = donation.current_quantity - dto.quantity;
    if (!donation.available || nextQuantity < 0) {
      throw new BadRequestException(
        'Estoque insuficiente para concluir esta doação.'
      );
    }
    if (
      !(await this.donations.setStock(
        donation.id,
        donation.current_quantity,
        nextQuantity,
        ctx
      ))
    ) {
      throw new ConcurrentWriteError();
    }

    const allocation = await this.allocations.create(
      {
        id_donation: dto.id_donation,
        id_family: dto.id_family,
        quantity: dto.quantity,
        id_need: need?.id ?? null,
        id_beneficiary: beneficiaryId,
        update_message: dto.update_message?.trim() || null,
        delivery_mode: dto.delivery_mode ?? null,
        separated_at: new Date(),
        separated_by: actor.id,
        status: WAITING_RECEIPT,
        request_id: dto.request_id ?? null,
        request_fingerprint: signature,
      },
      ctx
    );
    await this.audit.write({
      ctx,
      actor,
      entityType: AuditEntityType.DONATION_TO_FAMILY,
      entityId: allocation.id,
      actionType: AuditActionType.ALLOCATE_TO_FAMILY,
      message: 'Doação separada para família.',
      metadata: {
        donation_id: donation.id,
        family_id: dto.id_family,
        quantity: dto.quantity,
        previous_quantity: donation.current_quantity,
        new_quantity: nextQuantity,
        status: WAITING_RECEIPT,
      },
    });
    return allocation;
  }

  private async checkNeedCapacity(
    need: Need,
    donation: Donation,
    quantity: number,
    ctx: TransactionContext
  ) {
    if (
      need.item_type_id &&
      donation.item_type_id &&
      need.item_type_id !== donation.item_type_id
    ) {
      throw new BadRequestException(
        'O tipo da doação é incompatível com a necessidade.'
      );
    }
    if (haveConflictingSpecifications(donation.specifications, need.specifications)) {
      throw new BadRequestException(
        'As características registradas são incompatíveis.'
      );
    }
    const quantities = await this.allocations.needQuantities(need.id, ctx);
    const remaining = separableNeedBalance(need.requested_quantity, quantities);
    if (remaining !== null && quantity > remaining)
      throw new ConflictException(
        'A quantidade solicitada já está coberta total ou parcialmente.'
      );
  }

  async confirm(id: string, dto: ConfirmReceiptDto, actor: Employee) {
    return this.changeAllocation(async (ctx) => {
      const allocation = await this.findAllocation(id, ctx);
      if (allocation.status === COMPLETED) return allocation;
      const before = allocation.status ?? UNKNOWN;
      if (before !== WAITING_RECEIPT && before !== UNKNOWN) {
        throw new ConflictException(
          'A destinação não pode ser confirmada na situação atual.'
        );
      }

      const need = await this.lockLinkedNeed(allocation, ctx);
      if (dto.keep_need_open && need?.requested_quantity != null) {
        throw new BadRequestException(
          'Manter aberta se aplica a uma necessidade com quantidade desconhecida.'
        );
      }
      const receivedAt = dto.received_at ? new Date(dto.received_at) : null;
      if (receivedAt && !Number.isFinite(receivedAt.getTime())) {
        throw new BadRequestException(
          'Informe uma data de recebimento válida.'
        );
      }
      const updated = await this.allocations.transition(
        id,
        before,
        {
          status: COMPLETED,
          confirmed_at: new Date(),
          confirmed_by: actor.id,
          received_at: receivedAt,
        },
        ctx
      );
      if (!updated) throw new ConcurrentWriteError();

      if (need?.status === NeedStatus.OPEN) {
        const { received_quantity } = await this.allocations.needQuantities(
          need.id,
          ctx
        );
        const fulfilled =
          need.requested_quantity === null
            ? !dto.keep_need_open
            : received_quantity >= need.requested_quantity;
        if (fulfilled) {
          const saved = await this.needs.updateOpen(
            need.id,
            need.version,
            { status: NeedStatus.FULFILLED },
            ctx
          );
          if (!saved) throw new ConcurrentWriteError();
          await this.audit.write({
            ctx,
            actor,
            entityType: AuditEntityType.NEED,
            entityId: need.id,
            actionType: AuditActionType.UPDATE_STATUS,
            message: 'Necessidade atendida.',
            metadata: { status: NeedStatus.FULFILLED, allocation_id: id },
          });
        }
      }

      await this.audit.write({
        ctx,
        actor,
        entityType: AuditEntityType.DONATION_TO_FAMILY,
        entityId: id,
        actionType: AuditActionType.UPDATE_STATUS,
        message: 'Recebimento confirmado.',
        metadata: {
          previous_status: before,
          status: COMPLETED,
          received_at: updated.received_at?.toISOString() ?? null,
        },
      });
      return updated;
    });
  }

  async cancel(id: string, dto: CancelAllocationDto, actor: Employee) {
    return this.changeAllocation(async (ctx) => {
      const allocation = await this.findAllocation(id, ctx);
      if (allocation.status === CANCELED) return allocation;
      if (allocation.status !== WAITING_RECEIPT) {
        throw new ConflictException(
          'Somente separações aguardando recebimento podem ser canceladas.'
        );
      }
      await this.lockLinkedNeed(allocation, ctx);
      const updated = await this.allocations.transition(
        id,
        WAITING_RECEIPT,
        {
          status: CANCELED,
          canceled_at: new Date(),
          canceled_by: actor.id,
        },
        ctx
      );
      if (!updated) throw new ConcurrentWriteError();

      const restock = dto.restock ?? true;
      const stock = restock ? await this.returnStock(allocation, ctx) : {};
      await this.audit.write({
        ctx,
        actor,
        entityType: AuditEntityType.DONATION_TO_FAMILY,
        entityId: id,
        actionType: AuditActionType.UPDATE_STATUS,
        message: 'Separação cancelada.',
        metadata: {
          previous_status: WAITING_RECEIPT,
          status: CANCELED,
          restock,
          note: dto.note?.trim() || null,
          ...stock,
        },
      });
      return restock ? this.findAllocation(id, ctx) : updated;
    });
  }

  private async returnStock(
    allocation: DonationToFamilyWithRelations,
    ctx: TransactionContext
  ) {
    const donation = await this.donations.findById(
      allocation.id_donation,
      ctx,
      true
    );
    if (!donation)
      throw new NotFoundException(
        'Doação não encontrada para devolver ao estoque.'
      );
    const nextQuantity = donation.current_quantity + allocation.quantity;
    if (nextQuantity > 2147483647)
      throw new ConflictException(
        'O retorno ultrapassaria o limite do estoque.'
      );
    if (
      !(await this.donations.setStock(
        donation.id,
        donation.current_quantity,
        nextQuantity,
        ctx,
        true
      ))
    ) {
      throw new ConcurrentWriteError();
    }
    return {
      previous_quantity: donation.current_quantity,
      new_quantity: nextQuantity,
    };
  }

  private async lockLinkedNeed(
    allocation: DonationToFamilyWithRelations,
    ctx: TransactionContext
  ) {
    if (!allocation.id_need) return null;
    const need = await this.findNeed(allocation.id_need, ctx);
    if (
      need.id_family !== allocation.id_family ||
      (allocation.id_beneficiary &&
        need.id_beneficiary !== allocation.id_beneficiary)
    ) {
      throw new ConflictException(
        'Confira o vínculo da destinação com a necessidade.'
      );
    }
    return need.status === NeedStatus.OPEN
      ? this.lockOpenNeed(need, ctx)
      : need;
  }

  private async lockOpenNeed(need: Need, ctx: TransactionContext) {
    const locked = await this.needs.updateOpen(need.id, need.version, {}, ctx);
    if (!locked) throw new ConcurrentWriteError();
    return locked;
  }

  private async findNeed(id: string, ctx: TransactionContext) {
    const need = await this.needs.findById(id, ctx);
    if (!need) throw new NotFoundException('Necessidade não encontrada.');
    return need;
  }

  private async changeAllocation(
    work: (ctx: TransactionContext) => Promise<DonationToFamilyWithRelations>
  ) {
    try {
      return publicAllocation(
        await retryConflictingTransaction(this.transactions, work)
      );
    } catch (error) {
      this.throwConflict(error);
    }
  }

  private throwConflict(error: unknown): never {
    if (error instanceof ConcurrentWriteError) {
      throw new ConflictException(
        'A destinação ou o estoque mudou. Tente novamente.'
      );
    }
    throw error;
  }

  async findAllActives() {
    return (await this.allocations.findAllActives()).map(publicAllocation);
  }

  async findAll() {
    return (await this.allocations.findAll()).map(publicAllocation);
  }

  async findById(id: string) {
    return publicAllocation(await this.findAllocation(id));
  }

  private async findAllocation(id: string, ctx?: TransactionContext) {
    const allocation = await this.allocations.findActiveById(id, ctx);
    if (!allocation)
      throw new NotFoundException(
        'Registro de doação para família não encontrado.'
      );
    return allocation;
  }

  async findAllPaginated({
    page = 1,
    size = 10,
    ...filter
  }: AllocationQueryDto) {
    const skip = (page - 1) * size;
    const [list, total] = await Promise.all([
      this.allocations.findActivePaginated(skip, size, filter),
      this.allocations.countActives(filter),
    ]);
    const totalPages = Math.ceil(total / size);
    const isLastPage = page >= totalPages;
    return {
      page,
      next_page: isLastPage ? page : page + 1,
      is_last_page: isLastPage,
      previous_page: Math.max(1, page - 1),
      total_pages: totalPages,
      list: list.map(publicAllocation),
    };
  }
}
