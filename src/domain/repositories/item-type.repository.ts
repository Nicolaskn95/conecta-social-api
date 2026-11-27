import { ItemType } from '../entities';

export abstract class ItemTypeRepository {
  abstract findActive(categoryId?: string): Promise<ItemType[]>;
  abstract findById(id: string): Promise<ItemType | null>;
}
