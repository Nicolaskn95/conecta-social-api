import { Employee, EmployeeRole, Prisma } from '@prisma/client';
import { CreateEmployeeDto } from '../dtos/create-employee.dto';

export interface EmployeeRepository {
  create(dto: CreateEmployeeDto, hashedPassword: string): Promise<Employee>;
  findAll(): Promise<Employee[]>;
  findAllActives(role?: EmployeeRole): Promise<Employee[]>;
  findById(id: string): Promise<Employee | null>;
  findByEmail(email: string): Promise<Employee | null>;
  findByCpf(cpf: string): Promise<Employee | null>;
  update(id: string, data: Prisma.EmployeeUpdateInput): Promise<Employee>;
  softDelete(id: string): Promise<Employee>;
  findPaginated(skip: number, take: number, role?: EmployeeRole): Promise<Employee[]>;
  countActives(role?: EmployeeRole): Promise<number>;
}
