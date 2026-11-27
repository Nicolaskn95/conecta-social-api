import { Injectable } from '@nestjs/common';
import { ItemType } from '@/domain/entities';
import { ItemTypeRepository } from '@/domain/repositories/item-type.repository';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ItemTypePrismaRepository extends ItemTypeRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  findActive(categoryId?: string): Promise<ItemType[]> {
    return this.prisma.itemType.findMany({
      where: { active: true, category_id: categoryId, category: { active: true } },
    });
  }

  async findById(id: string): Promise<ItemType | null> {
    return this.prisma.itemType.findUnique({ where: { id } });
  }
}
