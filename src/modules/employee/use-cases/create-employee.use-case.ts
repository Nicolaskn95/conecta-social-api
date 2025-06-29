import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { LoggerService } from '@/common/logger/logger.service';
import * as bcrypt from 'bcrypt';
import { cpf as cpfValidator } from 'cpf-cnpj-validator';

import { CreateEmployeeDto } from '../dtos/create-employee.dto';
import { EmployeeRepository } from '../repositories/employee.repository.interface';
import { ErrorMessages } from '@/common/helper/error-messages';
import { Employee } from '@prisma/client';

@Injectable()
export class CreateEmployeeUseCase {
  constructor(
    @Inject('EmployeeRepository')
    private readonly repository: EmployeeRepository,
    private readonly logger: LoggerService
  ) {}

  async execute(dto: CreateEmployeeDto): Promise<Employee> {
    const cleanedCpf = dto.cpf.replace(/\D/g, '');

    if (!cpfValidator.isValid(cleanedCpf)) {
      await this.logger.error(
        `CPF inválido: ${cleanedCpf}`,
        'CreateEmployeeUseCase'
      );
      throw new BadRequestException(ErrorMessages.INVALID_CPF);
    }

    await this.ensureUniqueFields(dto.email, cleanedCpf);

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    await this.logger.log('Novo funcionário criado', 'CreateEmployeeUseCase');
    return this.repository.create(
      {
        ...dto,
        cpf: cleanedCpf,
        email: dto.email.toLowerCase(),
      },
      hashedPassword
    );
  }

  private async ensureUniqueFields(email: string, cpf: string) {
    const [byEmail, byCpf] = await Promise.all([
      this.repository.findByEmail(email),
      this.repository.findByCpf(cpf),
    ]);

    if (byEmail) {
      throw new BadRequestException(ErrorMessages.EMAIL_DUPLICATE);
    }

    if (byCpf) {
      throw new BadRequestException(ErrorMessages.CPF_DUPLICATE);
    }
  }
}
