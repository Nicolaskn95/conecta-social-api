import { Injectable, NotFoundException } from '@nestjs/common';
import { EmployeeRepository } from '@/domain/repositories';
import { ErrorMessages } from '@/common/helper/error-messages';
import { Employee } from '@/domain/entities';

@Injectable()
export class DisableEmployeeUseCase {
  constructor(private readonly repository: EmployeeRepository) {}

  async execute(id: string): Promise<Employee> {
    const employee = await this.repository.findById(id);

    if (!employee) {
      throw new NotFoundException(ErrorMessages.EMPLOYEE_NOT_FOUND);
    }

    return this.repository.softDelete(id);
  }
}
