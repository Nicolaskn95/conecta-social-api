import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/config/prisma/prisma.service';
import { CreateEmployeeDto } from '../dtos/create-employee.dto';
import { UpdateEmployeeDto } from '../dtos/update-employee.dto';
import * as bcrypt from 'bcrypt';
import { ErrorMessages } from '@/common/helper/error-messages';

@Injectable()
export class EmployeeService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateEmployeeDto) {
    await this.ensureUniqueFields(dto.email, dto.cpf);

    const hashedPassword = await bcrypt.hash(dto.password, 10);

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

  findAll() {
    return this.prisma.employee.findMany();
  }

  findAllActives() {
    return this.prisma.employee.findMany({
      where: { active: true },
    });
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });

    if (!employee) {
      throw new NotFoundException(ErrorMessages.EMPLOYEE_NOT_FOUND);
    }

    return employee;
  }

  async update(id: string, data: UpdateEmployeeDto) {
    await this.findOne(id);

    return this.prisma.employee.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.employee.update({
      where: { id },
      data: { active: false },
    });
  }

  private async ensureUniqueFields(email: string, cpf: string) {
    const [existingByEmail, existingByCpf] = await Promise.all([
      this.prisma.employee.findUnique({ where: { email } }),
      this.prisma.employee.findUnique({ where: { cpf } }),
    ]);

    if (existingByEmail) {
      throw new BadRequestException(ErrorMessages.EMAIL_DUPLICATE);
    }

    if (existingByCpf) {
      throw new BadRequestException(ErrorMessages.CPF_DUPLICATE);
    }
  }
}
