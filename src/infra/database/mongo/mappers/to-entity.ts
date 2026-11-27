import {
  Donation,
  DonationToFamilyWithRelations,
  Family,
} from '../../../../domain/entities';
import { DonationAllocationStatus } from '../../../../domain/enums';

/**
 * Converte um documento/objeto do Mongo mapeando `_id` para `id`.
 */
export function toEntity<T>(doc: any): T {
  if (!doc) {
    return null as unknown as T;
  }

  const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };

  if (obj._id !== undefined) {
    obj.id = String(obj._id);
    delete obj._id;
  }

  if (obj.__v !== undefined) {
    delete obj.__v;
  }

  return obj as T;
}

export function toEntityList<T>(docs: any[]): T[] {
  if (!Array.isArray(docs)) {
    return [];
  }
  return docs.map((d) => toEntity<T>(d));
}

export function toFamilyEntity(doc: unknown): Family {
  const family = toEntity<Family>(doc);
  return (
    family && {
      ...family,
      monthly_income_cents: family.monthly_income_cents ?? null,
      housing_description: family.housing_description ?? null,
      preferred_delivery_mode: family.preferred_delivery_mode ?? null,
    }
  );
}

export function toDonationEntity<T extends Donation>(doc: unknown): T {
  const donation = toEntity<T>(doc);
  return (
    donation && {
      ...donation,
      item_type_id: donation.item_type_id ?? null,
      condition: donation.condition ?? null,
      specifications: donation.specifications ?? null,
    }
  );
}

export function toAllocationEntity(
  doc: unknown
): DonationToFamilyWithRelations {
  const allocation = toEntity<DonationToFamilyWithRelations>(doc);
  return (
    allocation && {
      ...allocation,
      status: allocation.status ?? DonationAllocationStatus.UNKNOWN,
      id_beneficiary: allocation.id_beneficiary ?? null,
      id_need: allocation.id_need ?? null,
      delivery_mode: allocation.delivery_mode ?? null,
      separated_at: allocation.separated_at ?? null,
      separated_by: allocation.separated_by ?? null,
      received_at: allocation.received_at ?? null,
      confirmed_at: allocation.confirmed_at ?? null,
      confirmed_by: allocation.confirmed_by ?? null,
      canceled_at: allocation.canceled_at ?? null,
      canceled_by: allocation.canceled_by ?? null,
      request_id: allocation.request_id ?? null,
    }
  );
}
