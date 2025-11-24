import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('admin123', 10);

  await prisma.employee.upsert({
    where: { email: 'admin@conecta.com' },
    update: {},
    create: {
      name: 'Admin',
      surname: 'Root',
      birth_date: new Date('1990-01-01'),
      role: 'ADMIN',
      cpf: '00000000000',
      email: 'admin@conecta.com',
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
