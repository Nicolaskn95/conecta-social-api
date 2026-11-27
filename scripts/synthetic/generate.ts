import { createHash } from 'node:crypto';
import { fakerPT_BR as faker } from '@faker-js/faker';
import {
  defaultCategories,
  initialItemTypes,
} from '../../src/domain/donation-catalog';

export type Profile = 'small' | 'full';
export type Row = { id: string } & Record<string, unknown>;
export const tables = [
  'categories',
  'item_types',
  'families',
  'beneficiaries',
  'needs',
  'donations',
  'donations_to_family',
] as const;
export type Table = (typeof tables)[number];
export type Rows = Record<Table, Row[]>;
export const version = 2;
export const defaultCategoryId = '3f3f3b7a-5e59-4a0a-9f2d-8ce0d76f7a9d'; // Seed da migração de Variados.
export const digest = (value: unknown) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');

type Parameters = {
  batch: string;
  seed: number;
  cutoff: string;
  profile: Profile;
};
export type Reference = {
  donation_id: string;
  type: string;
  status: 'OK' | 'NO_STOCK' | 'TYPE_UNRESOLVED' | 'NO_MATCHES';
  relevant: string[];
  incompatible: string[];
};

export function generate(params: Parameters) {
  const { batch, seed, cutoff, profile } = params;
  faker.seed(seed);
  const full = profile === 'full';
  const count = full
    ? {
        families: 400,
        people: 1200,
        needs: 1600,
        donations: 600,
        allocations: 350,
        references: 80,
        eligible: 1250,
      }
    : {
        families: 8,
        people: 24,
        needs: 30,
        donations: 24,
        allocations: 8,
        references: 12,
        eligible: 21,
      };
  const id = (entity: string, index: number) => {
    const hex = digest([version, batch, entity, index]);
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-8${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
  };
  const date = (days: number, hours = 0) =>
    new Date(
      Date.parse(cutoff) - days * 86400000 + hours * 3600000
    ).toISOString();
  const metadata = (created: string) => ({
    created_at: created,
    updated_at: created,
  });
  const catalogDay = date(280);
  const categories = defaultCategories.map((c, i) => ({
    ...c,
    id: c.name === 'Variados' ? defaultCategoryId : id('category', i),
    active: true,
    created_at: catalogDay,
  }));
  const types = initialItemTypes
    .slice(0, 3)
    .map(({ category, ...type }, i) => ({
      ...type,
      id: id('type', i),
      category_id: categories.find((row) => row.name === category)!.id,
      active: true,
      ...metadata(catalogDay),
    }));
  const activeFamilies = count.families - (full ? 8 : 1);
  const families = Array.from({ length: count.families }, (_, i) => ({
    id: id('family', i),
    name: `Família fictícia ${i + 1}`,
    street: 'Rua fictícia',
    number: String(i + 1),
    neighborhood: `Setor ${(i % 10) + 1}`,
    city: 'Cidade fictícia',
    state: 'SP',
    cep: '00000-000',
    monthly_income_cents: null,
    housing_description: null,
    preferred_delivery_mode:
      i % 3 === 0 ? 'PICKUP' : i % 3 === 1 ? 'DELIVERY' : null,
    active: i < activeFamilies,
    ...metadata(date(250)),
  }));
  const beneficiaries = Array.from({ length: count.people }, (_, i) => ({
    id: id('person', i),
    id_family: families[i % count.families].id,
    name: faker.person.firstName().slice(0, 30),
    surname: (faker.person.lastName() + ' (teste)').slice(0, 60),
    birth_date: date(7300 + (i % 1000)),
    cpf: null,
    rg: null,
    email: null,
    phone: null,
    gender: ['Feminino', 'Masculino'][i % 2],
    has_disability: false,
    disability_details: null,
    active: i < count.people - 4,
    needs_revision: 0,
    ...metadata(date(240)),
  }));

  const measure = (typeIndex: number, variant: number) => {
    if (typeIndex === 0) return { seat_width_cm: 38 + (variant % 8) * 2 };
    if (typeIndex === 1) return { shoe_size_br: 34 + (variant % 12) };
    return null;
  };
  const semanticText = [
    'Mobilidade sentada com propulsão manual',
    'Calçado esportivo fechado',
    'Kit de mantimentos para a despensa',
  ];
  const lexical = [
    'Precisa de cadeira de rodas',
    'Precisa de tenis',
    'Precisa de cesta básica',
  ];
  const intents = new Map<string, number>();
  const needs = Array.from({ length: count.needs }, (_, i) => {
    const typeIndex = i % types.length;
    const type = types[typeIndex];
    const variant = Math.floor(i / types.length);
    const eligible = i < count.eligible;
    const legacy = eligible && variant % 11 === 2 && (full || typeIndex !== 0);
    const tail = i - count.eligible;
    const lexicalOther = !eligible && tail % 17 === 4;
    const inactiveFamily = !eligible && tail % 19 === 7;
    const familyIndex = inactiveFamily ? activeFamilies : i % activeFamilies;
    const family = families[familyIndex];
    const person = i % 2 === 0 ? beneficiaries[familyIndex] : null;
    const needId = id('need', i);
    if (!lexicalOther) intents.set(needId, typeIndex);
    return {
      id: needId,
      id_family: family.id,
      id_beneficiary: person?.id ?? null,
      item_type_id: legacy || lexicalOther ? null : type.id,
      description: lexicalOther
        ? semanticText[typeIndex]
        : legacy
          ? lexical[typeIndex]
          : variant % 4 === 0
            ? null
            : type.name,
      requested_quantity: variant % 13 === 4 ? null : 2,
      specifications:
        (variant % 7 === 3 && (full || typeIndex !== 0)) ||
        legacy ||
        lexicalOther
          ? null
          : measure(typeIndex, variant),
      status: !eligible && tail % 9 === 1 ? 'CLOSED' : 'OPEN',
      version: 0,
      created_by: null,
      ...metadata(date(200 - (i % 120), i % 8)),
    };
  });

  const donations = Array.from({ length: count.donations }, (_, i) => {
    const typeIndex = i % types.length;
    const type = types[typeIndex];
    const variant = Math.floor(i / types.length);
    const reserved = i < count.references;
    const noStock = reserved && i % 10 === 0;
    const unresolved = reserved && i % 17 === 4;
    const inferred = !unresolved && i % 11 === 5;
    const initial = noStock ? 0 : i % 4 === 0 ? 1 : 3;
    const measures =
      !full && i === 9 ? { seat_width_cm: 70 } : measure(typeIndex, variant);
    return {
      id: id('donation', i),
      category_id: type.category_id,
      item_type_id: unresolved || inferred ? null : type.id,
      name: unresolved
        ? `Item de teste sem classificação ${i + 1}`
        : `${type.name} · teste ${i + 1}`,
      condition: [null, 'NEW', 'USED_GOOD', 'REQUIRES_REVIEW'][i % 4],
      specifications:
        inferred || unresolved || (i % 8 === 7 && (full || typeIndex !== 0))
          ? null
          : measures,
      initial_quantity: initial,
      current_quantity: initial,
      available: initial > 0,
      active: true,
      ...metadata(date(62 - (i % 32))),
    };
  });

  const allocations = [];
  const restocked: string[] = [];
  for (let i = 0; i < count.allocations; i++) {
    const donationIndex = count.donations - count.allocations + i;
    const donation = donations[donationIndex];
    const type = types[donationIndex % types.length];
    const need = needs[count.needs - count.allocations + i];
    const mode = i % 6;
    const status = [
      'WAITING_RECEIPT',
      'COMPLETED',
      'CANCELED',
      'CANCELED',
      'COMPLETED',
      'UNKNOWN',
    ][mode];
    const linked = mode !== 5;
    const quantity = mode === 4 && donation.initial_quantity >= 2 ? 2 : 1;
    const separated = date(20 - (i % 12));
    const confirmed = status === 'COMPLETED' ? date(18 - (i % 12)) : null;
    const canceled = status === 'CANCELED' ? date(19 - (i % 12)) : null;
    if (linked) {
      need.item_type_id = type.id;
      need.description = type.name;
      need.specifications = donation.specifications;
      need.requested_quantity = i % 11 === 0 ? null : 2;
      need.status =
        confirmed &&
        (quantity === 2 || (need.requested_quantity === null && i % 2 === 0))
          ? 'FULFILLED'
          : 'OPEN';
      need.updated_at = confirmed ?? canceled ?? separated;
      intents.set(need.id, donationIndex % types.length);
    }
    const allocationId = id('allocation', i);
    if (mode === 2) restocked.push(allocationId);
    donation.current_quantity -= mode === 2 ? 0 : quantity;
    donation.available = donation.current_quantity > 0;
    donation.updated_at = canceled ?? separated;
    allocations.push({
      id: allocationId,
      id_donation: donation.id,
      id_family: need.id_family,
      id_need: linked ? need.id : null,
      id_beneficiary: linked ? need.id_beneficiary : null,
      status,
      quantity,
      delivery_mode: linked ? (i % 2 === 0 ? 'PICKUP' : 'DELIVERY') : null,
      separated_at: linked ? separated : null,
      confirmed_at: confirmed,
      canceled_at: canceled,
      received_at: confirmed && i % 3 !== 0 ? date(19 - (i % 12)) : null,
      active: true,
      created_at: separated,
      updated_at: confirmed ?? canceled ?? separated,
    });
  }
  const rows: Rows = {
    categories,
    item_types: types,
    families,
    beneficiaries,
    needs,
    donations,
    donations_to_family: allocations,
  };
  const cohort = needs
    .slice(0, count.eligible)
    .filter((need) => !allocations.some((a) => a.id_need === need.id));
  const references: Reference[] = donations
    .slice(0, count.references)
    .map((donation, i) => {
      const typeIndex = i % types.length;
      const status = !donation.available
        ? 'NO_STOCK'
        : donation.name.startsWith('Item de teste')
          ? 'TYPE_UNRESOLVED'
          : !full && i === 9
            ? 'NO_MATCHES'
            : 'OK';
      const field = typeIndex === 0 ? 'seat_width_cm' : 'shoe_size_br';
      const offered = donation.specifications?.[field];
      const candidates =
        status === 'OK'
          ? cohort.filter((need) => intents.get(need.id) === typeIndex)
          : [];
      return {
        donation_id: donation.id,
        type: types[typeIndex].code,
        status,
        relevant: candidates
          .filter(
            (need) =>
              typeIndex === 2 ||
              (offered != null && need.specifications?.[field] === offered)
          )
          .map((need) => need.id),
        incompatible: candidates
          .filter(
            (need) =>
              typeIndex !== 2 &&
              offered != null &&
              need.specifications?.[field] != null &&
              need.specifications[field] !== offered
          )
          .map((need) => need.id),
      };
    });
  const extraTypes = initialItemTypes
    .slice(3)
    .map(({ category, ...type }, index) => ({
      ...type,
      id: id('type', index + 3),
      category_id: categories.find((row) => row.name === category)!.id,
      active: true,
      ...metadata(catalogDay),
    }));
  types.push(...extraTypes);
  const examples = [
    ['Boneca', 'Carrinho de brinquedo', 'Jogo de montar', 'Bola infantil'],
    ['Sabonete', 'Escova de dentes', 'Creme dental', 'Kit de higiene'],
    [
      'Ração para cães',
      'Ração para gatos',
      'Coleira para pet',
      'Pote para água',
    ],
  ];
  const extraCount = full ? 90 : 9;
  for (let index = 0; index < extraCount; index++) {
    const typeIndex = index % extraTypes.length;
    const type = extraTypes[typeIndex];
    const family = families[index % activeFamilies];
    const name =
      examples[typeIndex][
        Math.floor(index / extraTypes.length) % examples[typeIndex].length
      ];
    const created = date(35 - (index % 20));
    needs.push({
      id: id('extra-need', index),
      id_family: family.id,
      id_beneficiary: null,
      item_type_id: type.id,
      description: name,
      requested_quantity: index % 4 === 0 ? null : 1,
      specifications: null,
      status: 'OPEN',
      version: 0,
      created_by: null,
      ...metadata(created),
    });
    donations.push({
      id: id('extra-donation', index),
      category_id: type.category_id,
      item_type_id: type.id,
      name: `${name} · teste ${index + 1}`,
      condition: index % 2 ? 'NEW' : null,
      specifications: null,
      initial_quantity: 2,
      current_quantity: 2,
      available: true,
      active: true,
      ...metadata(created),
    });
  }
  const content = { rows, restocked, references };
  const manifest = {
    ...params,
    version,
    counts: Object.fromEntries(
      tables.map((table) => [table, rows[table].length])
    ),
    searchable_floor: count.eligible - (full ? 50 : 0),
    references: references.length,
    signature: digest(content),
  };
  return { manifest, ...content };
}

export type Lot = ReturnType<typeof generate>;
