import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma.service';
import { resolvePrismaClient } from '../prisma-transaction-manager';
import { TransactionContext } from '@/domain/transaction/transaction-manager';
import { BeneficiaryRepository, BeneficiaryData, BeneficiaryFilter } from '@/modules/beneficiary/beneficiary.repository';

const omitInternalFields = { needs_revision: true } as const;

function whereFor(filter: BeneficiaryFilter): Prisma.BeneficiaryWhereInput {
  const search = filter.search?.trim();
  const digits = search?.replace(/\D/g, '');
  return {
    active: filter.include_inactive ? undefined : true,
    id_family: filter.family_id,
    has_disability: filter.has_disability,
    OR: search ? [
      ...['name', 'surname', 'rg', 'email', 'phone', 'gender', 'disability_details'].map(
        key => ({ [key]: { contains: search, mode: 'insensitive' as const } })
      ),
      ...(digits ? [{ cpf: { contains: digits } }] : []),
    ] : undefined,
  };
}

@Injectable()
export class BeneficiaryPrismaRepository extends BeneficiaryRepository {
  constructor(private readonly prisma: PrismaService) { super(); }

  async lockForNeeds(id: string, ctx: TransactionContext) {
    const count = await resolvePrismaClient(this.prisma, ctx).$executeRaw`
      UPDATE beneficiaries SET needs_revision = needs_revision + 1 WHERE id = ${id} AND active = true
    `;
    return count > 0;
  }
  create(data: BeneficiaryData, ctx: TransactionContext) {
    return resolvePrismaClient(this.prisma, ctx).beneficiary.create({ data, include: { family: true }, omit: omitInternalFields });
  }
  update(id: string, data: Partial<BeneficiaryData>, ctx: TransactionContext) {
    return resolvePrismaClient(this.prisma, ctx).beneficiary.update({ where: { id }, data, include: { family: true }, omit: omitInternalFields });
  }
  findById(id: string, ctx?: TransactionContext, includeInactive = false) {
    return resolvePrismaClient(this.prisma, ctx).beneficiary.findFirst({ where: { id, ...(includeInactive ? {} : { active: true }) }, include: { family: true }, omit: omitInternalFields });
  }
  findAll(filter: BeneficiaryFilter, skip?: number, take?: number) {
    return this.prisma.beneficiary.findMany({ where: whereFor(filter), include: { family: true }, omit: omitInternalFields, orderBy: { created_at: 'desc' }, skip, take });
  }
  count(filter: BeneficiaryFilter) {
    return this.prisma.beneficiary.count({ where: whereFor(filter) });
  }
  async suggestions(search: string | undefined, limit: number) {
    const rows = await this.prisma.beneficiary.findMany({
      where: { active: true, has_disability: true, disability_details: { not: null, contains: search, mode: 'insensitive' } },
      select: { disability_details: true }, distinct: ['disability_details'], orderBy: { disability_details: 'asc' }, take: limit,
    });
    return rows.map(row => row.disability_details?.trim()).filter((value): value is string => !!value);
  }
}
