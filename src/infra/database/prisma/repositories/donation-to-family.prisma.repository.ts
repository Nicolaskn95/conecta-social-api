import { Prisma } from '@prisma/client';
import { DonationAllocationStatus } from '@/domain/enums';
import { Injectable } from '@nestjs/common';
import { DonationToFamilyWithRelations } from '@/domain/entities';
import {
  AllocationFilter,
  AllocationTransition,
  CreateDonationToFamilyData,
  DonationToFamilyRepository,
} from '@/domain/repositories';
import { TransactionContext } from '@/domain/transaction/transaction-manager';
import { PrismaService } from '../prisma.service';
import { resolvePrismaClient, toDomain } from '../prisma-transaction-manager';

const relations = {
  donation: { include: { category: true } },
  family: true,
  beneficiary: {
    select: { id: true, name: true, surname: true, active: true },
  },
} as const;

const activeWhere = {
  active: true,
  donation: { active: true },
  family: { active: true },
};

function matchingAllocations({
  status,
  delivery_mode,
  family_id,
  beneficiary_id,
}: AllocationFilter): Prisma.DonationToFamilyWhereInput {
  return {
    ...(status === DonationAllocationStatus.WAITING_RECEIPT
      ? { active: true }
      : activeWhere),
    status,
    delivery_mode,
    id_family: family_id,
    id_beneficiary: beneficiary_id,
  };
}

@Injectable()
export class DonationToFamilyPrismaRepository extends DonationToFamilyRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async needQuantities(id: string, ctx?: TransactionContext) {
    return (await this.needQuantitiesFor([id], ctx)).get(id) ?? {
      received_quantity: 0,
      separated_quantity: 0,
    };
  }

  async needQuantitiesFor(ids: string[], ctx?: TransactionContext) {
    const totals = new Map<string, { received_quantity: number; separated_quantity: number }>();
    if (!ids.length) return totals;
    const rows = await resolvePrismaClient(
      this.prisma,
      ctx
    ).donationToFamily.groupBy({
      by: ['id_need', 'status'],
      where: {
        id_need: { in: ids },
        status: {
          in: [
            DonationAllocationStatus.COMPLETED,
            DonationAllocationStatus.WAITING_RECEIPT,
          ],
        },
      },
      _sum: { quantity: true },
    });
    for (const row of rows) {
      const id = row.id_need;
      if (!id) continue;
      const quantities = totals.get(id) ?? { received_quantity: 0, separated_quantity: 0 };
      if (row.status === DonationAllocationStatus.COMPLETED) quantities.received_quantity = row._sum.quantity ?? 0;
      else quantities.separated_quantity = row._sum.quantity ?? 0;
      totals.set(id, quantities);
    }
    return totals;
  }

  async findWaitingForBeneficiary(
    id: string,
    ctx: TransactionContext
  ): Promise<string | null> {
    const allocation = await resolvePrismaClient(
      this.prisma,
      ctx
    ).donationToFamily.findFirst({
      where: {
        status: DonationAllocationStatus.WAITING_RECEIPT,
        OR: [{ id_beneficiary: id }, { need: { id_beneficiary: id } }],
      },
      select: { id: true },
    });
    return allocation?.id ?? null;
  }

  async findByRequestId(
    request_id: string
  ): Promise<DonationToFamilyWithRelations | null> {
    return toDomain(
      await this.prisma.donationToFamily.findFirst({
        where: { request_id },
        include: relations,
      })
    );
  }

  async transition(
    id: string,
    from: DonationAllocationStatus,
    data: AllocationTransition,
    ctx: TransactionContext
  ) {
    const client = resolvePrismaClient(this.prisma, ctx);
    const result = await client.donationToFamily.updateMany({
      where: { id, active: true, status: from },
      data,
    });
    return result.count ? this.findActiveById(id, ctx) : null;
  }

  async create(
    data: CreateDonationToFamilyData,
    ctx?: TransactionContext
  ): Promise<DonationToFamilyWithRelations> {
    const client = resolvePrismaClient(this.prisma, ctx);
    return toDomain(
      await client.donationToFamily.create({ data, include: relations })
    );
  }

  async findAll(): Promise<DonationToFamilyWithRelations[]> {
    return toDomain(
      await this.prisma.donationToFamily.findMany({
        include: relations,
        orderBy: { created_at: 'desc' },
      })
    );
  }

  async findAllActives(): Promise<DonationToFamilyWithRelations[]> {
    return toDomain(
      await this.prisma.donationToFamily.findMany({
        where: activeWhere,
        include: relations,
        orderBy: { created_at: 'desc' },
      })
    );
  }

  async findActiveById(
    id: string,
    ctx?: TransactionContext
  ): Promise<DonationToFamilyWithRelations | null> {
    return toDomain(
      await resolvePrismaClient(this.prisma, ctx).donationToFamily.findFirst({
        where: { id, active: true },
        include: relations,
      })
    );
  }

  async findActivePaginated(
    skip: number,
    take: number,
    filter: AllocationFilter
  ): Promise<DonationToFamilyWithRelations[]> {
    if (filter.status === DonationAllocationStatus.WAITING_RECEIPT) {
      const ids = await this.prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM donations_to_family
        WHERE active = true AND status = 'WAITING_RECEIPT'
        ${filter.family_id ? Prisma.sql`AND id_family = ${filter.family_id}` : Prisma.empty}
        ${filter.beneficiary_id ? Prisma.sql`AND id_beneficiary = ${filter.beneficiary_id}` : Prisma.empty}
        ${filter.delivery_mode ? Prisma.sql`AND delivery_mode = ${filter.delivery_mode}::"DeliveryMode"` : Prisma.empty}
        ORDER BY COALESCE(separated_at, created_at), id
        OFFSET ${skip} LIMIT ${take}
      `;
      const rows = await this.prisma.donationToFamily.findMany({
        where: {
          ...matchingAllocations(filter),
          id: { in: ids.map(({ id }) => id) },
        },
        include: relations,
      });
      const byId = new Map(rows.map((row) => [row.id, row]));
      return toDomain(ids.map(({ id }) => byId.get(id)).filter(Boolean));
    }

    return toDomain(
      await this.prisma.donationToFamily.findMany({
        where: matchingAllocations(filter),
        include: relations,
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        skip,
        take,
      })
    );
  }

  countActives(filter: AllocationFilter): Promise<number> {
    return this.prisma.donationToFamily.count({
      where: matchingAllocations(filter),
    });
  }
}
