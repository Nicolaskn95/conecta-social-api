import { Injectable } from '@nestjs/common';
import { Family } from '@/domain/entities';
import {
  CreateFamilyData,
  FamilyRepository,
  UpdateFamilyData,
} from '@/domain/repositories';
import { TransactionContext } from '@/domain/transaction/transaction-manager';
import { PrismaService } from '../prisma.service';
import { resolvePrismaClient, toDomain } from '../prisma-transaction-manager';

@Injectable()
export class FamilyPrismaRepository extends FamilyRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(data: CreateFamilyData): Promise<Family> {
    return toDomain(
      await this.prisma.family.create({
        data: { ...data, active: data.active ?? true },
      })
    );
  }

  async findAll(): Promise<Family[]> {
    return toDomain(await this.prisma.family.findMany());
  }

  async findAllActives(): Promise<Family[]> {
    return toDomain(await this.prisma.family.findMany({ where: { active: true } }));
  }

  async findById(id: string): Promise<Family | null> {
    return toDomain(await this.prisma.family.findUnique({ where: { id } }));
  }

  async findActiveById(id: string, ctx?: TransactionContext): Promise<Family | null> {
    const client = resolvePrismaClient(this.prisma, ctx);
    return toDomain(await client.family.findFirst({ where: { id, active: true } }));
  }

  async update(id: string, data: UpdateFamilyData): Promise<Family> {
    return toDomain(await this.prisma.family.update({ where: { id }, data }));
  }

  async softDelete(id: string): Promise<Family> {
    return toDomain(
      await this.prisma.family.update({
        where: { id },
        data: { active: false },
      })
    );
  }

  async findPaginated(skip: number, take: number): Promise<Family[]> {
    return toDomain(
      await this.prisma.family.findMany({
        where: { active: true },
        orderBy: { created_at: 'desc' },
        skip,
        take,
      })
    );
  }

  countActives(): Promise<number> {
    return this.prisma.family.count({ where: { active: true } });
  }
}
