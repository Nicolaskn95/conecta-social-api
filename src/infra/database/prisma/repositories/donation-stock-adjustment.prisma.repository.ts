import { Injectable } from '@nestjs/common';
import {
  DonationStockAdjustment,
  DonationStockAdjustmentWithEmployee,
} from '@/domain/entities';
import {
  CreateDonationStockAdjustmentData,
  DonationStockAdjustmentRepository,
} from '@/domain/repositories';
import { TransactionContext } from '@/domain/transaction/transaction-manager';
import { PrismaService } from '../prisma.service';
import { resolvePrismaClient, toDomain } from '../prisma-transaction-manager';

@Injectable()
export class DonationStockAdjustmentPrismaRepository extends DonationStockAdjustmentRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(
    data: CreateDonationStockAdjustmentData,
    ctx?: TransactionContext
  ): Promise<DonationStockAdjustment> {
    const client = resolvePrismaClient(this.prisma, ctx);
    return toDomain(await client.donationStockAdjustment.create({ data }));
  }

  async findByDonation(donationId: string): Promise<DonationStockAdjustmentWithEmployee[]> {
    return toDomain(
      await this.prisma.donationStockAdjustment.findMany({
        where: { id_donation: donationId },
        include: {
          employee: {
            select: { id: true, name: true, surname: true, role: true },
          },
        },
        orderBy: { created_at: 'desc' },
      })
    );
  }
}
