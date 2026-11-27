import { DonationCondition } from "@/domain/enums";
import { ItemSpecifications } from "@/domain/entities";
import { Donation, DonationWithCategory } from '../entities';
import { TransactionContext } from '../transaction/transaction-manager';

export interface DonationImageFields {
  image_key?: string;
  image_bucket?: string;
  image_content_type?: string;
  image_original_name?: string;
}

export interface CreateDonationData extends DonationImageFields {
  item_type_id?: string | null;
  condition?: DonationCondition | null;
  specifications?: ItemSpecifications | null;
  category_id: string;
  name: string;
  description?: string | null;
  initial_quantity: number;
  donator_name?: string | null;
  gender?: string | null;
  size?: string | null;
  active?: boolean;
  available?: boolean;
}

export interface UpdateDonationData extends DonationImageFields {
  item_type_id?: string | null;
  condition?: DonationCondition | null;
  specifications?: ItemSpecifications | null;
  category_id?: string;
  name?: string;
  description?: string | null;
  donator_name?: string | null;
  gender?: string | null;
  size?: string | null;
  active?: boolean;
}

export abstract class DonationRepository {
  /** Cria a doação com current_quantity = initial_quantity. */
  abstract create(data: CreateDonationData): Promise<DonationWithCategory>;
  abstract findAll(): Promise<DonationWithCategory[]>;
  abstract findAllActives(): Promise<DonationWithCategory[]>;
  abstract findAllWithStock(): Promise<DonationWithCategory[]>;
  /** Doação ativa (com categoria). */
  abstract findById(id: string, ctx?: TransactionContext, includeInactive?: boolean): Promise<DonationWithCategory | null>;
  abstract update(id: string, data: UpdateDonationData): Promise<DonationWithCategory>;
  abstract delete(id: string): Promise<void>;
  abstract findPaginated(skip: number, take: number): Promise<DonationWithCategory[]>;
  abstract countActives(): Promise<number>;

  abstract setStock(
    id: string,
    expectedQuantity: number,
    newQuantity: number,
    ctx: TransactionContext,
    includeInactive?: boolean
  ): Promise<DonationWithCategory | null>;
}
