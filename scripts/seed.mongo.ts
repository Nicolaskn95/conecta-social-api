import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import { EmployeeRole } from '../src/domain/enums';
import {
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

  console.log(`Conectando ao MongoDB em: ${mongoUri.replace(/:([^@]+)@/, ':****@')}`);
  await mongoose.connect(mongoUri);

  const EmployeeModel = mongoose.model<EmployeeDoc>(
    EmployeeDoc.name,
    EmployeeSchema
  );
  const CategoryModel = mongoose.model<CategoryDoc>(
    CategoryDoc.name,
    CategorySchema
  );

  const adminEmail = (process.env.ADMIN_EMAIL ?? 'admin@conecta.com').toLowerCase();
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

  const defaultCategories = [
    { name: 'Alimento não perecível', measure_unity: 'KG' },
    { name: 'Roupas', measure_unity: 'UN' },
    { name: 'Calçados', measure_unity: 'UN' },
    { name: 'Higiene pessoal', measure_unity: 'UN' },
    { name: 'Limpeza', measure_unity: 'UN' },
    { name: 'Variados', measure_unity: 'UN' },
  ];

  for (const category of defaultCategories) {
    const existing = await CategoryModel.findOne({ name: category.name });
    if (existing) {
      await CategoryModel.findByIdAndUpdate(existing._id, {
        $set: { ...category, active: true },
      });
    } else {
      await CategoryModel.create({
        _id: randomUUID(),
        ...category,
        active: true,
      });
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
