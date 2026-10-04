import {
  DonationStockAdjustment,
  DonationStockAdjustmentWithEmployee,
} from '../entities';
import { DonationStockAdjustmentReason } from '../enums';
import { TransactionContext } from '../transaction/transaction-manager';

export interface CreateDonationStockAdjustmentData {
  id_donation: string;
  id_employee: string;
  delta_quantity: number;
  previous_quantity: number;
  new_quantity: number;
  reason: DonationStockAdjustmentReason;
  note?: string | null;
}

export abstract class DonationStockAdjustmentRepository {
  abstract create(
    data: CreateDonationStockAdjustmentData,
    ctx?: TransactionContext
  ): Promise<DonationStockAdjustment>;
  /** Ajustes da doação, created_at desc, com resumo do funcionário. */
  abstract findByDonation(donationId: string): Promise<DonationStockAdjustmentWithEmployee[]>;
}
