import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/config/prisma/prisma.service';
import { CreateEmployeeDto } from '../dtos/create-employee.dto';
import { UpdateEmployeeDto } from '../dtos/update-employee.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmployeeService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateEmployeeDto) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.prisma.employee.create({
      data: {
        ...data,
        password: hashedPassword,
        active: data.active ?? true,
      },
    });
  }

  findAll() {
    return this.prisma.employee.findMany();
  }

  findOne(id: string) {
    return this.prisma.employee.findUnique({ where: { id } });
  }

  update(id: string, data: UpdateEmployeeDto) {
    return this.prisma.employee.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.employee.delete({ where: { id } });
  }
}
