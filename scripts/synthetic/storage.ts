import { Prisma, PrismaClient } from '@prisma/client';
import mongoose, { Schema } from 'mongoose';
import * as schemas from '../../src/infra/database/mongo/schemas';
import { BeneficiarySchema } from '../../src/infra/database/mongo/schemas/beneficiary.schema';
import { separableNeedBalance } from '../../src/domain/need-coverage';
import { validItemSpecifications } from '../../src/domain/item-specifications';
import {
  digest,
  defaultCategoryId,
  type Lot,
  type Row,
  type Table,
  type Rows,
  tables,
} from './generate';

const mongoSchemas: Record<Table, Schema> = {
  categories: schemas.CategorySchema,
  item_types: schemas.ItemTypeSchema,
  families: schemas.FamilySchema,
  beneficiaries: BeneficiarySchema,
  needs: schemas.NeedSchema,
  donations: schemas.DonationSchema,
  donations_to_family: schemas.DonationToFamilySchema,
};
type Delegate = {
  createMany(args: {
    data: Record<string, unknown>[];
    skipDuplicates: boolean;
  }): Promise<unknown>;
  findMany(): Promise<Record<string, unknown>[]>;
};
const prismaDelegates: Record<Table, keyof PrismaClient> = {
  categories: 'category',
  item_types: 'itemType',
  families: 'family',
  beneficiaries: 'beneficiary',
  needs: 'need',
  donations: 'donation',
  donations_to_family: 'donationToFamily',
};

export function dedicatedUrl(provider: 'postgres' | 'mongo') {
  const uri =
    provider === 'postgres'
      ? process.env.SYNTHETIC_DATABASE_URL
      : process.env.SYNTHETIC_MONGODB_URI;
  if (!uri) throw new Error('Configure a conexão explícita da base sintética.');
  const target = new URL(uri);
  const protocol =
    provider === 'postgres' ? /^postgres(?:ql)?:$/ : /^mongodb(?:\+srv)?:$/;
  if (
    !protocol.test(target.protocol) ||
    !/^\/conecta_synthetic_[a-z0-9_]+$/.test(target.pathname)
  )
    throw new Error(
      'A conexão deve apontar para uma base dedicada conecta_synthetic_*.'
    );
  if (provider === 'mongo' && target.searchParams.has('dbName'))
    throw new Error('Informe a base Mongo no caminho da conexão.');
  return uri;
}

function prepare(row: Row, pg: boolean) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => {
      if (pg && key === 'specifications' && value === null)
        return [key, Prisma.DbNull];
      return [
        key,
        typeof value === 'string' &&
        (key.endsWith('_at') || key.endsWith('_date'))
          ? new Date(value)
          : value,
      ];
    })
  );
}

function project(actual: Record<string, unknown>, expected: Row): Row {
  return Object.fromEntries(
    Object.keys(expected).map((key) => {
      const value = actual[key];
      return [
        key,
        value instanceof Date ? value.toISOString() : (value ?? null),
      ];
    })
  ) as Row;
}

export function validate(lot: Lot, rows: Rows) {
  const index = (table: Table) =>
    new Map(rows[table].map((row) => [row.id, row]));
  const families = index('families'),
    people = index('beneficiaries'),
    types = index('item_types');
  const categories = index('categories'),
    donations = index('donations'),
    needs = index('needs');
  const restocked = new Set(lot.restocked);
  const totals = new Map<
    string,
    { received_quantity: number; separated_quantity: number }
  >();
  const consumed = new Map<string, number>();
  const fail = (message: string) => {
    throw new Error(message);
  };
  for (const table of tables) {
    if (index(table).size !== rows[table].length)
      fail('IDs duplicados em ' + table);
    for (const row of rows[table]) {
      const timeFields = Object.entries(row).filter(
        ([key, value]) => key.endsWith('_at') && value !== null
      );
      if (
        timeFields.some(
          ([, value]) =>
            !Number.isFinite(Date.parse(String(value))) ||
            String(value) > lot.manifest.cutoff
        )
      )
        fail('Data inválida no registro ' + row.id);
    }
  }
  for (const person of people.values())
    if (!families.has(String(person.id_family))) fail('Pessoa sem família');
  for (const type of types.values())
    if (!categories.has(String(type.category_id))) fail('Tipo sem categoria');
  for (const a of rows.donations_to_family) {
    const donation = donations.get(String(a.id_donation));
    const need = a.id_need ? needs.get(String(a.id_need)) : undefined;
    if (
      !donation ||
      !families.has(String(a.id_family)) ||
      (a.id_need &&
        (!need ||
          need.id_family !== a.id_family ||
          need.id_beneficiary !== a.id_beneficiary))
    )
      fail('Destinação sem vínculo válido ' + a.id);
    if (
      (a.status === 'COMPLETED') !== !!a.confirmed_at ||
      (a.status === 'CANCELED') !== !!a.canceled_at ||
      (a.status !== 'UNKNOWN') !== !!a.separated_at ||
      (restocked.has(a.id) && a.status !== 'CANCELED') ||
      (a.received_at &&
        (String(a.received_at) < String(a.separated_at) ||
          String(a.received_at) > String(a.confirmed_at))) ||
      ((a.confirmed_at || a.canceled_at) &&
        String(a.confirmed_at ?? a.canceled_at) < String(a.separated_at))
    )
      fail('Datas ou estado inválidos na destinação ' + a.id);
    const quantity = Number(a.quantity);
    if (!Number.isInteger(quantity) || quantity < 1)
      fail('Quantidade inválida');
    if (!restocked.has(a.id))
      consumed.set(
        String(a.id_donation),
        (consumed.get(String(a.id_donation)) ?? 0) + quantity
      );
    if (need && (a.status === 'COMPLETED' || a.status === 'WAITING_RECEIPT')) {
      const total = totals.get(need.id) ?? {
        received_quantity: 0,
        separated_quantity: 0,
      };
      if (a.status === 'COMPLETED') total.received_quantity += quantity;
      else total.separated_quantity += quantity;
      totals.set(need.id, total);
    }
  }
  for (const donation of donations.values()) {
    const expected =
      Number(donation.initial_quantity) - (consumed.get(donation.id) ?? 0);
    const type = donation.item_type_id
      ? types.get(String(donation.item_type_id))
      : undefined;
    if (
      !categories.has(String(donation.category_id)) ||
      (donation.item_type_id && type?.category_id !== donation.category_id) ||
      !validItemSpecifications(
        donation.specifications as never,
        type?.code as string | undefined
      ) ||
      expected < 0 ||
      expected !== donation.current_quantity ||
      donation.available !== expected > 0
    )
      fail('Doação ou estoque incoerente ' + donation.id);
  }
  const searchableByType: Record<string, number> = {};
  const normalize = (text: string) =>
    ' ' +
    text
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim() +
    ' ';
  for (const need of needs.values()) {
    const family = families.get(String(need.id_family));
    const person = need.id_beneficiary
      ? people.get(String(need.id_beneficiary))
      : undefined;
    const type = need.item_type_id
      ? types.get(String(need.item_type_id))
      : undefined;
    if (
      !family ||
      (need.id_beneficiary && person?.id_family !== need.id_family) ||
      (need.item_type_id && !type) ||
      !validItemSpecifications(
        need.specifications as never,
        type?.code as string | undefined
      )
    )
      fail('Pedido ou titular incoerente ' + need.id);
    const coverage = totals.get(need.id);
    if (
      need.requested_quantity != null &&
      coverage &&
      (coverage.received_quantity + coverage.separated_quantity >
        Number(need.requested_quantity) ||
        (need.status === 'FULFILLED' &&
          coverage.received_quantity < Number(need.requested_quantity)) ||
        (need.status === 'OPEN' &&
          coverage.received_quantity >= Number(need.requested_quantity)))
    )
      fail('Cobertura incompatível com a situação do pedido ' + need.id);
    if (
      !family?.active ||
      (person && !person.active) ||
      need.status !== 'OPEN' ||
      separableNeedBalance(
        need.requested_quantity as number | null,
        totals.get(need.id)
      ) === 0
    )
      continue;
    const text = normalize(String(need.description ?? ''));
    const matches = type
      ? [type]
      : [...types.values()].filter((row) =>
          (row.aliases as string[]).some((alias) =>
            text.includes(normalize(alias))
          )
        );
    if (matches.length === 1 && matches[0].active)
      searchableByType[String(matches[0].code)] =
        (searchableByType[String(matches[0].code)] ?? 0) + 1;
  }
  const searchable = Object.values(searchableByType).reduce(
    (sum, count) => sum + count,
    0
  );
  if (searchable < lot.manifest.searchable_floor)
    fail('Total pesquisável abaixo do mínimo: ' + searchable);
  if (
    lot.references.some(
      (reference) =>
        !donations.has(reference.donation_id) ||
        [...reference.relevant, ...reference.incompatible].some(
          (id) => !needs.has(id)
        )
    )
  )
    fail('Caso de referência com registro ausente');
  return { searchable, searchableByType };
}

export async function storage(
  provider: 'postgres' | 'mongo',
  lot: Lot,
  write: boolean
) {
  const uri = dedicatedUrl(provider);
  const output = {} as Rows;
  const prisma =
    provider === 'postgres' ? new PrismaClient({ datasourceUrl: uri }) : null;
  const mongo = provider === 'mongo' ? mongoose.createConnection(uri) : null;
  try {
    if (mongo) await mongo.asPromise();
    const statements = [];
    for (const table of tables) {
      const expected = lot.rows[table];
      const delegate = prisma?.[prismaDelegates[table]] as unknown as
        | Delegate
        | undefined;
      const model = mongo?.model(table, mongoSchemas[table]);
      if (write && model) await model.init();
      const read = async (): Promise<Record<string, unknown>[]> =>
        delegate
          ? await delegate.findMany()
          : (
              await model!
                .find()
                .select(table === 'beneficiaries' ? '+needs_revision' : '')
                .lean()
                .exec()
            ).map((row) => ({
              ...row,
              id: row._id,
            }));
      const existing = await read();
      const expectedById = new Map(expected.map((row) => [row.id, row]));
      let bootstrapTime: string | undefined;
      for (const row of existing) {
        const expectedRow = expectedById.get(String(row.id));
        if (
          write &&
          prisma &&
          table === 'categories' &&
          row.id === defaultCategoryId &&
          expectedRow &&
          digest(
            project({ ...row, created_at: expectedRow.created_at }, expectedRow)
          ) === digest(expectedRow) &&
          row.created_at instanceof Date &&
          row.created_at.toISOString() !== expectedRow.created_at
        ) {
          bootstrapTime = String(expectedRow.created_at);
          continue;
        }
        if (
          !expectedRow ||
          digest(project(row, expectedRow)) !== digest(expectedRow)
        )
          throw new Error(
            'Conteúdo diferente no destino em ' +
              table +
              '. Use outra base dedicada para outro lote.'
          );
      }
      statements.push({
        writeTable: async () => {
          if (write) {
            if (bootstrapTime)
              await prisma!.category.update({
                where: { id: defaultCategoryId },
                data: { created_at: new Date(bootstrapTime) },
              });
            for (let offset = 0; offset < expected.length; offset += 100) {
              const chunk = expected.slice(offset, offset + 100);
              if (delegate)
                await delegate.createMany({
                  data: chunk.map((row) => prepare(row, true)),
                  skipDuplicates: true,
                });
              else
                await model!.bulkWrite(
                  chunk.map((row) => {
                    const { id, ...fields } = prepare(row, false);
                    return {
                      updateOne: {
                        filter: { _id: row.id },
                        update: { $setOnInsert: { ...fields, _id: id } },
                        upsert: true,
                      },
                    };
                  }),
                  { timestamps: false }
                );
            }
          }
          const persisted = new Map(
            (await read()).map((row) => [String(row.id), row])
          );
          if (persisted.size !== expected.length)
            throw new Error('Contagem divergente em ' + table);
          output[table] = expected.map((row) =>
            project(persisted.get(row.id)!, row)
          );
        },
      });
    }
    if (write && prisma) {
      await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS synthetic_load_manifest (
        id INTEGER PRIMARY KEY, signature TEXT NOT NULL
      )`;
      await prisma.$executeRaw`INSERT INTO synthetic_load_manifest (id, signature)
        VALUES (1, ${lot.manifest.signature}) ON CONFLICT (id) DO NOTHING`;
      const [claim] = await prisma.$queryRaw<{ signature: string }[]>`
        SELECT signature FROM synthetic_load_manifest WHERE id = 1
      `;
      if (claim.signature !== lot.manifest.signature)
        throw new Error('A base já está reservada para outro lote.');
    } else if (write && mongo) {
      const claims = mongo.db!.collection<{ _id: string; signature: string }>(
        'synthetic_load_manifest'
      );
      try {
        await claims.updateOne(
          { _id: 'dataset' },
          { $setOnInsert: { signature: lot.manifest.signature } },
          { upsert: true }
        );
      } catch (error) {
        if ((error as { code?: number }).code !== 11000) throw error;
      }
      const claim = await claims.findOne({ _id: 'dataset' });
      if (claim?.signature !== lot.manifest.signature)
        throw new Error('A base já está reservada para outro lote.');
    }
    for (const statement of statements) await statement.writeTable();
    if (digest(output) !== digest(lot.rows))
      throw new Error('Dados persistidos divergentes do lote.');
    return { signature: digest(output), ...validate(lot, output) };
  } finally {
    await prisma?.$disconnect();
    await mongo?.close();
  }
}
