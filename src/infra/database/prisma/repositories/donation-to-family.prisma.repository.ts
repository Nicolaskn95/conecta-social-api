import { Injectable } from '@nestjs/common';
import { DonationToFamilyWithRelations } from '@/domain/entities';
import {
  CreateDonationToFamilyData,
  DonationToFamilyRepository,
} from '@/domain/repositories';
import { TransactionContext } from '@/domain/transaction/transaction-manager';
import { PrismaService } from '../prisma.service';
import { resolvePrismaClient, toDomain } from '../prisma-transaction-manager';

const relations = {
  donation: { include: { category: true } },
  family: true,
} as const;

const activeWhere = {
  active: true,
  donation: { active: true },
  family: { active: true },
};

@Injectable()
export class DonationToFamilyPrismaRepository extends DonationToFamilyRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
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

  async findActiveById(id: string): Promise<DonationToFamilyWithRelations | null> {
    return toDomain(
      await this.prisma.donationToFamily.findFirst({
        where: { id, active: true },
        include: relations,
      })
    );
  }

  async findActivePaginated(skip: number, take: number): Promise<DonationToFamilyWithRelations[]> {
    return toDomain(
      await this.prisma.donationToFamily.findMany({
        where: activeWhere,
        include: relations,
        orderBy: { created_at: 'desc' },
        skip,
        take,
      })
    );
  }

  countActives(): Promise<number> {
    return this.prisma.donationToFamily.count({ where: activeWhere });
  }
}
