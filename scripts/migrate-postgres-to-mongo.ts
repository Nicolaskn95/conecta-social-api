import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import {
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

      const res = await model.bulkWrite(ops);
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
    () => prisma.category.findMany(),
    CategoryModel
  );

  // 3. Families
  await migrateCollection(
    'families',
    () => prisma.family.findMany(),
    FamilyModel
  );

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
    () => prisma.donationToFamily.findMany(),
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
