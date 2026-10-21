import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AuditActionType,
  AuditEntityType,
  Employee,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '@/config/prisma/prisma.service';
import { AuditLogService } from '@/modules/audit-log/audit-log.service';
import {
  BeneficiaryPaginatedQueryDto,
  BeneficiaryQueryDto,
} from './dto/beneficiary-query.dto';
import { CreateBeneficiaryDto } from './dto/create-beneficiary.dto';
import { UpdateBeneficiaryDto } from './dto/update-beneficiary.dto';
import { DisabilitySuggestionsQueryDto } from './dto/disability-suggestions-query.dto';

@Injectable()
export class BeneficiaryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService
  ) {}

  async create(dto: CreateBeneficiaryDto, actor?: Employee) {
    await this.ensureFamilyIsActive(dto.id_family);

    const payload = this.buildCreatePayload(dto);

    if (payload.has_disability && !payload.disability_details) {
      throw new BadRequestException(
        'Detalhes da deficiência são obrigatórios quando has_disability for true.'
      );
    }

    if (!payload.has_disability) {
      payload.disability_details = null;
    }

    const beneficiary = await this.createWithUniqueConstraintHandling(payload);

    await this.auditLogService.write({
      entityType: AuditEntityType.BENEFICIARY,
      entityId: beneficiary.id,
      actionType: AuditActionType.CREATE,
      actor,
      message: 'Beneficiário criado.',
      metadata: {
        id_family: beneficiary.id_family,
        has_disability: beneficiary.has_disability,
      },
    });

    return this.findByIdOrThrow(beneficiary.id);
  }

  findAll(query: BeneficiaryQueryDto) {
    return this.prisma.beneficiary.findMany({
      where: this.buildWhere(query),
      include: {
        family: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async findAllPaginated(query: BeneficiaryPaginatedQueryDto) {
    const page = query.page ?? 1;
    const size = query.size ?? 10;
    const skip = (page - 1) * size;
    const where = this.buildWhere(query);

    const [list, total] = await Promise.all([
      this.prisma.beneficiary.findMany({
        where,
        include: {
          family: true,
        },
        orderBy: {
          created_at: 'desc',
        },
        skip,
        take: size,
      }),
      this.prisma.beneficiary.count({ where }),
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

  async findOne(id: string) {
    return this.findByIdOrThrow(id);
  }

  async update(id: string, dto: UpdateBeneficiaryDto, actor?: Employee) {
    const existing = await this.findByIdOrThrow(id);

    if (dto.id_family && dto.id_family !== existing.id_family) {
      await this.ensureFamilyIsActive(dto.id_family);
    }

    const payload = this.buildUpdatePayload(existing, dto);

    const beneficiary = await this.updateWithUniqueConstraintHandling(id, payload);

    await this.auditLogService.write({
      entityType: AuditEntityType.BENEFICIARY,
      entityId: beneficiary.id,
      actionType: AuditActionType.UPDATE,
      actor,
      message: 'Beneficiário atualizado.',
      metadata: {
        updated_fields: Object.keys(dto),
        has_disability: beneficiary.has_disability,
      },
    });

    return this.findByIdOrThrow(beneficiary.id);
  }

  async remove(id: string, actor?: Employee) {
    await this.findByIdOrThrow(id);

    const beneficiary = await this.prisma.beneficiary.update({
      where: { id },
      data: { active: false },
    });

    await this.auditLogService.write({
      entityType: AuditEntityType.BENEFICIARY,
      entityId: beneficiary.id,
      actionType: AuditActionType.SOFT_DELETE,
      actor,
      message: 'Beneficiário desativado.',
    });

    return beneficiary;
  }

  async findDisabilitySuggestions(query: DisabilitySuggestionsQueryDto) {
    const search = query.search?.trim();
    const take = query.limit ?? 10;

    const rows = await this.prisma.beneficiary.findMany({
      where: {
        active: true,
        has_disability: true,
        disability_details: {
          not: null,
          contains: search,
          mode: 'insensitive',
        },
      },
      select: {
        disability_details: true,
      },
      distinct: ['disability_details'],
      orderBy: {
        disability_details: 'asc',
      },
      take,
    });

    return rows
      .map((row) => row.disability_details?.trim())
      .filter((value): value is string => Boolean(value));
  }

  private buildWhere(query: BeneficiaryQueryDto): Prisma.BeneficiaryWhereInput {
    const where: Prisma.BeneficiaryWhereInput = {};

    if (!query.include_inactive) {
      where.active = true;
    }

    if (query.family_id) {
      where.id_family = query.family_id;
    }

    if (query.has_disability !== undefined) {
      where.has_disability = query.has_disability;
    }

    const search = query.search?.trim();
    if (search) {
      const cpfSearch = search.replace(/\D/g, '');

      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { surname: { contains: search, mode: 'insensitive' } },
        { rg: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { gender: { contains: search, mode: 'insensitive' } },
        { disability_details: { contains: search, mode: 'insensitive' } },
      ];

      if (cpfSearch) {
        where.OR.push({ cpf: { contains: cpfSearch } });
      }
    }

    return where;
  }

  private async findByIdOrThrow(id: string) {
    const beneficiary = await this.prisma.beneficiary.findFirst({
      where: {
        id,
        active: true,
      },
      include: {
        family: true,
      },
    });

    if (!beneficiary) {
      throw new NotFoundException('Beneficiário não encontrado.');
    }

    return beneficiary;
  }

  private async ensureFamilyIsActive(id: string) {
    const family = await this.prisma.family.findFirst({
      where: {
        id,
        active: true,
      },
      select: {
        id: true,
      },
    });

    if (!family) {
      throw new NotFoundException('Família não encontrada.');
    }
  }

  private buildCreatePayload(dto: CreateBeneficiaryDto): Prisma.BeneficiaryCreateInput {
    const hasDisability = dto.has_disability === true;

    return {
      family: {
        connect: { id: dto.id_family },
      },
      name: this.normalizeRequiredText(dto.name, 'Nome'),
      surname: this.normalizeRequiredText(dto.surname, 'Sobrenome'),
      birth_date: new Date(dto.birth_date),
      cpf: this.normalizeCpf(dto.cpf),
      rg: this.normalizeOptionalText(dto.rg),
      email: this.normalizeOptionalText(dto.email),
      phone: this.normalizeOptionalText(dto.phone),
      has_disability: hasDisability,
      disability_details: this.normalizeOptionalText(dto.disability_details),
      gender: this.normalizeRequiredText(dto.gender, 'Gênero'),
      active: dto.active ?? true,
    };
  }

  private buildUpdatePayload(
    current: {
      id_family: string;
      name: string;
      surname: string;
      birth_date: Date;
      cpf: string | null;
      rg: string | null;
      email: string | null;
      phone: string | null;
      has_disability: boolean;
      disability_details: string | null;
      gender: string;
      active: boolean;
    },
    dto: UpdateBeneficiaryDto
  ): Prisma.BeneficiaryUpdateInput {
    const hasDisability = dto.has_disability ?? current.has_disability;

    const disabilityDetailsProvided = Object.prototype.hasOwnProperty.call(
      dto,
      'disability_details'
    );

    const normalizedDisabilityDetails = disabilityDetailsProvided
      ? this.normalizeOptionalText(dto.disability_details)
      : current.disability_details;

    if (hasDisability && !normalizedDisabilityDetails) {
      throw new BadRequestException(
        'Detalhes da deficiência são obrigatórios quando has_disability for true.'
      );
    }

    return {
      family: dto.id_family
        ? {
            connect: {
              id: dto.id_family,
            },
          }
        : undefined,
      name: dto.name ? this.normalizeRequiredText(dto.name, 'Nome') : undefined,
      surname: dto.surname
        ? this.normalizeRequiredText(dto.surname, 'Sobrenome')
        : undefined,
      birth_date: dto.birth_date ? new Date(dto.birth_date) : undefined,
      cpf: Object.prototype.hasOwnProperty.call(dto, 'cpf')
        ? this.normalizeCpf(dto.cpf)
        : undefined,
      rg: Object.prototype.hasOwnProperty.call(dto, 'rg')
        ? this.normalizeOptionalText(dto.rg)
        : undefined,
      email: Object.prototype.hasOwnProperty.call(dto, 'email')
        ? this.normalizeOptionalText(dto.email)
        : undefined,
      phone: Object.prototype.hasOwnProperty.call(dto, 'phone')
        ? this.normalizeOptionalText(dto.phone)
        : undefined,
      has_disability: hasDisability,
      disability_details: hasDisability ? normalizedDisabilityDetails : null,
      gender: dto.gender
        ? this.normalizeRequiredText(dto.gender, 'Gênero')
        : undefined,
      active: dto.active,
    };
  }

  private normalizeRequiredText(value: string, field: string): string {
    const normalized = value?.trim();

    if (!normalized) {
      throw new BadRequestException(`${field} é obrigatório.`);
    }

    return normalized;
  }

  private normalizeOptionalText(value?: string | null): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.trim();
    return normalized === '' ? null : normalized;
  }

  private normalizeCpf(value?: string | null): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const digits = value.replace(/\D/g, '');
    return digits === '' ? null : digits;
  }

  private async createWithUniqueConstraintHandling(
    payload: Prisma.BeneficiaryCreateInput
  ) {
    try {
      return await this.prisma.beneficiary.create({ data: payload });
    } catch (error) {
      this.handleUniqueConstraintError(error);
      throw error;
    }
  }

  private async updateWithUniqueConstraintHandling(
    id: string,
    payload: Prisma.BeneficiaryUpdateInput
  ) {
    try {
      return await this.prisma.beneficiary.update({
        where: { id },
        data: payload,
      });
    } catch (error) {
      this.handleUniqueConstraintError(error);
      throw error;
    }
  }

  private handleUniqueConstraintError(error: unknown) {
    const target =
      error instanceof Prisma.PrismaClientKnownRequestError
        ? error.meta?.target
        : undefined;

    const hasCpfTarget = Array.isArray(target)
      ? target.includes('cpf')
      : target === 'cpf';

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002' &&
      hasCpfTarget
    ) {
      throw new BadRequestException('CPF já cadastrado para outro beneficiário.');
    }
  }
}
