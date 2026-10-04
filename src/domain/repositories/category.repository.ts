import { Category } from '../entities';

export interface CreateCategoryData {
  name: string;
  measure_unity: string;
  active?: boolean;
}

export type UpdateCategoryData = Partial<CreateCategoryData>;

export abstract class CategoryRepository {
  abstract create(data: CreateCategoryData): Promise<Category>;
  /** Somente categorias ativas. */
  abstract findAll(): Promise<Category[]>;
  /** Somente categoria ativa. */
  abstract findById(id: string): Promise<Category | null>;
  abstract update(id: string, data: UpdateCategoryData): Promise<Category>;
  abstract delete(id: string): Promise<void>;
}
