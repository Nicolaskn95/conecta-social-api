import { Employee } from '../entities';
import { EmployeeRole } from '../enums';

export interface CreateEmployeeData {
  name: string;
  surname: string;
  birth_date: Date | string;
  cpf: string;
  email: string;
  phone: string;
  role?: EmployeeRole;
  cep: string;
  street: string;
  neighborhood: string;
  number: string;
  city: string;
  state: string;
  complement?: string | null;
  active?: boolean;
  password?: string;
}

export type UpdateEmployeeData = Partial<
  Omit<Employee, 'id' | 'birth_date' | 'created_at' | 'updated_at'>
> & {
  birth_date?: Date | string;
};

export abstract class EmployeeRepository {
  abstract create(data: CreateEmployeeData, hashedPassword: string): Promise<Employee>;
  abstract findAll(): Promise<Employee[]>;
  abstract findAllActives(role?: EmployeeRole): Promise<Employee[]>;
  abstract findById(id: string): Promise<Employee | null>;
  abstract findByEmail(email: string): Promise<Employee | null>;
  abstract findByCpf(cpf: string): Promise<Employee | null>;
  abstract update(id: string, data: UpdateEmployeeData): Promise<Employee>;
  abstract softDelete(id: string): Promise<Employee>;
  abstract findPaginated(skip: number, take: number, role?: EmployeeRole): Promise<Employee[]>;
  abstract countActives(role?: EmployeeRole): Promise<number>;
}
