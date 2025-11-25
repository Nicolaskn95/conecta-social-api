import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/config/prisma/prisma.service';
import { EmployeeRepository } from './employee.repository.interface';
import { CreateEmployeeDto } from '../dtos/create-employee.dto';
import { UpdateEmployeeDto } from '../dtos/update-employee.dto';
import { Employee } from '@prisma/client';

@Injectable()
export class EmployeeRepositoryImpl implements EmployeeRepository {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateEmployeeDto, hashedPassword: string): Promise<Employee> {
    return this.prisma.employee.create({
      data: {
        ...dto,
        birth_date: new Date(dto.birth_date),
        email: dto.email.toLowerCase(),
        password: hashedPassword,
        active: dto.active ?? true,
      },
    });
  }

  findAll(): Promise<Employee[]> {
    return this.prisma.employee.findMany();
  }

  findAllActives(): Promise<Employee[]> {
    return this.prisma.employee.findMany({ where: { active: true } });
  }

  findById(id: string): Promise<Employee | null> {
    return this.prisma.employee.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<Employee | null> {
    return this.prisma.employee.findUnique({ where: { email } });
  }

  findByCpf(cpf: string): Promise<Employee | null> {
    return this.prisma.employee.findUnique({ where: { cpf } });
  }

  update(id: string, data: UpdateEmployeeDto): Promise<Employee> {
    return this.prisma.employee.update({ where: { id }, data });
  }

  softDelete(id: string): Promise<Employee> {
    return this.prisma.employee.update({
      where: { id },
      data: { active: false },
    });
  }

  findPaginated(skip: number, take: number): Promise<Employee[]> {
    return this.prisma.employee.findMany({
      where: { active: true },
      orderBy: { created_at: 'desc' },
      skip,
      take,
    });
  }

  countActives(): Promise<number> {
    return this.prisma.employee.count({ where: { active: true } });
  }
}
