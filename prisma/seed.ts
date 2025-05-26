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
      role: 'Administrador',
      cpf: '00000000000',
      email: 'admin@conecta.com',
      password,
      phone: '(11)99999-9999',
      cep: '00000-000',
      street: 'Rua Principal',
      neighborhood: 'Centro',
      number: '100',
      city: 'São Paulo',
      uf: 'SP',
      state: 'São Paulo',
      active: true,
    },
  });

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
