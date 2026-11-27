import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Donation, DonationWithCategory } from '@/domain/entities';
import {
  CreateDonationData,
  DonationRepository,
  UpdateDonationData,
} from '@/domain/repositories';
import { TransactionContext } from '@/domain/transaction/transaction-manager';
import { DonationDoc } from '../schemas';
import { toEntity, toDonationEntity } from '../mappers/to-entity';
import { resolveMongoSession } from '../mongo-transaction-manager';

@Injectable()
export class DonationMongoRepository extends DonationRepository {
  constructor(
    @InjectModel(DonationDoc.name)
    private readonly donationModel: Model<DonationDoc>
  ) {
    super();
  }

  private getLookupPipeline() {
    return [
      {
        $lookup: {
          from: 'categories',
          localField: 'category_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      {
        $unwind: {
          path: '$category',
          preserveNullAndEmptyArrays: true,
        },
      },
    ];
  }

  private mapDonationWithCategory(doc: any): DonationWithCategory {
    if (!doc) return null as unknown as DonationWithCategory;
    const donation = toDonationEntity<DonationWithCategory>(doc);
    if (donation.category) {
      donation.category = toEntity<any>(donation.category);
    }
    return donation as DonationWithCategory;
  }

  async create(data: CreateDonationData): Promise<DonationWithCategory> {
    const created = await this.donationModel.create({
      ...data,
      current_quantity: data.initial_quantity,
      active: data.active ?? true,
      available: data.available ?? data.initial_quantity > 0,
    });

    const populated = await this.findById(created._id);
    return populated!;
  }

  async findAll(): Promise<DonationWithCategory[]> {
    const docs = await this.donationModel.aggregate([
      { $match: { active: true } },
      ...this.getLookupPipeline(),
    ]);
    return docs.map((d) => this.mapDonationWithCategory(d));
  }

  async findAllActives(): Promise<DonationWithCategory[]> {
    const docs = await this.donationModel.aggregate([
      { $match: { active: true } },
      ...this.getLookupPipeline(),
    ]);
    return docs.map((d) => this.mapDonationWithCategory(d));
  }

  async findAllWithStock(): Promise<DonationWithCategory[]> {
    const docs = await this.donationModel.aggregate([
      {
        $match: {
          active: true,
          available: true,
          current_quantity: { $gt: 0 },
        },
      },
      ...this.getLookupPipeline(),
    ]);
    return docs.map((d) => this.mapDonationWithCategory(d));
  }

  async findById(
    id: string,
    ctx?: TransactionContext,
    includeInactive = false
  ): Promise<DonationWithCategory | null> {
    const session = resolveMongoSession(ctx);
    const docs = await this.donationModel.aggregate(
      [
        { $match: { _id: id, ...(includeInactive ? {} : { active: true }) } },
        ...this.getLookupPipeline(),
      ],
      { session }
    );

    if (!docs || docs.length === 0) {
      return null;
    }

    return this.mapDonationWithCategory(docs[0]);
  }

  async update(
    id: string,
    data: UpdateDonationData
  ): Promise<DonationWithCategory> {
    await this.donationModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .exec();

    const updated = await this.findById(id);
    return updated!;
  }

  async delete(id: string): Promise<void> {
    await this.donationModel
      .findByIdAndUpdate(id, { $set: { active: false } })
      .exec();
  }

  async findPaginated(
    skip: number,
    take: number
  ): Promise<DonationWithCategory[]> {
    const docs = await this.donationModel.aggregate([
      { $match: { active: true } },
      { $sort: { created_at: -1 } },
      { $skip: skip },
      { $limit: take },
      ...this.getLookupPipeline(),
    ]);
    return docs.map((d) => this.mapDonationWithCategory(d));
  }

  async countActives(): Promise<number> {
    return this.donationModel.countDocuments({ active: true }).exec();
  }

  async setStock(
    id: string,
    expectedQuantity: number,
    newQuantity: number,
    ctx: TransactionContext,
    includeInactive = false
  ): Promise<DonationWithCategory | null> {
    const result = await this.donationModel.updateOne(
      { _id: id, current_quantity: expectedQuantity, ...(includeInactive ? {} : { active: true }) },
      { $set: { current_quantity: newQuantity, available: newQuantity > 0 } },
      { session: resolveMongoSession(ctx) }
    ).exec();
    return result.matchedCount ? this.findById(id, ctx, includeInactive) : null;
  }
}
