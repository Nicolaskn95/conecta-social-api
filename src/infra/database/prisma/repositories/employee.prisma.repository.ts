import { Injectable } from '@nestjs/common';
import { Employee } from '@/domain/entities';
import { EmployeeRole } from '@/domain/enums';
import {
  CreateEmployeeData,
  EmployeeRepository,
  UpdateEmployeeData,
} from '@/domain/repositories';
import { PrismaService } from '../prisma.service';
import { toDomain } from '../prisma-transaction-manager';

@Injectable()
export class EmployeePrismaRepository extends EmployeeRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(data: CreateEmployeeData, hashedPassword: string): Promise<Employee> {
    const employee = await this.prisma.employee.create({
      data: {
        ...data,
        birth_date: new Date(data.birth_date),
        email: data.email.toLowerCase(),
        password: hashedPassword,
        active: data.active ?? true,
      },
    });
    return toDomain(employee);
  }

  async findAll(): Promise<Employee[]> {
    return toDomain(await this.prisma.employee.findMany());
  }

  async findAllActives(role?: EmployeeRole): Promise<Employee[]> {
    return toDomain(
      await this.prisma.employee.findMany({
        where: { active: true, ...(role ? { role } : {}) },
      })
    );
  }

  async findById(id: string): Promise<Employee | null> {
    return toDomain(await this.prisma.employee.findUnique({ where: { id } }));
  }

  async findByEmail(email: string): Promise<Employee | null> {
    return toDomain(await this.prisma.employee.findUnique({ where: { email } }));
  }

  async findByCpf(cpf: string): Promise<Employee | null> {
    return toDomain(await this.prisma.employee.findUnique({ where: { cpf } }));
  }

  async update(id: string, data: UpdateEmployeeData): Promise<Employee> {
    return toDomain(await this.prisma.employee.update({ where: { id }, data }));
  }

  async softDelete(id: string): Promise<Employee> {
    return toDomain(
      await this.prisma.employee.update({
        where: { id },
        data: { active: false },
      })
    );
  }

  async findPaginated(skip: number, take: number, role?: EmployeeRole): Promise<Employee[]> {
    return toDomain(
      await this.prisma.employee.findMany({
        where: { active: true, ...(role ? { role } : {}) },
        orderBy: { created_at: 'desc' },
        skip,
        take,
      })
    );
  }

  countActives(role?: EmployeeRole): Promise<number> {
    return this.prisma.employee.count({
      where: { active: true, ...(role ? { role } : {}) },
    });
  }
}
