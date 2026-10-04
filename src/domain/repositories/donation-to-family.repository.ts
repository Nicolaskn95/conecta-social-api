import { DonationToFamilyWithRelations } from '../entities';
import { TransactionContext } from '../transaction/transaction-manager';

export interface CreateDonationToFamilyData {
  id_donation: string;
  id_family: string;
  quantity: number;
  update_message?: string | null;
}

/**
 * "Ativo" = registro ativo E doação ativa E família ativa.
 * Listagens retornam ordenadas por created_at desc, com donation.category e family.
 */
export abstract class DonationToFamilyRepository {
  abstract create(
    data: CreateDonationToFamilyData,
    ctx?: TransactionContext
  ): Promise<DonationToFamilyWithRelations>;
  abstract findAll(): Promise<DonationToFamilyWithRelations[]>;
  abstract findAllActives(): Promise<DonationToFamilyWithRelations[]>;
  /** Registro ativo pelo id (não filtra doação/família). */
  abstract findActiveById(id: string): Promise<DonationToFamilyWithRelations | null>;
  abstract findActivePaginated(skip: number, take: number): Promise<DonationToFamilyWithRelations[]>;
  abstract countActives(): Promise<number>;
}
