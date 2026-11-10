import { TransactionContext } from '@/domain/transaction/transaction-manager';
import { Family } from '@/domain/entities';

export interface Beneficiary {
  id: string;
  id_family: string;
  name: string;
  surname: string;
  birth_date: Date;
  cpf: string | null;
  rg: string | null;
  email: string | null;
  phone: string | null;
  gender: string;
  has_disability: boolean;
  disability_details: string | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
  family?: Family | null;
}

export type BeneficiaryData = Omit<Beneficiary, 'id' | 'created_at' | 'updated_at' | 'family'>;
export interface BeneficiaryFilter {
  family_id?: string;
  has_disability?: boolean;
  include_inactive?: boolean;
  search?: string;
}

export abstract class BeneficiaryRepository {
  abstract create(data: BeneficiaryData, ctx: TransactionContext): Promise<Beneficiary>;
  abstract update(id: string, data: Partial<BeneficiaryData>, ctx: TransactionContext): Promise<Beneficiary>;
  abstract findById(id: string, ctx?: TransactionContext): Promise<Beneficiary | null>;
  abstract findAll(filter: BeneficiaryFilter, skip?: number, take?: number): Promise<Beneficiary[]>;
  abstract count(filter: BeneficiaryFilter): Promise<number>;
  abstract suggestions(search: string | undefined, limit: number): Promise<string[]>;
}
