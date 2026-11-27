import { PrismaClient, EmployeeRole } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { EmployeeSchema } from '../../src/infra/database/mongo/schemas/employee.schema';
import { dedicatedUrl } from './storage';

export const demoOperators = [
  { email: 'admin@example.test', role: EmployeeRole.ADMIN },
  { email: 'gestor@example.test', role: EmployeeRole.MANAGER },
  { email: 'voluntario@example.test', role: EmployeeRole.VOLUNTEER },
];

export async function provisionOperators(provider: 'postgres' | 'mongo') {
  const uri = dedicatedUrl(provider);
  const secret = process.env.SYNTHETIC_PASSWORD;
  if (
    !secret ||
    Buffer.byteLength(secret, 'utf8') < 12 ||
    Buffer.byteLength(secret, 'utf8') > 72
  )
    throw new Error(
      'Configure SYNTHETIC_PASSWORD com 12 a 72 bytes para os operadores fictícios.'
    );
  const password = await bcrypt.hash(secret, 10);
  const prisma =
    provider === 'postgres' ? new PrismaClient({ datasourceUrl: uri }) : null;
  const mongo = provider === 'mongo' ? mongoose.createConnection(uri) : null;
  try {
    if (mongo) await mongo.asPromise();
    const model = mongo?.model('SyntheticEmployee', EmployeeSchema);
    await model?.init();
    for (const [index, operator] of demoOperators.entries()) {
      const data = {
        ...operator,
        password,
        name: 'Operador',
        surname: 'de teste',
        birth_date: new Date('1990-01-01T00:00:00Z'),
        cpf: String(index + 1).padStart(11, '0'),
        phone: '00000000000',
        street: 'Rua fictícia',
        number: '1',
        cep: '00000-000',
        city: 'Cidade fictícia',
        neighborhood: 'Setor fictício',
        state: 'SP',
        active: true,
      };
      if (prisma)
        await prisma.employee.upsert({
          where: { email: operator.email },
          create: data,
          update: { password, active: true, role: operator.role },
        });
      else
        await model!.updateOne(
          { email: operator.email },
          {
            $set: { password, active: true, role: operator.role },
            $setOnInsert: {
              ...Object.fromEntries(
                Object.entries(data).filter(
                  ([key]) => !['password', 'active', 'role'].includes(key)
                )
              ),
              _id: randomUUID(),
            },
          },
          { upsert: true, runValidators: true }
        );
    }
    return demoOperators;
  } finally {
    await prisma?.$disconnect();
    await mongo?.close();
  }
}
