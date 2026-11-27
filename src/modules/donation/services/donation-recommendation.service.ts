import { Injectable, NotFoundException } from '@nestjs/common';
import { haveConflictingSpecifications } from '@/domain/item-specifications';
import { separableNeedBalance } from '@/domain/need-coverage';
import { ItemSpecifications, ItemType } from '@/domain/entities';
import { DonationRepository } from '@/domain/repositories/donation.repository';
import { DonationToFamilyRepository } from '@/domain/repositories/donation-to-family.repository';
import { ItemTypeRepository } from '@/domain/repositories/item-type.repository';
import { NeedRepository } from '@/domain/repositories/need.repository';

const fieldsByType = new Map<string, keyof ItemSpecifications>([
  ['WHEELCHAIR', 'seat_width_cm'],
  ['SNEAKERS', 'shoe_size_br'],
]);
const batchSize = 100;

function normalize(text: string) {
  return (
    ' ' +
    text
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim() +
    ' '
  );
}

function inferType(text: string, catalog: ItemType[]) {
  const normalized = normalize(text);
  const matches = catalog.filter((type) =>
    [type.name, ...type.aliases].some(
      (alias) => alias.trim() && normalized.includes(normalize(alias))
    )
  );
  return matches.length === 1 ? matches[0] : undefined;
}

@Injectable()
export class DonationRecommendationService {
  constructor(
    private readonly donations: DonationRepository,
    private readonly types: ItemTypeRepository,
    private readonly needs: NeedRepository,
    private readonly allocations: DonationToFamilyRepository
  ) {}

  async find(id: string) {
    const donation = await this.donations.findById(id);
    if (!donation) throw new NotFoundException('Doação não encontrada');
    const stock = {
      available_quantity: donation.current_quantity,
      unit: donation.category?.measure_unity ?? null,
    };
    if (!donation.available || stock.available_quantity <= 0) {
      return { ...stock, status: 'NO_STOCK', suggestions: [] };
    }

    const catalog = await this.types.findActive();
    const type = donation.item_type_id
      ? catalog.find((item) => item.id === donation.item_type_id)
      : inferType(
          donation.name,
          catalog.filter((item) => item.category_id === donation.category_id)
        );
    if (!type) return { ...stock, status: 'TYPE_UNRESOLVED', suggestions: [] };

    const attribute = fieldsByType.get(type.code);
    const offered = attribute
      ? (donation.specifications?.[attribute] ?? null)
      : null;
    const compatible = [];
    const review = [];
    for (let skip = 0; ; skip += batchSize) {
      const batch = await this.needs.listForRecommendation(
        type.id,
        skip,
        batchSize
      );
      const candidates = batch.filter(
        (need) =>
          need.family?.active &&
          (!need.id_beneficiary ||
            (need.beneficiary?.active &&
              need.beneficiary.id_family === need.id_family)) &&
          (need.item_type_id === type.id ||
            (!need.item_type_id &&
              inferType(need.description ?? '', catalog)?.id === type.id))
      );
      const totals = await this.allocations.needQuantitiesFor(
        candidates.map((need) => need.id)
      );

      for (const need of candidates) {
        const remaining = separableNeedBalance(
          need.requested_quantity,
          totals.get(need.id)
        );
        if (
          remaining === 0 ||
          haveConflictingSpecifications(
            donation.specifications,
            need.specifications
          )
        )
          continue;

        const requested = attribute
          ? (need.specifications?.[attribute] ?? null)
          : null;
        const checks = [];
        if (!donation.item_type_id) checks.push('DONATION_TYPE_INFERRED');
        if (!need.item_type_id) checks.push('NEED_TYPE_INFERRED');
        if (['TOY', 'HYGIENE_KIT', 'PET_SUPPLIES'].includes(type.code)) {
          checks.push('GENERIC_ITEM_CONFIRMATION');
        }
        if (attribute && offered === null)
          checks.push('DONATION_MEASUREMENT_MISSING');
        if (attribute && requested === null)
          checks.push('NEED_MEASUREMENT_MISSING');
        const classification = checks.length ? 'REVIEW' : 'COMPATIBLE';
        if (remaining === null) checks.push('QUANTITY_UNKNOWN');

        const candidate = {
          id_family: need.id_family,
          family_name: need.family!.name,
          id_beneficiary: need.id_beneficiary,
          beneficiary_name: need.beneficiary
            ? need.beneficiary.name + ' ' + need.beneficiary.surname
            : null,
          id_need: need.id,
          need_label: need.description?.trim() || type.name,
          created_at: need.created_at,
          classification,
          reason:
            offered !== null && requested !== null
              ? 'MEASUREMENT_MATCH'
              : 'TYPE_MATCH',
          checks,
          type_name: type.name,
          attribute,
          offered,
          requested,
          remaining_quantity: remaining,
          max_separable_quantity:
            remaining === null
              ? null
              : Math.min(remaining, stock.available_quantity),
        };
        (classification === 'COMPATIBLE' ? compatible : review).push(candidate);
      }

      if (batch.length < batchSize) break;
    }
    const byAge = (
      a: { created_at: Date; id_need: string },
      b: { created_at: Date; id_need: string }
    ) =>
      a.created_at.getTime() - b.created_at.getTime() ||
      (a.id_need < b.id_need ? -1 : Number(a.id_need > b.id_need));
    const suggestions = [
      ...compatible.sort(byAge),
      ...review.sort(byAge),
    ].slice(0, 5);
    return {
      ...stock,
      status: suggestions.length ? 'OK' : 'NO_MATCHES',
      suggestions,
    };
  }
}
