import { Injectable } from '@nestjs/common';
import { Category } from '@/domain/entities';
import {
  CategoryRepository,
  CreateCategoryData,
  UpdateCategoryData,
} from '@/domain/repositories';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CategoryPrismaRepository extends CategoryRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  create(data: CreateCategoryData): Promise<Category> {
    return this.prisma.category.create({ data });
  }

  findAll(): Promise<Category[]> {
    return this.prisma.category.findMany({ where: { active: true } });
  }

  findById(id: string): Promise<Category | null> {
    return this.prisma.category.findFirst({ where: { id, active: true } });
  }

  update(id: string, data: UpdateCategoryData): Promise<Category> {
    return this.prisma.category.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.category.update({
      where: { id },
      data: { active: false },
    });
  }
}
