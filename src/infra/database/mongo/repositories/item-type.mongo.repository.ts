import { Injectable } from '@nestjs/common';
import { ItemType } from '@/domain/entities';
import { ItemTypeRepository } from '@/domain/repositories/item-type.repository';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CategoryDoc, ItemTypeDoc } from '../schemas';
import { toEntity } from '../mappers/to-entity';

@Injectable()
export class ItemTypeMongoRepository extends ItemTypeRepository {
  constructor(
    @InjectModel(ItemTypeDoc.name) private readonly model: Model<ItemTypeDoc>,
    @InjectModel(CategoryDoc.name) private readonly categories: Model<CategoryDoc>
  ) {
    super();
  }

  async findActive(categoryId?: string): Promise<ItemType[]> {
    const categoryIds = await this.categories.distinct('_id', {
      active: true,
      ...(categoryId ? { _id: categoryId } : {}),
    }).exec();
    const rows = await this.model.find({ active: true, category_id: { $in: categoryIds } }).lean().exec();
    return rows.map((row) => toEntity<ItemType>(row));
  }

  async findById(id: string): Promise<ItemType | null> {
    return toEntity<ItemType>(await this.model.findById(id).lean().exec());
  }
}
