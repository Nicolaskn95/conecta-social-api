import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditActionType, AuditEntityType } from '@/domain/enums';
import { Employee } from '@/domain/entities';
import { FamilyRepository } from '@/domain/repositories';
import { TransactionContext, TransactionManager } from '@/domain/transaction/transaction-manager';
import { AuditLogService } from '@/modules/audit-log/audit-log.service';
import { Beneficiary, BeneficiaryData, BeneficiaryRepository } from './beneficiary.repository';
import { BeneficiaryPaginatedQueryDto, BeneficiaryQueryDto } from './dto/beneficiary-query.dto';
import { CreateBeneficiaryDto } from './dto/create-beneficiary.dto';
import { UpdateBeneficiaryDto } from './dto/update-beneficiary.dto';
import { DisabilitySuggestionsQueryDto } from './dto/disability-suggestions-query.dto';

@Injectable()
export class BeneficiaryService {
  constructor(
    private readonly repository: BeneficiaryRepository,
    private readonly families: FamilyRepository,
    private readonly transactions: TransactionManager,
    private readonly audit: AuditLogService,
  ) {}

  async create(dto: CreateBeneficiaryDto, actor?: Employee) {
    const data: BeneficiaryData = {
      id_family: dto.id_family,
      name: this.required(dto.name, 'Nome'),
      surname: this.required(dto.surname, 'Sobrenome'),
      birth_date: new Date(dto.birth_date),
      cpf: dto.cpf?.replace(/\D/g, '') || null,
      rg: dto.rg?.trim() || null,
      email: dto.email?.trim() || null,
      phone: dto.phone?.trim() || null,
      gender: this.required(dto.gender, 'Gênero'),
      has_disability: dto.has_disability,
      disability_details: dto.has_disability ? dto.disability_details?.trim() || null : null,
      active: true,
    };
    this.validateDisability(data);
    return this.handleDuplicate(() => this.transactions.run(async ctx => {
      await this.ensureFamily(data.id_family, ctx);
      const beneficiary = await this.repository.create(data, ctx);
      await this.audit.write({ ctx, actor, entityType: AuditEntityType.BENEFICIARY, entityId: beneficiary.id,
        actionType: AuditActionType.CREATE, message: 'Beneficiário criado.', metadata: { id_family: data.id_family } });
      return beneficiary;
    }));
  }

  findAll(query: BeneficiaryQueryDto) { return this.repository.findAll(query); }
  async findAllPaginated(query: BeneficiaryPaginatedQueryDto) {
    const page = query.page ?? 1;
    const size = query.size ?? 10;
    const [list, total] = await Promise.all([this.repository.findAll(query, (page - 1) * size, size), this.repository.count(query)]);
    const total_pages = Math.ceil(total / size);
    const is_last_page = page >= total_pages;
    return { page, next_page: is_last_page ? page : page + 1, is_last_page, previous_page: Math.max(1, page - 1), total_pages, list };
  }
  async findOne(id: string) { return this.findOrThrow(id); }

  async update(id: string, dto: UpdateBeneficiaryDto, actor?: Employee) {
    return this.handleDuplicate(() => this.transactions.run(async ctx => {
      const current = await this.findOrThrow(id, ctx);
      await this.ensureFamily(dto.id_family ?? current.id_family, ctx);
      const data: Partial<BeneficiaryData> = {};
      if (dto.id_family !== undefined) data.id_family = dto.id_family;
      if (dto.name !== undefined) data.name = this.required(dto.name, 'Nome');
      if (dto.surname !== undefined) data.surname = this.required(dto.surname, 'Sobrenome');
      if (dto.gender !== undefined) data.gender = this.required(dto.gender, 'Gênero');
      if (dto.birth_date !== undefined) data.birth_date = new Date(dto.birth_date);
      for (const key of ['cpf', 'rg', 'email', 'phone'] as const) {
        if (Object.prototype.hasOwnProperty.call(dto, key)) {
          const value = dto[key]?.trim() || null;
          data[key] = key === 'cpf' && value ? value.replace(/\D/g, '') : value;
        }
      }
      data.has_disability = dto.has_disability ?? current.has_disability;
      data.disability_details = data.has_disability
        ? (Object.prototype.hasOwnProperty.call(dto, 'disability_details') ? dto.disability_details?.trim() || null : current.disability_details)
        : null;
      this.validateDisability(data);
      const beneficiary = await this.repository.update(id, data, ctx);
      await this.audit.write({ ctx, actor, entityType: AuditEntityType.BENEFICIARY, entityId: id,
        actionType: AuditActionType.UPDATE, message: 'Beneficiário atualizado.', metadata: { updated_fields: Object.keys(dto) } });
      return beneficiary;
    }));
  }

  async remove(id: string, actor?: Employee) {
    return this.transactions.run(async ctx => {
      await this.findOrThrow(id, ctx);
      const beneficiary = await this.repository.update(id, { active: false }, ctx);
      await this.audit.write({ ctx, actor, entityType: AuditEntityType.BENEFICIARY, entityId: id,
        actionType: AuditActionType.SOFT_DELETE, message: 'Beneficiário desativado.' });
      return beneficiary;
    });
  }
  findDisabilitySuggestions(query: DisabilitySuggestionsQueryDto) {
    return this.repository.suggestions(query.search?.trim(), query.limit ?? 10);
  }
  private async findOrThrow(id: string, ctx?: TransactionContext): Promise<Beneficiary> {
    const beneficiary = await this.repository.findById(id, ctx);
    if (!beneficiary) throw new NotFoundException('Beneficiário não encontrado.');
    return beneficiary;
  }
  private async ensureFamily(id: string, ctx: TransactionContext) {
    if (!await this.families.findActiveById(id, ctx)) throw new NotFoundException('Família não encontrada.');
  }
  private required(value: string, field: string) {
    if (!value?.trim()) throw new BadRequestException(`${field} é obrigatório.`);
    return value.trim();
  }
  private validateDisability(data: Partial<BeneficiaryData>) {
    if (data.has_disability && !data.disability_details) throw new BadRequestException('Detalhes da deficiência são obrigatórios.');
  }
  private async handleDuplicate<T>(operation: () => Promise<T>): Promise<T> {
    try { return await operation(); } catch (error) {
      const err = error as { code?: string | number; meta?: { target?: string | string[] }; keyPattern?: Record<string, number> };
      const target = err.meta?.target;
      if ((err.code === 'P2002' && (Array.isArray(target) ? target.includes('cpf') : target === 'cpf')) ||
          (err.code === 11000 && err.keyPattern?.cpf)) {
        throw new BadRequestException('CPF já cadastrado para outro beneficiário.');
      }
      throw error;
    }
  }
}
