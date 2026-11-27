import { ItemSpecifications } from './entities';

const typesForAttribute: Readonly<Record<string, string>> = {
  seat_width_cm: 'WHEELCHAIR',
  shoe_size_br: 'SNEAKERS',
};

export function validItemSpecifications(
  specifications?: ItemSpecifications | null,
  itemTypeCode?: string
): boolean {
  return Object.entries(specifications ?? {}).every(
    ([key, value]) =>
      Object.prototype.hasOwnProperty.call(typesForAttribute, key) &&
      (!itemTypeCode || typesForAttribute[key] === itemTypeCode) &&
      typeof value === 'number' &&
      Number.isFinite(value) &&
      value > 0 &&
      (key !== 'shoe_size_br' || Number.isInteger(value))
  );
}

export function haveConflictingSpecifications(
  offered?: ItemSpecifications | null,
  requested?: ItemSpecifications | null
): boolean {
  return (['shoe_size_br', 'seat_width_cm'] as const).some((key) => {
    const left = offered?.[key];
    const right = requested?.[key];
    return left != null && right != null && left !== right;
  });
}
