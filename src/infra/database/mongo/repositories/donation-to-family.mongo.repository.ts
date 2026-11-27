import { DonationAllocationStatus } from '@/domain/enums';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { DonationToFamilyWithRelations } from '@/domain/entities';
import {
  AllocationFilter,
  AllocationTransition,
  CreateDonationToFamilyData,
  DonationToFamilyRepository,
} from '@/domain/repositories';
import { TransactionContext } from '@/domain/transaction/transaction-manager';
import { DonationToFamilyDoc, NeedDoc } from '../schemas';
import {
  toEntity,
  toDonationEntity,
  toFamilyEntity,
  toAllocationEntity,
} from '../mappers/to-entity';
import { resolveMongoSession } from '../mongo-transaction-manager';

@Injectable()
export class DonationToFamilyMongoRepository extends DonationToFamilyRepository {
  constructor(
    @InjectModel(DonationToFamilyDoc.name)
    private readonly model: Model<DonationToFamilyDoc>,
    @InjectModel(NeedDoc.name) private readonly needs: Model<NeedDoc>
  ) {
    super();
  }

  private matchingPipeline(filter: AllocationFilter): PipelineStage[] {
    const { status, delivery_mode, family_id, beneficiary_id } = filter;
    const stages: PipelineStage[] = [
      {
        $match: {
          active: true,
          ...(status === DonationAllocationStatus.UNKNOWN
            ? { status: { $in: [null, DonationAllocationStatus.UNKNOWN] } }
            : status && { status }),
          ...(delivery_mode && { delivery_mode }),
          ...(family_id && { id_family: family_id }),
          ...(beneficiary_id && { id_beneficiary: beneficiary_id }),
        },
      },
      ...this.getLookupPipeline(),
    ];
    if (status !== DonationAllocationStatus.WAITING_RECEIPT) {
      stages.push({
        $match: { 'donation.active': true, 'family.active': true },
      });
    }
    return stages;
  }

  private getLookupPipeline(): PipelineStage[] {
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
      {
        $lookup: {
          from: 'beneficiaries',
          let: { beneficiaryId: '$id_beneficiary' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$beneficiaryId'] } } },
            {
              $project: { _id: 0, id: '$_id', name: 1, surname: 1, active: 1 },
            },
          ],
          as: 'beneficiary',
        },
      },
      {
        $set: {
          beneficiary: {
            $ifNull: [{ $arrayElemAt: ['$beneficiary', 0] }, null],
          },
        },
      },
    ];
  }

  private mapRelations(doc: any): DonationToFamilyWithRelations {
    if (!doc) return null as unknown as DonationToFamilyWithRelations;
    const item = toAllocationEntity(doc);
    if (item.donation) {
      item.donation = toDonationEntity(item.donation);
      if (item.donation.category) {
        item.donation.category = toEntity<any>(item.donation.category);
      }
    }
    if (item.family) {
      item.family = toFamilyEntity(item.family);
    }
    return item as DonationToFamilyWithRelations;
  }

  async needQuantities(id: string, ctx?: TransactionContext) {
    return (await this.needQuantitiesFor([id], ctx)).get(id) ?? {
      received_quantity: 0,
      separated_quantity: 0,
    };
  }

  async needQuantitiesFor(ids: string[], ctx?: TransactionContext) {
    const totals = new Map<string, { received_quantity: number; separated_quantity: number }>();
    if (!ids.length) return totals;
    const rows = await this.model
      .aggregate<{
        _id: { id: string; status: DonationAllocationStatus };
        quantity: number;
      }>([{ $match: { id_need: { $in: ids }, status: { $in: [DonationAllocationStatus.COMPLETED, DonationAllocationStatus.WAITING_RECEIPT] } } }, { $group: { _id: { id: '$id_need', status: '$status' }, quantity: { $sum: '$quantity' } } }], { session: resolveMongoSession(ctx) })
      .exec();
    for (const row of rows) {
      const id = row._id.id;
      if (!id) continue;
      const quantities = totals.get(id) ?? { received_quantity: 0, separated_quantity: 0 };
      if (row._id.status === DonationAllocationStatus.COMPLETED) quantities.received_quantity = row.quantity;
      else quantities.separated_quantity = row.quantity;
      totals.set(id, quantities);
    }
    return totals;
  }

  async findWaitingForBeneficiary(
    id: string,
    ctx: TransactionContext
  ): Promise<string | null> {
    const session = resolveMongoSession(ctx);
    const needIds = await this.needs
      .distinct('_id', { id_beneficiary: id })
      .session(session)
      .exec();
    const allocation = await this.model
      .findOne(
        {
          $or: [{ id_beneficiary: id }, { id_need: { $in: needIds } }],
          status: DonationAllocationStatus.WAITING_RECEIPT,
        },
        { _id: 1 },
        { session }
      )
      .lean()
      .exec();
    return allocation?._id ?? null;
  }

  async findByRequestId(requestId: string) {
    const [doc] = await this.model
      .aggregate([
        { $match: { request_id: requestId } },
        ...this.getLookupPipeline(),
      ])
      .exec();
    return doc ? this.mapRelations(doc) : null;
  }

  async transition(
    id: string,
    from: DonationAllocationStatus,
    data: AllocationTransition,
    ctx: TransactionContext
  ) {
    const status =
      from === DonationAllocationStatus.UNKNOWN ? { $in: [null, from] } : from;
    const result = await this.model
      .updateOne(
        { _id: id, active: true, status },
        { $set: data },
        { session: resolveMongoSession(ctx) }
      )
      .exec();
    return result.matchedCount ? this.findActiveById(id, ctx) : null;
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
    id: string,
    ctx?: TransactionContext
  ): Promise<DonationToFamilyWithRelations | null> {
    const docs = await this.model.aggregate(
      [{ $match: { _id: id, active: true } }, ...this.getLookupPipeline()],
      { session: resolveMongoSession(ctx) }
    );

    if (!docs || docs.length === 0) {
      return null;
    }

    return this.mapRelations(docs[0]);
  }

  async findActivePaginated(
    skip: number,
    take: number,
    filter: AllocationFilter
  ) {
    const order: PipelineStage[] =
      filter.status === DonationAllocationStatus.WAITING_RECEIPT
        ? [
            {
              $addFields: {
                separation_order: { $ifNull: ['$separated_at', '$created_at'] },
              },
            },
            { $sort: { separation_order: 1, _id: 1 } },
            { $unset: 'separation_order' },
          ]
        : [{ $sort: { created_at: -1, _id: -1 } }];
    const docs = await this.model
      .aggregate([
        ...this.matchingPipeline(filter),
        ...order,
        { $skip: skip },
        { $limit: take },
      ])
      .exec();
    return docs.map((doc) => this.mapRelations(doc));
  }

  async countActives(filter: AllocationFilter): Promise<number> {
    const [result] = await this.model
      .aggregate([...this.matchingPipeline(filter), { $count: 'total' }])
      .exec();
    return result?.total ?? 0;
  }
}
