import { Need } from '../entities';
import { NeedStatus } from '../enums';
import { TransactionContext } from '../transaction/transaction-manager';

export type NeedComplements = Pick<
  Need,
  'item_type_id' | 'description' | 'requested_quantity' | 'specifications'
>;
export type CreateNeedData = Partial<NeedComplements> &
  Pick<Need, 'id_family' | 'id_beneficiary' | 'created_by'>;
export type UpdateNeedData = Partial<NeedComplements> & {
  status?: NeedStatus.CLOSED;
};
export type NeedWriteData = Omit<UpdateNeedData, 'status'> & {
  status?: NeedStatus.CLOSED | NeedStatus.FULFILLED;
};
export type NeedFilter = Partial<
  Pick<Need, 'id_family' | 'id_beneficiary' | 'item_type_id' | 'status'>
>;

export type RecommendationNeed = Need & {
  family: { name: string; active: boolean } | null;
  beneficiary: { name: string; surname: string; active: boolean; id_family: string } | null;
};

export abstract class NeedRepository {
  abstract listForRecommendation(typeId: string, skip: number, take: number): Promise<RecommendationNeed[]>;

  abstract create(data: CreateNeedData, ctx: TransactionContext): Promise<Need>;
  abstract findById(id: string, ctx?: TransactionContext): Promise<Need | null>;
  abstract list(
    filter: NeedFilter,
    skip: number,
    take: number
  ): Promise<Need[]>;
  abstract count(filter: NeedFilter): Promise<number>;
  abstract updateOpen(
    id: string,
    version: number,
    data: NeedWriteData,
    ctx: TransactionContext
  ): Promise<Need | null>;
  abstract moveOpenForBeneficiary(
    id: string,
    familyId: string,
    ctx: TransactionContext
  ): Promise<number>;
}
