import {
  defaultCategories,
  initialItemTypes,
} from '../src/domain/donation-catalog';
import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import { EmployeeRole } from '../src/domain/enums';
import {
  ItemTypeDoc,
  ItemTypeSchema,
  CategoryDoc,
  CategorySchema,
  EmployeeDoc,
  EmployeeSchema,
} from '../src/infra/database/mongo/schemas';

dotenv.config();

const employeeRoles = ['ADMIN', 'MANAGER', 'VOLUNTEER'] as const;
type ConfiguredRole = (typeof employeeRoles)[number];

function getAdminRole(): EmployeeRole {
  const configuredRole = (process.env.ADMIN_ROLE ?? 'ADMIN').toUpperCase();
  if (!employeeRoles.includes(configuredRole as ConfiguredRole)) {
    throw new Error(
      `ADMIN_ROLE inválido. Use um destes valores: ${employeeRoles.join(', ')}.`
    );
  }
  return configuredRole as unknown as EmployeeRole;
}

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
  if (!process.env.ADMIN_PASSWORD) {
    console.warn(
      '⚠️ ADMIN_PASSWORD não encontrado no .env. Utilizando senha padrão para desenvolvimento local: Admin@123'
    );
  }

  const mongoUri =
    process.env.MONGODB_URI || 'mongodb://localhost:27017/conecta_social';

  console.log(
    `Conectando ao MongoDB em: ${mongoUri.replace(/:([^@]+)@/, ':****@')}`
  );
  await mongoose.connect(mongoUri);

  const EmployeeModel = mongoose.model<EmployeeDoc>(
    EmployeeDoc.name,
    EmployeeSchema
  );
  const CategoryModel = mongoose.model<CategoryDoc>(
    CategoryDoc.name,
    CategorySchema
  );

  const ItemTypeModel = mongoose.model<ItemTypeDoc>(
    ItemTypeDoc.name,
    ItemTypeSchema
  );

  const adminEmail = (
    process.env.ADMIN_EMAIL ?? 'admin@conecta.com'
  ).toLowerCase();
  const adminName = process.env.ADMIN_NAME ?? 'Admin';
  const adminSurname = process.env.ADMIN_SURNAME ?? 'Root';
  const adminRole = getAdminRole();
  const password = await bcrypt.hash(adminPassword, 10);

  const existingAdmin = await EmployeeModel.findOne({ email: adminEmail });

  if (existingAdmin) {
    await EmployeeModel.findByIdAndUpdate(existingAdmin._id, {
      $set: {
        name: adminName,
        surname: adminSurname,
        password,
        role: adminRole,
        active: true,
      },
    });
    console.log(`✔ Admin ${adminEmail} atualizado.`);
  } else {
    await EmployeeModel.create({
      _id: randomUUID(),
      name: adminName,
      surname: adminSurname,
      birth_date: new Date('1990-01-01'),
      role: adminRole,
      cpf: '00000000000',
      email: adminEmail,
      password,
      phone: '(11)99999-9999',
      cep: '00000-000',
      street: 'Rua Principal',
      neighborhood: 'Centro',
      number: '100',
      city: 'São Paulo',
      state: 'São Paulo',
      active: true,
    });
    console.log(`✔ Admin ${adminEmail} criado.`);
  }

  const categoryIds = new Map<string, string>();
  for (const category of defaultCategories) {
    const matches = await CategoryModel.find({ name: category.name });
    const usedByCatalog = initialItemTypes.some(
      (type) => type.category === category.name
    );
    const existing = matches[0];
    if (
      usedByCatalog &&
      (matches.length > 1 ||
        (existing && existing.measure_unity !== category.measure_unity))
    ) {
      throw new Error(
        `Categoria com nome ou unidade em conflito: ${category.name}.`
      );
    }
    const saved = existing
      ? await CategoryModel.findByIdAndUpdate(
          existing._id,
          { $set: { active: true } },
          { new: true }
        )
      : await CategoryModel.create({ ...category, active: true });
    categoryIds.set(category.name, saved._id);
  }

  await ItemTypeModel.init();
  for (const { category, ...type } of initialItemTypes) {
    const data = {
      ...type,
      category_id: categoryIds.get(category),
      active: true,
    };
    try {
      await ItemTypeModel.updateOne(
        { code: type.code },
        { $set: data, $setOnInsert: { _id: randomUUID() } },
        { upsert: true, runValidators: true }
      );
    } catch (error) {
      if (
        !(error instanceof mongoose.mongo.MongoServerError) ||
        error.code !== 11000
      ) {
        throw error;
      }
      const result = await ItemTypeModel.updateOne(
        { code: type.code },
        { $set: data },
        { runValidators: true }
      );
      if (!result.matchedCount) throw error;
    }
  }

  console.log('✔ Seed MongoDB concluído com sucesso.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
