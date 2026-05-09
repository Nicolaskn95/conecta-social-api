import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const employeeRoles = ['ADMIN', 'MANAGER', 'VOLUNTEER'] as const;
type EmployeeRole = (typeof employeeRoles)[number];

function getAdminRole(): EmployeeRole {
  const configuredRole = (process.env.ADMIN_ROLE ?? 'ADMIN').toUpperCase();

  if (!employeeRoles.includes(configuredRole as EmployeeRole)) {
    throw new Error(
      `ADMIN_ROLE inválido. Use um destes valores: ${employeeRoles.join(', ')}.`
    );
  }

  return configuredRole as EmployeeRole;
}

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    throw new Error(
      'ADMIN_PASSWORD precisa estar configurado para rodar o seed.'
    );
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@conecta.com';
  const adminName = process.env.ADMIN_NAME ?? 'Admin';
  const adminSurname = process.env.ADMIN_SURNAME ?? 'Root';
  const adminRole = getAdminRole();
  const password = await bcrypt.hash(adminPassword, 10);

  await prisma.employee.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      surname: adminSurname,
      password,
      role: adminRole,
      active: true,
    },
    create: {
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
    },
  });

  const defaultCategories = [
    { name: 'Alimento não perecível', measure_unity: 'KG' },
    { name: 'Roupas', measure_unity: 'UN' },
    { name: 'Calçados', measure_unity: 'UN' },
    { name: 'Higiene pessoal', measure_unity: 'UN' },
    { name: 'Limpeza', measure_unity: 'UN' },
  ];

  for (const category of defaultCategories) {
    const existing = await prisma.category.findFirst({
      where: { name: category.name },
    });

    if (existing) {
      await prisma.category.update({
        where: { id: existing.id },
        data: { ...category },
      });
    } else {
      await prisma.category.create({ data: { ...category } });
    }
  }

  console.log('✔ Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
