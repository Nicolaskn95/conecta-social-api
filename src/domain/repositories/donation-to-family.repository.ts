import { DeliveryMode, DonationAllocationStatus } from '../enums';
import { DonationToFamily } from '../entities';
import { DonationToFamilyWithRelations } from '../entities';
import { TransactionContext } from '../transaction/transaction-manager';

export interface CreateDonationToFamilyData {
  id_donation: string;
  id_family: string;
  quantity: number;
  update_message?: string | null;
  id_need?: string | null;
  id_beneficiary?: string | null;
  status?: DonationAllocationStatus;
  delivery_mode?: DeliveryMode | null;
  separated_at?: Date;
  separated_by?: string;
  request_id?: string | null;
  request_fingerprint?: string | null;
}

export interface AllocationFilter {
  status?: DonationAllocationStatus;
  delivery_mode?: DeliveryMode;
  family_id?: string;
  beneficiary_id?: string;
}

export type AllocationTransition = Pick<DonationToFamily, 'status'> &
  Partial<
    Pick<
      DonationToFamily,
      | 'received_at'
      | 'confirmed_at'
      | 'confirmed_by'
      | 'canceled_at'
      | 'canceled_by'
    >
  >;

/**
 * "Ativo" = registro ativo E doação ativa E família ativa.
 * Listagens retornam ordenadas por created_at desc, com donation.category e family.
 */
export type NeedQuantities = { received_quantity: number; separated_quantity: number };

export abstract class DonationToFamilyRepository {
  abstract needQuantitiesFor(ids: string[], ctx?: TransactionContext): Promise<Map<string, NeedQuantities>>;
  abstract needQuantities(
    id: string,
    ctx?: TransactionContext
  ): Promise<{
    received_quantity: number;
    separated_quantity: number;
  }>;
  abstract findWaitingForBeneficiary(
    id: string,
    ctx: TransactionContext
  ): Promise<string | null>;
  abstract findByRequestId(
    requestId: string
  ): Promise<DonationToFamilyWithRelations | null>;
  abstract transition(
    id: string,
    from: DonationAllocationStatus,
    data: AllocationTransition,
    ctx: TransactionContext
  ): Promise<DonationToFamilyWithRelations | null>;
  abstract create(
    data: CreateDonationToFamilyData,
    ctx?: TransactionContext
  ): Promise<DonationToFamilyWithRelations>;
  abstract findAll(): Promise<DonationToFamilyWithRelations[]>;
  abstract findAllActives(): Promise<DonationToFamilyWithRelations[]>;
  /** Registro ativo pelo id (não filtra doação/família). */
  abstract findActiveById(
    id: string,
    ctx?: TransactionContext
  ): Promise<DonationToFamilyWithRelations | null>;
  abstract findActivePaginated(
    skip: number,
    take: number,
    filter: AllocationFilter
  ): Promise<DonationToFamilyWithRelations[]>;
  abstract countActives(filter: AllocationFilter): Promise<number>;
}
