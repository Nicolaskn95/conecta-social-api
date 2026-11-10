import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BeneficiaryDoc } from '../schemas/beneficiary.schema';
import { FamilyDoc } from '../schemas/family.schema';
import { toEntity } from '../mappers/to-entity';
import { resolveMongoSession } from '../mongo-transaction-manager';
import { TransactionContext } from '@/domain/transaction/transaction-manager';
import { Beneficiary, BeneficiaryData, BeneficiaryFilter, BeneficiaryRepository } from '@/modules/beneficiary/beneficiary.repository';

function whereFor(filter: BeneficiaryFilter): Record<string, unknown> {
  const where: Record<string, unknown> = {};
  if (!filter.include_inactive) where.active = true;
  if (filter.family_id) where.id_family = filter.family_id;
  if (filter.has_disability !== undefined) where.has_disability = filter.has_disability;
  const search = filter.search?.trim();
  if (search) {
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const digits = search.replace(/\D/g, '');
    where.$or = ['name', 'surname', 'rg', 'email', 'phone', 'gender', 'disability_details']
      .map(key => ({ [key]: regex }));
    if (digits) (where.$or as object[]).push({ cpf: { $regex: digits } });
  }
  return where;
}

@Injectable()
export class BeneficiaryMongoRepository extends BeneficiaryRepository {
  constructor(
    @InjectModel(BeneficiaryDoc.name) private readonly model: Model<BeneficiaryDoc>,
    @InjectModel(FamilyDoc.name) private readonly families: Model<FamilyDoc>,
  ) { super(); }

  private async withFamily(doc: any, ctx?: TransactionContext): Promise<Beneficiary> {
    const entity = toEntity<Beneficiary>(doc);
    const family = await this.families.findById(entity.id_family).session(resolveMongoSession(ctx) ?? null).lean().exec();
    entity.family = family ? toEntity(family) : null;
    return entity;
  }
  async create(data: BeneficiaryData, ctx: TransactionContext) {
    const [doc] = await this.model.create([data], { session: resolveMongoSession(ctx) });
    return this.withFamily(doc, ctx);
  }
  async update(id: string, data: Partial<BeneficiaryData>, ctx: TransactionContext) {
    const doc = await this.model.findOneAndUpdate({ _id: id, active: true }, { $set: data }, { new: true, session: resolveMongoSession(ctx) }).lean().exec();
    if (!doc) throw new Error('Beneficiário não encontrado.');
    return this.withFamily(doc, ctx);
  }
  async findById(id: string, ctx?: TransactionContext) {
    const doc = await this.model.findOne({ _id: id, active: true }).session(resolveMongoSession(ctx) ?? null).lean().exec();
    return doc ? this.withFamily(doc, ctx) : null;
  }
  async findAll(filter: BeneficiaryFilter, skip?: number, take?: number) {
    let query = this.model.find(whereFor(filter)).sort({ created_at: -1 });
    if (skip !== undefined) query = query.skip(skip);
    if (take !== undefined) query = query.limit(take);
    return Promise.all((await query.lean().exec()).map(doc => this.withFamily(doc)));
  }
  count(filter: BeneficiaryFilter) { return this.model.countDocuments(whereFor(filter)).exec(); }
  async suggestions(search: string | undefined, limit: number) {
    const regex = search ? new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : undefined;
    const values = await this.model.distinct('disability_details', {
      active: true, has_disability: true, disability_details: regex ? { $type: 'string', $regex: regex } : { $type: 'string' },
    });
    return values.map(value => value.trim()).filter(Boolean).sort().slice(0, limit);
  }
}
