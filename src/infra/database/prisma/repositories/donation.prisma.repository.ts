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
        data: { ...data, current_quantity: data.initial_quantity },
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

  async findById(id: string, ctx?: TransactionContext): Promise<DonationWithCategory | null> {
    const client = resolvePrismaClient(this.prisma, ctx);
    return toDomain(
      await client.donation.findFirst({
        where: { id, active: true },
        include: withCategory,
      })
    );
  }

  async update(id: string, data: UpdateDonationData): Promise<DonationWithCategory> {
    return toDomain(
      await this.prisma.donation.update({
        where: { id },
        data,
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

  async decrementStockIfAvailable(
    id: string,
    quantity: number,
    ctx?: TransactionContext
  ): Promise<Donation | null> {
    const client = resolvePrismaClient(this.prisma, ctx);

    const result = await client.donation.updateMany({
      where: { id, active: true, current_quantity: { gte: quantity } },
      data: { current_quantity: { decrement: quantity } },
    });

    if (result.count === 0) {
      return null;
    }

    const afterUpdate = await client.donation.findUnique({
      where: { id },
      select: { current_quantity: true },
    });

    return toDomain(
      await client.donation.update({
        where: { id },
        data: { available: (afterUpdate?.current_quantity ?? 0) > 0 },
      })
    );
  }

  async setStock(
    id: string,
    newQuantity: number,
    ctx?: TransactionContext
  ): Promise<DonationWithCategory> {
    const client = resolvePrismaClient(this.prisma, ctx);
    return toDomain(
      await client.donation.update({
        where: { id },
        data: { current_quantity: newQuantity, available: newQuantity > 0 },
        include: withCategory,
      })
    );
  }
}
