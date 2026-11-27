import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Need } from '@/domain/entities';
import { NeedStatus } from '@/domain/enums';
import {
  CreateNeedData,
  NeedFilter,
  NeedRepository,
  RecommendationNeed,
  NeedWriteData,
} from '@/domain/repositories/need.repository';
import { TransactionContext } from '@/domain/transaction/transaction-manager';
import { NeedDoc } from '../schemas';
import { resolveMongoSession } from '../mongo-transaction-manager';
import { toEntity } from '../mappers/to-entity';

function toNeed(doc: unknown): Need | null {
  const need = toEntity<Need>(doc);
  return need
    ? {
        ...need,
        id_beneficiary: need.id_beneficiary ?? null,
        item_type_id: need.item_type_id ?? null,
        description: need.description ?? null,
        requested_quantity: need.requested_quantity ?? null,
        specifications: need.specifications ?? null,
        created_by: need.created_by ?? null,
      }
    : null;
}

@Injectable()
export class NeedMongoRepository extends NeedRepository {
  constructor(
    @InjectModel(NeedDoc.name) private readonly model: Model<NeedDoc>
  ) {
    super();
  }

  async create(data: CreateNeedData, ctx: TransactionContext): Promise<Need> {
    const [doc] = await this.model.create([data], {
      session: resolveMongoSession(ctx),
    });
    return toNeed(doc);
  }

  async findById(id: string, ctx?: TransactionContext): Promise<Need | null> {
    const doc = await this.model
      .findById(id)
      .session(resolveMongoSession(ctx) ?? null)
      .lean()
      .exec();
    return toNeed(doc);
  }

  async list(filter: NeedFilter, skip: number, take: number): Promise<Need[]> {
    const rows = await this.model
      .find(filter)
      .sort({ created_at: -1, _id: -1 })
      .skip(skip)
      .limit(take)
      .lean()
      .exec();
    return rows.map(toNeed);
  }

  async listForRecommendation(typeId: string, skip: number, take: number): Promise<RecommendationNeed[]> {
    const rows = await this.model.aggregate([
      { $match: { status: NeedStatus.OPEN, item_type_id: { $in: [typeId, null] } } },
      { $sort: { created_at: 1, _id: 1 } },
      { $skip: skip },
      { $limit: take },
      { $lookup: { from: 'families', localField: 'id_family', foreignField: '_id', as: 'families' } },
      { $lookup: { from: 'beneficiaries', localField: 'id_beneficiary', foreignField: '_id', as: 'people' } },
      { $set: { family: { $arrayElemAt: ['$families', 0] }, beneficiary: { $arrayElemAt: ['$people', 0] } } },
      { $unset: ['families', 'people'] },
    ]).exec();
    return rows.map(row => ({
      ...toNeed(row)!,
      family: row.family ?? null,
      beneficiary: row.beneficiary ?? null,
    }));
  }

  count(filter: NeedFilter) {
    return this.model.countDocuments(filter).exec();
  }

  async updateOpen(
    id: string,
    version: number,
    data: NeedWriteData,
    ctx: TransactionContext
  ): Promise<Need | null> {
    const doc = await this.model
      .findOneAndUpdate(
        { _id: id, version, status: NeedStatus.OPEN },
        { $set: data, $inc: { version: 1 } },
        { session: resolveMongoSession(ctx), new: true, runValidators: true }
      )
      .lean()
      .exec();
    return toNeed(doc);
  }

  async moveOpenForBeneficiary(
    id: string,
    familyId: string,
    ctx: TransactionContext
  ): Promise<number> {
    const result = await this.model
      .updateMany(
        { id_beneficiary: id, status: NeedStatus.OPEN },
        { $set: { id_family: familyId }, $inc: { version: 1 } },
        { session: resolveMongoSession(ctx) }
      )
      .exec();
    return result.modifiedCount;
  }
}
