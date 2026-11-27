import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Employee, Need } from '@/domain/entities';
import { AuditActionType, AuditEntityType, NeedStatus } from '@/domain/enums';
import { validItemSpecifications } from '@/domain/item-specifications';
import {
  CategoryRepository,
  DonationToFamilyRepository,
  FamilyRepository,
} from '@/domain/repositories';
import { ItemTypeRepository } from '@/domain/repositories/item-type.repository';
import {
  NeedComplements,
  NeedRepository,
  UpdateNeedData,
} from '@/domain/repositories/need.repository';
import {
  TransactionContext,
  TransactionManager,
} from '@/domain/transaction/transaction-manager';
import { AuditLogService } from '@/modules/audit-log/audit-log.service';
import { BeneficiaryRepository } from '@/modules/beneficiary/beneficiary.repository';
import { ItemTypesQueryDto, NeedsQueryDto } from './needs.dto';

const complementKeys = [
  'item_type_id',
  'description',
  'requested_quantity',
  'specifications',
] as const;
type Actor = Pick<Employee, 'id' | 'role'>;
type Owner = { id_family: string; id_beneficiary: string | null };

function normalizeSearch(value: string) {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
}

function normalizeComplements(
  input: Partial<NeedComplements>
): Partial<NeedComplements> {
  const { item_type_id, description, requested_quantity, specifications } =
    input;
  return {
    ...(item_type_id === undefined ? {} : { item_type_id }),
    ...(description === undefined
      ? {}
      : { description: description?.trim() || null }),
    ...(requested_quantity === undefined ? {} : { requested_quantity }),
    ...(specifications === undefined
      ? {}
      : {
          specifications:
            specifications && Object.keys(specifications).length
              ? specifications
              : null,
        }),
  };
}

function viewNeed({ version: _version, ...need }: Need) {
  return need;
}

@Injectable()
export class NeedsService {
  constructor(
    private readonly needs: NeedRepository,
    private readonly types: ItemTypeRepository,
    private readonly categories: CategoryRepository,
    private readonly families: FamilyRepository,
    private readonly beneficiaries: BeneficiaryRepository,
    private readonly allocations: DonationToFamilyRepository,
    private readonly transactions: TransactionManager,
    private readonly audit: AuditLogService
  ) {}

  async listItemTypes(query: ItemTypesQueryDto) {
    const search = normalizeSearch(query.search ?? '');
    const types = await this.types.findActive(query.category_id);
    return types
      .filter(({ name, aliases }) =>
        [name, ...aliases].some((value) =>
          normalizeSearch(value).includes(search)
        )
      )
      .sort(
        (a, b) =>
          a.name.localeCompare(b.name, 'pt-BR') || a.code.localeCompare(b.code)
      )
      .map(({ id, code, name, category_id, aliases }) => ({
        id,
        code,
        name,
        category_id,
        aliases,
      }));
  }

  createForFamily(id: string, input: Partial<NeedComplements>, actor: Actor) {
    return this.create(input, actor, async (_hasContent, ctx) => {
      await this.requireActiveFamily(id, ctx);
      return { id_family: id, id_beneficiary: null };
    });
  }

  createForBeneficiary(
    id: string,
    input: Partial<NeedComplements>,
    actor: Actor
  ) {
    return this.create(input, actor, async (hasContent, ctx) => {
      const locked =
        hasContent && (await this.beneficiaries.lockForNeeds(id, ctx));
      const beneficiary = await this.beneficiaries.findById(id, ctx, true);
      if (!beneficiary)
        throw new NotFoundException('Beneficiário não encontrado.');
      if (!beneficiary.active || (hasContent && !locked)) {
        throw new ConflictException('Beneficiário desativado.');
      }
      await this.requireActiveFamily(beneficiary.id_family, ctx);
      return { id_family: beneficiary.id_family, id_beneficiary: id };
    });
  }

  private async create(
    input: Partial<NeedComplements>,
    actor: Actor,
    resolveOwner: (
      hasContent: boolean,
      ctx: TransactionContext
    ) => Promise<Owner>
  ) {
    const data = normalizeComplements(input);
    const hasContent = Object.values(data).some((value) => value !== null);
    if (hasContent) await this.validateComplements(data, true);
    return this.transactions.run(async (ctx) => {
      const owner = await resolveOwner(hasContent, ctx);
      if (!hasContent) return null;
      const need = await this.needs.create(
        { ...data, ...owner, created_by: actor.id },
        ctx
      );
      await this.audit.write({
        ctx,
        actor,
        entityType: AuditEntityType.NEED,
        entityId: need.id,
        actionType: AuditActionType.CREATE,
        message: 'Necessidade cadastrada.',
        metadata: { ...owner, fields: Object.keys(data) },
      });
      return viewNeed(need);
    });
  }

  async list(query: NeedsQueryDto) {
    const { page = 1, size = 10 } = query;
    const filter = {
      ...(query.family_id && { id_family: query.family_id }),
      ...(query.beneficiary_id && { id_beneficiary: query.beneficiary_id }),
      ...(query.item_type_id && { item_type_id: query.item_type_id }),
      ...(query.status && { status: query.status }),
    };
    const [rows, count] = await Promise.all([
      this.needs.list(filter, (page - 1) * size, size),
      this.needs.count(filter),
    ]);
    const total_pages = Math.ceil(count / size);
    const is_last_page = page >= total_pages;
    return {
      page,
      next_page: is_last_page ? page : page + 1,
      is_last_page,
      previous_page: Math.max(1, page - 1),
      total_pages,
      list: rows.map(viewNeed),
    };
  }

  async detail(id: string) {
    const need = await this.findOrThrow(id);
    const [type, quantities] = await Promise.all([
      need.item_type_id ? this.types.findById(need.item_type_id) : null,
      this.allocations.needQuantities(id),
    ]);
    return {
      ...viewNeed(need),
      item_type: type
        ? { id: type.id, code: type.code, name: type.name }
        : null,
      ...quantities,
      remaining_quantity:
        need.requested_quantity === null
          ? null
          : Math.max(0, need.requested_quantity - quantities.received_quantity),
    };
  }

  async update(id: string, input: UpdateNeedData, actor: Actor) {
    const complements = normalizeComplements(input);
    const updates: UpdateNeedData = {
      ...complements,
      ...(input.status && { status: input.status }),
    };
    const result = await this.tryUpdate(id, updates, actor);
    if (result) return result;

    const retried = await this.tryUpdate(id, updates, actor);
    if (!retried)
      throw new ConflictException(
        'Necessidade alterada. Atualize os dados e tente novamente.'
      );
    return retried;
  }

  private tryUpdate(id: string, updates: UpdateNeedData, actor: Actor) {
    return this.transactions.run(async (ctx) => {
      const current = await this.findOrThrow(id, ctx);
      const fields = Object.keys(updates);
      if (
        !fields.length ||
        (fields.length === 1 && updates.status === current.status)
      )
        return viewNeed(current);
      if (current.status !== NeedStatus.OPEN) {
        throw new ConflictException(
          'Apenas necessidades abertas podem ser alteradas.'
        );
      }

      const effective = Object.fromEntries(
        complementKeys.map((key) => [
          key,
          updates[key] === undefined ? current[key] : updates[key],
        ])
      ) as NeedComplements;
      if (
        updates.item_type_id !== undefined ||
        updates.specifications !== undefined
      ) {
        await this.validateComplements(
          effective,
          updates.item_type_id !== undefined &&
            updates.item_type_id !== current.item_type_id
        );
      }
      if (fields.some((field) => field !== 'description')) {
        await this.checkPendingAllocation(current, updates, ctx);
      }

      const saved = await this.needs.updateOpen(
        id,
        current.version,
        updates,
        ctx
      );
      if (!saved) return null;
      await this.audit.write({
        ctx,
        actor,
        entityType: AuditEntityType.NEED,
        entityId: id,
        actionType: updates.status
          ? AuditActionType.UPDATE_STATUS
          : AuditActionType.UPDATE,
        message: updates.status
          ? 'Necessidade encerrada.'
          : 'Necessidade atualizada.',
        metadata: {
          updated_fields: fields,
          ...(updates.status && { status: updates.status }),
        },
      });
      return viewNeed(saved);
    });
  }

  private async checkPendingAllocation(
    current: Need,
    updates: UpdateNeedData,
    ctx: TransactionContext
  ) {
    const { received_quantity, separated_quantity } =
      await this.allocations.needQuantities(current.id, ctx);
    if (!separated_quantity) return;
    const quantity = updates.requested_quantity;
    if (
      updates.status ||
      updates.specifications !== undefined ||
      (updates.item_type_id !== undefined &&
        updates.item_type_id !== current.item_type_id) ||
      (quantity !== undefined &&
        (quantity === null ||
          quantity < received_quantity + separated_quantity))
    ) {
      throw new ConflictException(
        'Resolva a separação aguardando recebimento antes de alterar a necessidade.'
      );
    }
  }

  private async validateComplements(
    data: Partial<NeedComplements>,
    requireActiveType: boolean
  ) {
    const type = data.item_type_id
      ? await this.types.findById(data.item_type_id)
      : null;
    if (
      data.item_type_id &&
      (!type ||
        (requireActiveType &&
          (!type.active ||
            !(await this.categories.findById(type.category_id)))))
    ) {
      throw new BadRequestException(
        'Selecione um tipo de item de uma categoria ativa.'
      );
    }
    if (!validItemSpecifications(data.specifications, type?.code)) {
      throw new BadRequestException(
        'Especificações inválidas para o tipo de item.'
      );
    }
  }

  private async findOrThrow(id: string, ctx?: TransactionContext) {
    const need = await this.needs.findById(id, ctx);
    if (!need) throw new NotFoundException('Necessidade não encontrada.');
    return need;
  }

  private async requireActiveFamily(id: string, ctx: TransactionContext) {
    const family = await this.families.findById(id, ctx);
    if (!family) throw new NotFoundException('Família não encontrada.');
    if (!family.active) throw new ConflictException('Família desativada.');
  }
}
