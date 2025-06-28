import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateEmployeeDto } from '../dtos/update-employee.dto';
import { EmployeeRepository } from '../repositories/employee.repository.interface';
import { ErrorMessages } from '@/common/helper/error-messages';
import { Employee } from '@prisma/client';

@Injectable()
export class UpdateEmployeeUseCase {
  constructor(
    @Inject('EmployeeRepository')
    private readonly repository: EmployeeRepository
  ) {}

  async execute(id: string, dto: UpdateEmployeeDto): Promise<Employee> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(ErrorMessages.EMPLOYEE_NOT_FOUND);
    }

    if (dto.email && dto.email !== existing.email) {
      const emailExists = await this.repository.findByEmail(dto.email);
      if (emailExists) {
        throw new BadRequestException(ErrorMessages.EMAIL_DUPLICATE);
      }
    }

    if (dto.cpf && dto.cpf !== existing.cpf) {
      const cpfExists = await this.repository.findByCpf(dto.cpf);
      if (cpfExists) {
        throw new BadRequestException(ErrorMessages.CPF_DUPLICATE);
      }
    }

    return this.repository.update(id, {
      ...dto,
      email: dto.email?.toLowerCase(),
    });
  }
}
