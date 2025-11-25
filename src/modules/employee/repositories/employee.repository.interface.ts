import { Employee } from '@prisma/client';
import { CreateEmployeeDto } from '../dtos/create-employee.dto';
import { UpdateEmployeeDto } from '../dtos/update-employee.dto';

export interface EmployeeRepository {
  create(dto: CreateEmployeeDto, hashedPassword: string): Promise<Employee>;
  findAll(): Promise<Employee[]>;
  findAllActives(): Promise<Employee[]>;
  findById(id: string): Promise<Employee | null>;
  findByEmail(email: string): Promise<Employee | null>;
  findByCpf(cpf: string): Promise<Employee | null>;
  update(id: string, data: UpdateEmployeeDto): Promise<Employee>;
  softDelete(id: string): Promise<Employee>;
  findPaginated(skip: number, take: number): Promise<Employee[]>;
  countActives(): Promise<number>;
}
