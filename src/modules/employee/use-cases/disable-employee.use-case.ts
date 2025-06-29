import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EmployeeRepository } from '../repositories/employee.repository.interface';
import { ErrorMessages } from '@/common/helper/error-messages';
import { Employee } from '@prisma/client';

@Injectable()
export class DisableEmployeeUseCase {
  constructor(
    @Inject('EmployeeRepository')
    private readonly repository: EmployeeRepository
  ) {}

  async execute(id: string): Promise<Employee> {
    const employee = await this.repository.findById(id);

    if (!employee) {
      throw new NotFoundException(ErrorMessages.EMPLOYEE_NOT_FOUND);
    }

    return this.repository.softDelete(id);
  }
}
