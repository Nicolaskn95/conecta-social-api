import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Need } from '@/domain/entities';
import { NeedStatus } from '@/domain/enums';
import {
  CreateNeedData,
  NeedFilter,
  NeedRepository,
  RecommendationNeed,
  NeedWriteData,
} from '@/domain/repositories/need.repository';
import { TransactionContext } from '@/domain/transaction/transaction-manager';
import { PrismaService } from '../prisma.service';
import { resolvePrismaClient, toDomain } from '../prisma-transaction-manager';

function withPrismaJson<T extends CreateNeedData | NeedWriteData>({
  specifications,
  ...fields
}: T) {
  return {
    ...fields,
    specifications:
      specifications === null
        ? Prisma.DbNull
        : specifications && { ...specifications },
  };
}

@Injectable()
export class NeedPrismaRepository extends NeedRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(data: CreateNeedData, ctx: TransactionContext): Promise<Need> {
    return toDomain(
      await resolvePrismaClient(this.prisma, ctx).need.create({
        data: withPrismaJson(data),
      })
    );
  }

  async findById(id: string, ctx?: TransactionContext): Promise<Need | null> {
    return toDomain(
      await resolvePrismaClient(this.prisma, ctx).need.findUnique({
        where: { id },
      })
    );
  }

  async list(filter: NeedFilter, skip: number, take: number): Promise<Need[]> {
    return toDomain(
      await this.prisma.need.findMany({
        where: filter,
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        skip,
        take,
      })
    );
  }

  async listForRecommendation(typeId: string, skip: number, take: number): Promise<RecommendationNeed[]> {
    return toDomain(await this.prisma.need.findMany({
      where: { status: NeedStatus.OPEN, OR: [{ item_type_id: typeId }, { item_type_id: null }] },
      orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
      skip,
      take,
      include: {
        family: { select: { active: true, name: true } },
        beneficiary: { select: { active: true, name: true, surname: true, id_family: true } },
      },
    }));
  }

  count(filter: NeedFilter) {
    return this.prisma.need.count({ where: filter });
  }

  async updateOpen(
    id: string,
    version: number,
    data: NeedWriteData,
    ctx: TransactionContext
  ): Promise<Need | null> {
    const client = resolvePrismaClient(this.prisma, ctx);
    const result = await client.need.updateMany({
      where: { id, version, status: NeedStatus.OPEN },
      data: { ...withPrismaJson(data), version: { increment: 1 } },
    });
    return result.count ? this.findById(id, ctx) : null;
  }

  async moveOpenForBeneficiary(
    id: string,
    familyId: string,
    ctx: TransactionContext
  ): Promise<number> {
    const { count } = await resolvePrismaClient(
      this.prisma,
      ctx
    ).need.updateMany({
      where: { id_beneficiary: id, status: NeedStatus.OPEN },
      data: { id_family: familyId, version: { increment: 1 } },
    });
    return count;
  }
}
