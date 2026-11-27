import { Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { Donation, DonationWithCategory } from '@/domain/entities';
import {
  CreateDonationData,
  DonationRepository,
  UpdateDonationData,
} from '@/domain/repositories';
import { TransactionContext } from '@/domain/transaction/transaction-manager';
import { PrismaService } from '../prisma.service';
import { resolvePrismaClient, toDomain } from '../prisma-transaction-manager';

const withCategory = { category: true } as const;

@Injectable()
export class DonationPrismaRepository extends DonationRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(data: CreateDonationData): Promise<DonationWithCategory> {
    return toDomain(
      await this.prisma.donation.create({
        data: { ...data, specifications: data.specifications === null ? Prisma.DbNull : data.specifications && { ...data.specifications }, current_quantity: data.initial_quantity },
        include: withCategory,
      })
    );
  }

  async findAll(): Promise<DonationWithCategory[]> {
    return toDomain(
      await this.prisma.donation.findMany({
        where: { active: true },
        include: withCategory,
      })
    );
  }

  async findAllActives(): Promise<DonationWithCategory[]> {
    return toDomain(
      await this.prisma.donation.findMany({
        where: { active: true },
        include: withCategory,
      })
    );
  }

  async findAllWithStock(): Promise<DonationWithCategory[]> {
    return toDomain(
      await this.prisma.donation.findMany({
        where: { active: true, available: true, current_quantity: { gt: 0 } },
        include: withCategory,
      })
    );
  }

  async findById(id: string, ctx?: TransactionContext, includeInactive = false): Promise<DonationWithCategory | null> {
    const client = resolvePrismaClient(this.prisma, ctx);
    return toDomain(
      await client.donation.findFirst({
        where: { id, ...(includeInactive ? {} : { active: true }) },
        include: withCategory,
      })
    );
  }

  async update(id: string, data: UpdateDonationData): Promise<DonationWithCategory> {
    return toDomain(
      await this.prisma.donation.update({
        where: { id },
        data: { ...data, specifications: data.specifications === null ? Prisma.DbNull : data.specifications && { ...data.specifications } },
        include: withCategory,
      })
    );
  }

  async delete(id: string): Promise<void> {
    await this.prisma.donation.update({
      where: { id },
      data: { active: false },
    });
  }

  async findPaginated(skip: number, take: number): Promise<DonationWithCategory[]> {
    return toDomain(
      await this.prisma.donation.findMany({
        where: { active: true },
        orderBy: { created_at: 'desc' },
        include: withCategory,
        skip,
        take,
      })
    );
  }

  countActives(): Promise<number> {
    return this.prisma.donation.count({ where: { active: true } });
  }

  async setStock(
    id: string,
    expectedQuantity: number,
    newQuantity: number,
    ctx: TransactionContext,
    includeInactive = false
  ): Promise<DonationWithCategory | null> {
    const client = resolvePrismaClient(this.prisma, ctx);
    const { count } = await client.donation.updateMany({
      where: { id, current_quantity: expectedQuantity, ...(includeInactive ? {} : { active: true }) },
      data: { current_quantity: newQuantity, available: newQuantity > 0 },
    });
    return count ? this.findById(id, ctx, includeInactive) : null;
  }
}
