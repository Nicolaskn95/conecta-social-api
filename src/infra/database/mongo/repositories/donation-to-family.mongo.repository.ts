import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DonationToFamilyWithRelations } from '@/domain/entities';
import {
  CreateDonationToFamilyData,
  DonationToFamilyRepository,
} from '@/domain/repositories';
import { TransactionContext } from '@/domain/transaction/transaction-manager';
import { DonationToFamilyDoc } from '../schemas';
import { toEntity } from '../mappers/to-entity';
import { resolveMongoSession } from '../mongo-transaction-manager';

@Injectable()
export class DonationToFamilyMongoRepository extends DonationToFamilyRepository {
  constructor(
    @InjectModel(DonationToFamilyDoc.name)
    private readonly model: Model<DonationToFamilyDoc>
  ) {
    super();
  }

  private getLookupPipeline() {
    return [
      {
        $lookup: {
          from: 'donations',
          localField: 'id_donation',
          foreignField: '_id',
          as: 'donation',
        },
      },
      {
        $unwind: {
          path: '$donation',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'donation.category_id',
          foreignField: '_id',
          as: 'donation.category',
        },
      },
      {
        $unwind: {
          path: '$donation.category',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'families',
          localField: 'id_family',
          foreignField: '_id',
          as: 'family',
        },
      },
      {
        $unwind: {
          path: '$family',
          preserveNullAndEmptyArrays: true,
        },
      },
    ];
  }

  private mapRelations(doc: any): DonationToFamilyWithRelations {
    if (!doc) return null as unknown as DonationToFamilyWithRelations;
    const item = toEntity<any>(doc);
    if (item.donation) {
      item.donation = toEntity<any>(item.donation);
      if (item.donation.category) {
        item.donation.category = toEntity<any>(item.donation.category);
      }
    }
    if (item.family) {
      item.family = toEntity<any>(item.family);
    }
    return item as DonationToFamilyWithRelations;
  }

  async create(
    data: CreateDonationToFamilyData,
    ctx?: TransactionContext
  ): Promise<DonationToFamilyWithRelations> {
    const session = resolveMongoSession(ctx);

    const [created] = await this.model.create(
      [
        {
          ...data,
          active: true,
        },
      ],
      { session }
    );

    const docs = await this.model.aggregate(
      [{ $match: { _id: created._id } }, ...this.getLookupPipeline()],
      { session }
    );

    return this.mapRelations(docs[0]);
  }

  async findAll(): Promise<DonationToFamilyWithRelations[]> {
    const docs = await this.model.aggregate([
      ...this.getLookupPipeline(),
      { $sort: { created_at: -1 } },
    ]);
    return docs.map((d) => this.mapRelations(d));
  }

  async findAllActives(): Promise<DonationToFamilyWithRelations[]> {
    const docs = await this.model.aggregate([
      { $match: { active: true } },
      ...this.getLookupPipeline(),
      {
        $match: {
          'donation.active': true,
          'family.active': true,
        },
      },
      { $sort: { created_at: -1 } },
    ]);
    return docs.map((d) => this.mapRelations(d));
  }

  async findActiveById(
    id: string
  ): Promise<DonationToFamilyWithRelations | null> {
    const docs = await this.model.aggregate([
      { $match: { _id: id, active: true } },
      ...this.getLookupPipeline(),
    ]);

    if (!docs || docs.length === 0) {
      return null;
    }

    return this.mapRelations(docs[0]);
  }

  async findActivePaginated(
    skip: number,
    take: number
  ): Promise<DonationToFamilyWithRelations[]> {
    const docs = await this.model.aggregate([
      { $match: { active: true } },
      ...this.getLookupPipeline(),
      {
        $match: {
          'donation.active': true,
          'family.active': true,
        },
      },
      { $sort: { created_at: -1 } },
      { $skip: skip },
      { $limit: take },
    ]);
    return docs.map((d) => this.mapRelations(d));
  }

  async countActives(): Promise<number> {
    const result = await this.model.aggregate([
      { $match: { active: true } },
      ...this.getLookupPipeline(),
      {
        $match: {
          'donation.active': true,
          'family.active': true,
        },
      },
      { $count: 'total' },
    ]);

    return result.length > 0 ? result[0].total : 0;
  }
}
