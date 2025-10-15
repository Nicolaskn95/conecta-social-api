import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const testPassword = await bcrypt.hash('admin123', 10);

  // Usuário Admin
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
      password: adminPassword,
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

  // Usuário de Teste - Nicolas Nagano
  await prisma.employee.upsert({
    where: { email: 'nicolaskn95@yopmail.com' },
    update: {},
    create: {
      name: 'Nicolas',
      surname: 'Nagano',
      birth_date: new Date('1995-01-01'),
      role: 'VOLUNTEER',
      cpf: '12345678901',
      email: 'nicolaskn95@yopmail.com',
      password: testPassword,
      phone: '(11)98765-4321',
      cep: '01234-567',
      street: 'Rua das Flores',
      neighborhood: 'Jardim das Américas',
      number: '123',
      city: 'São Paulo',
      state: 'São Paulo',
      active: true,
    },
  });

  console.log('✔ Seed completed.');
  console.log(
    '✔ Usuário de teste criado: Nicolas Nagano (nicolaskn95@yopmail.com)'
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
