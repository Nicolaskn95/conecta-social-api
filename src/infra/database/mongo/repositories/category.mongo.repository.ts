import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from '@/domain/entities';
import {
  CategoryRepository,
  CreateCategoryData,
  UpdateCategoryData,
} from '@/domain/repositories';
import { CategoryDoc } from '../schemas';
import { toEntity, toEntityList } from '../mappers/to-entity';

@Injectable()
export class CategoryMongoRepository extends CategoryRepository {
  constructor(
    @InjectModel(CategoryDoc.name)
    private readonly categoryModel: Model<CategoryDoc>
  ) {
    super();
  }

  async create(data: CreateCategoryData): Promise<Category> {
    const created = await this.categoryModel.create({
      ...data,
      active: data.active ?? true,
    });
    return toEntity<Category>(created);
  }

  async findAll(): Promise<Category[]> {
    const docs = await this.categoryModel
      .find({ active: true })
      .lean()
      .exec();
    return toEntityList<Category>(docs);
  }

  async findById(id: string): Promise<Category | null> {
    const doc = await this.categoryModel
      .findOne({ _id: id, active: true })
      .lean()
      .exec();
    return doc ? toEntity<Category>(doc) : null;
  }

  async update(id: string, data: UpdateCategoryData): Promise<Category> {
    const updated = await this.categoryModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .lean()
      .exec();
    return toEntity<Category>(updated);
  }

  async delete(id: string): Promise<void> {
    await this.categoryModel
      .findByIdAndUpdate(id, { $set: { active: false } })
      .exec();
  }
}
