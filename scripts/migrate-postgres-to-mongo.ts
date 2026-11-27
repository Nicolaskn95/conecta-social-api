import { BeneficiaryDoc, BeneficiarySchema } from '../src/infra/database/mongo/schemas/beneficiary.schema';
import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import {
  ItemTypeDoc, ItemTypeSchema, NeedDoc, NeedSchema,
  AuditLogDoc,
  AuditLogSchema,
  CategoryDoc,
  CategorySchema,
  DonationDoc,
  DonationSchema,
  DonationStockAdjustmentDoc,
  DonationStockAdjustmentSchema,
  DonationToFamilyDoc,
  DonationToFamilySchema,
  EmployeeDoc,
  EmployeeSchema,
  EventDoc,
  EventSchema,
  FamilyDoc,
  FamilySchema,
} from '../src/infra/database/mongo/schemas';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const mongoUri =
    process.env.MONGODB_URI || 'mongodb://localhost:27017/conecta_social';

  console.log('--- INICIANDO MIGRAÇÃO POSTGRESQL -> MONGODB ---');
  console.log(`Conectando ao PostgreSQL...`);
  await prisma.$connect();
  console.log(`✔ Conectado ao PostgreSQL.`);

  console.log(
    `Conectando ao MongoDB em: ${mongoUri.replace(/:([^@]+)@/, ':****@')}...`
  );
  await mongoose.connect(mongoUri);
  console.log(`✔ Conectado ao MongoDB.`);

  const EmployeeModel = mongoose.model<EmployeeDoc>(
    EmployeeDoc.name,
    EmployeeSchema
  );
  const CategoryModel = mongoose.model<CategoryDoc>(
    CategoryDoc.name,
    CategorySchema
  );
  const FamilyModel = mongoose.model<FamilyDoc>(FamilyDoc.name, FamilySchema);
  const EventModel = mongoose.model<EventDoc>(EventDoc.name, EventSchema);
  const DonationModel = mongoose.model<DonationDoc>(
    DonationDoc.name,
    DonationSchema
  );
  const DonationToFamilyModel = mongoose.model<DonationToFamilyDoc>(
    DonationToFamilyDoc.name,
    DonationToFamilySchema
  );
  const StockAdjustmentModel = mongoose.model<DonationStockAdjustmentDoc>(
    DonationStockAdjustmentDoc.name,
    DonationStockAdjustmentSchema
  );
  const AuditLogModel = mongoose.model<AuditLogDoc>(
    AuditLogDoc.name,
    AuditLogSchema
  );

  const BeneficiaryModel = mongoose.model(BeneficiaryDoc.name, BeneficiarySchema);
  const ItemTypeModel = mongoose.model(ItemTypeDoc.name, ItemTypeSchema);
  const NeedModel = mongoose.model(NeedDoc.name, NeedSchema);

  const sourceTypes = await prisma.itemType.findMany();
  const sourceBeneficiaries = await prisma.beneficiary.findMany();
  const sourceCategories = await prisma.category.findMany();
  const targetTypes = await ItemTypeModel.find().select({ _id: 1, code: 1 }).lean();
  const targetTypeById = new Map(targetTypes.map((type) => [type._id, type]));
  const targetTypeByCode = new Map(targetTypes.map((type) => [type.code, type]));

  for (const type of sourceTypes) {
    const byCode = targetTypeByCode.get(type.code);
    const byId = targetTypeById.get(type.id);
    if ((byCode && byCode._id !== type.id) || (byId && byId.code !== type.code)) {
      throw new Error(`Conflito em item_types (${type.code}): origem ${type.id}, destino ${byCode?._id ?? byId?._id}.`);
    }
  }

  const referencedCategories = new Set(sourceTypes.map((type) => type.category_id));
  const targetCategories = await CategoryModel.find().select({ _id: 1, name: 1, measure_unity: 1 }).lean();
  for (const category of sourceCategories.filter(({ id }) => referencedCategories.has(id))) {
    const collision = targetCategories.find((target) =>
      (target._id !== category.id && target.name === category.name) ||
      (target._id === category.id && (target.name !== category.name || target.measure_unity !== category.measure_unity))
    );
    if (collision) {
      throw new Error(`Conflito em categories (${category.name}): origem ${category.id}, destino ${collision._id}.`);
    }
  }

  const destinationBeneficiaries = await BeneficiaryModel.find({ cpf: { $type: 'string' } }).select({ _id: 1, cpf: 1 }).lean();
  const beneficiaryByCpf = new Map(destinationBeneficiaries.map(({ _id, cpf }) => [cpf, _id]));
  for (const { id, cpf } of sourceBeneficiaries) {
    const targetId = cpf ? beneficiaryByCpf.get(cpf) : undefined;
    if (targetId && targetId !== id) {
      throw new Error(`Conflito em beneficiaries: origem ${id}, destino ${targetId}.`);
    }
  }

  const sourceAllocations = await prisma.donationToFamily.findMany();
  const targetAllocations = await DonationToFamilyModel.find({
    request_id: { $type: 'string' },
  }).select({ _id: 1, request_id: 1, request_fingerprint: 1 }).lean();
  const targetByAllocationId = new Map(targetAllocations.map((row) => [row._id, row]));
  const targetByRequest = new Map(targetAllocations.map((row) => [row.request_id, row]));
  for (const allocation of sourceAllocations) {
    const byId = targetByAllocationId.get(allocation.id);
    if (byId && byId.request_id !== allocation.request_id) {
      throw new Error(`Conflito em donations_to_family: a destinação ${allocation.id} tem outro request_id no destino.`);
    }
    if (!allocation.request_id) continue;
    const existing = targetByRequest.get(allocation.request_id);
    if (existing && (existing._id !== allocation.id ||
      (existing.request_fingerprint != null && existing.request_fingerprint !== allocation.request_fingerprint))) {
      throw new Error(`Conflito em donations_to_family por request_id: origem ${allocation.id}, destino ${existing._id}.`);
    }
  }

  const stats: Array<{
    Entidade: string;
    Postgres: number;
    MongoDB: number;
    Status: string;
  }> = [];

  async function migrateCollection(
    name: string,
    fetchPg: () => Promise<any[]>,
    model: mongoose.Model<any>,
    transform?: (item: any) => any
  ) {
    console.log(`\nMigrando ${name}...`);
    const pgRows = await fetchPg();

    if (pgRows.length === 0) {
      console.log(`  Nenhum registro encontrado em ${name} no Postgres.`);
    } else {
      const ops = pgRows.map((row) => {
        const doc = transform ? transform(row) : { ...row };
        const id = doc.id || doc._id;
        delete doc.id;
        doc._id = id;

        return {
          updateOne: {
            filter: { _id: id },
            update: { $set: doc },
            upsert: true,
          },
        };
      });

      // timestamps: false preserva created_at/updated_at vindos do Postgres
      const res = await model.bulkWrite(ops, { timestamps: false });
      console.log(
        `  Inseridos/Atualizados: ${res.upsertedCount + res.modifiedCount} registros.`
      );
    }

    const mongoCount = await model.countDocuments();
    stats.push({
      Entidade: name,
      Postgres: pgRows.length,
      MongoDB: mongoCount,
      Status: pgRows.length === mongoCount ? '✔ OK' : '⚠ DIVERGÊNCIA',
    });
  }

  // 1. Employees
  await migrateCollection(
    'employees',
    () => prisma.employee.findMany(),
    EmployeeModel
  );

  // 2. Categories
  await migrateCollection(
    'categories',
    async () => sourceCategories,
    CategoryModel
  );

  // 3. Families
  await migrateCollection(
    'families',
    () => prisma.family.findMany(),
    FamilyModel
  );

  await migrateCollection('beneficiaries', async () => sourceBeneficiaries, BeneficiaryModel);
  await migrateCollection('item_types', async () => sourceTypes, ItemTypeModel);
  await migrateCollection('needs', () => prisma.need.findMany(), NeedModel);

  // 4. Events
  await migrateCollection('events', () => prisma.event.findMany(), EventModel);

  // 5. Donations
  await migrateCollection(
    'donations',
    () => prisma.donation.findMany(),
    DonationModel
  );

  // 6. DonationsToFamily
  await migrateCollection(
    'donations_to_family',
    async () => sourceAllocations,
    DonationToFamilyModel
  );

  // 7. DonationStockAdjustments
  await migrateCollection(
    'donation_stock_adjustments',
    () => prisma.donationStockAdjustment.findMany(),
    StockAdjustmentModel
  );

  // 8. AuditLogs
  await migrateCollection(
    'audit_logs',
    () => prisma.auditLog.findMany(),
    AuditLogModel
  );

  console.log('\n--- RESUMO DA MIGRAÇÃO ---');
  console.table(stats);
  console.log('\n✔ Migração finalizada com sucesso!');
}

main()
  .catch((err) => {
    console.error('Erro na migração:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await mongoose.disconnect();
  });
