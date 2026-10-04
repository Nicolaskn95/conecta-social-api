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
import { toEntity, toEntityList } from '../mappers/to-entity';
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
    const donation = toEntity<any>(doc);
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
    ctx?: TransactionContext
  ): Promise<DonationWithCategory | null> {
    const session = resolveMongoSession(ctx);
    const docs = await this.donationModel.aggregate(
      [
        { $match: { _id: id, active: true } },
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

  async decrementStockIfAvailable(
    id: string,
    quantity: number,
    ctx?: TransactionContext
  ): Promise<Donation | null> {
    const session = resolveMongoSession(ctx);

    const updated = await this.donationModel.findOneAndUpdate(
      {
        _id: id,
        active: true,
        current_quantity: { $gte: quantity },
      },
      {
        $inc: { current_quantity: -quantity },
      },
      { new: true, session }
    );

    if (!updated) {
      return null;
    }

    const available = updated.current_quantity > 0;
    if (updated.available !== available) {
      updated.available = available;
      await updated.save({ session });
    }

    return toEntity<Donation>(updated);
  }

  async setStock(
    id: string,
    newQuantity: number,
    ctx?: TransactionContext
  ): Promise<DonationWithCategory> {
    const session = resolveMongoSession(ctx);

    await this.donationModel.findByIdAndUpdate(
      id,
      {
        $set: {
          current_quantity: newQuantity,
          available: newQuantity > 0,
        },
      },
      { new: true, session }
    );

    const updated = await this.findById(id, ctx);
    return updated!;
  }
}
