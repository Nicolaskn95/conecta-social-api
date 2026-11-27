import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Family } from '@/domain/entities';
import {
  CreateFamilyData,
  FamilyRepository,
  UpdateFamilyData,
} from '@/domain/repositories';
import { TransactionContext } from '@/domain/transaction/transaction-manager';
import { FamilyDoc } from '../schemas';
import { toFamilyEntity } from '../mappers/to-entity';
import { resolveMongoSession } from '../mongo-transaction-manager';

@Injectable()
export class FamilyMongoRepository extends FamilyRepository {
  constructor(
    @InjectModel(FamilyDoc.name)
    private readonly familyModel: Model<FamilyDoc>
  ) {
    super();
  }

  async create(data: CreateFamilyData): Promise<Family> {
    const created = await this.familyModel.create({
      ...data,
      active: data.active ?? true,
    });
    return toFamilyEntity(created);
  }

  async findAll(): Promise<Family[]> {
    const docs = await this.familyModel.find().lean().exec();
    return docs.map(toFamilyEntity);
  }

  async findAllActives(): Promise<Family[]> {
    const docs = await this.familyModel.find({ active: true }).lean().exec();
    return docs.map(toFamilyEntity);
  }

  async findById(id: string, ctx?: TransactionContext): Promise<Family | null> {
    const doc = await this.familyModel.findById(id).session(resolveMongoSession(ctx) ?? null).lean().exec();
    return doc ? toFamilyEntity(doc) : null;
  }

  async findActiveById(
    id: string,
    ctx?: TransactionContext
  ): Promise<Family | null> {
    const session = resolveMongoSession(ctx);
    const doc = await this.familyModel
      .findOne({ _id: id, active: true }, null, { session })
      .lean()
      .exec();
    return doc ? toFamilyEntity(doc) : null;
  }

  async update(id: string, data: UpdateFamilyData): Promise<Family> {
    const updated = await this.familyModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .lean()
      .exec();
    return toFamilyEntity(updated);
  }

  async softDelete(id: string): Promise<Family> {
    const updated = await this.familyModel
      .findByIdAndUpdate(id, { $set: { active: false } }, { new: true })
      .lean()
      .exec();
    return toFamilyEntity(updated);
  }

  async findPaginated(skip: number, take: number): Promise<Family[]> {
    const docs = await this.familyModel
      .find({ active: true })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(take)
      .lean()
      .exec();
    return docs.map(toFamilyEntity);
  }

  async countActives(): Promise<number> {
    return this.familyModel.countDocuments({ active: true }).exec();
  }
}
