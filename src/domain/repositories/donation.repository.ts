import { Donation, DonationWithCategory } from '../entities';
import { TransactionContext } from '../transaction/transaction-manager';

export interface DonationImageFields {
  image_key?: string;
  image_bucket?: string;
  image_content_type?: string;
  image_original_name?: string;
}

export interface CreateDonationData extends DonationImageFields {
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
  abstract findById(id: string, ctx?: TransactionContext): Promise<DonationWithCategory | null>;
  abstract update(id: string, data: UpdateDonationData): Promise<DonationWithCategory>;
  abstract delete(id: string): Promise<void>;
  abstract findPaginated(skip: number, take: number): Promise<DonationWithCategory[]>;
  abstract countActives(): Promise<number>;

  /**
   * Decrementa o estoque de forma atômica somente se houver quantidade suficiente
   * (doação ativa e current_quantity >= quantity). Atualiza `available`.
   * Retorna a doação atualizada ou `null` se não houver estoque suficiente.
   */
  abstract decrementStockIfAvailable(
    id: string,
    quantity: number,
    ctx?: TransactionContext
  ): Promise<Donation | null>;

  /** Define current_quantity e recalcula `available`. */
  abstract setStock(
    id: string,
    newQuantity: number,
    ctx?: TransactionContext
  ): Promise<DonationWithCategory>;
}
