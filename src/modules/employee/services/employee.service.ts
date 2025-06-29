import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EmployeeRepository } from '../repositories/employee.repository.interface';
import { CreateEmployeeDto } from '../dtos/create-employee.dto';
import { UpdateEmployeeDto } from '../dtos/update-employee.dto';
import { ErrorMessages } from '@/common/helper/error-messages';
import { CreateEmployeeUseCase } from '../use-cases/create-employee.use-case';
import { UpdateEmployeeUseCase } from '../use-cases/update-employee.use-case';
import { DisableEmployeeUseCase } from '../use-cases/disable-employee.use-case';

@Injectable()
export class EmployeeService {
  constructor(
    @Inject('EmployeeRepository')
    private readonly repository: EmployeeRepository,
    private readonly createEmployee: CreateEmployeeUseCase,
    private readonly updateEmployee: UpdateEmployeeUseCase,
    private readonly disableEmployee: DisableEmployeeUseCase
  ) {}

  async create(dto: CreateEmployeeDto) {
    return this.createEmployee.execute(dto);
  }

  async findAll() {
    return this.repository.findAll();
  }

  async findAllActives() {
    return this.repository.findAllActives();
  }

  async findOne(id: string) {
    const employee = await this.repository.findById(id);
    if (!employee) {
      throw new NotFoundException(ErrorMessages.EMPLOYEE_NOT_FOUND);
    }
    return employee;
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    return this.updateEmployee.execute(id, dto);
  }

  async remove(id: string) {
    return this.disableEmployee.execute(id);
  }

  private async ensureUniqueFields(email: string, cpf: string) {
    const [byEmail, byCpf] = await Promise.all([
      this.repository.findByEmail(email),
      this.repository.findByCpf(cpf),
    ]);

    if (byEmail) throw new BadRequestException(ErrorMessages.EMAIL_DUPLICATE);
    if (byCpf) throw new BadRequestException(ErrorMessages.CPF_DUPLICATE);
  }
}
