import { DeliveryMode } from "@/domain/enums";
import { Family } from '../entities';
import { TransactionContext } from '../transaction/transaction-manager';

export interface CreateFamilyData {
  monthly_income_cents?: number | null;
  housing_description?: string | null;
  preferred_delivery_mode?: DeliveryMode | null;
  name: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  active?: boolean;
}

export type UpdateFamilyData = Partial<CreateFamilyData>;

export abstract class FamilyRepository {
  abstract create(data: CreateFamilyData): Promise<Family>;
  abstract findAll(): Promise<Family[]>;
  abstract findAllActives(): Promise<Family[]>;
  abstract findById(id: string, ctx?: TransactionContext): Promise<Family | null>;
  abstract findActiveById(id: string, ctx?: TransactionContext): Promise<Family | null>;
  abstract update(id: string, data: UpdateFamilyData): Promise<Family>;
  abstract softDelete(id: string): Promise<Family>;
  abstract findPaginated(skip: number, take: number): Promise<Family[]>;
  abstract countActives(): Promise<number>;
}
