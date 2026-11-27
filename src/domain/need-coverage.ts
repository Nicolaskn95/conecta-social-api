import { NeedQuantities } from './repositories/donation-to-family.repository';

export function separableNeedBalance(
  requested: number | null | undefined,
  quantities?: NeedQuantities
): number | null {
  const separated = quantities?.separated_quantity ?? 0;
  if (requested == null) return separated > 0 ? 0 : null;
  return Math.max(
    0,
    requested - (quantities?.received_quantity ?? 0) - separated
  );
}
