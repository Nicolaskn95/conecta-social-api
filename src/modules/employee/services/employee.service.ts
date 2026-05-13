import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { EmployeeRepository } from '../repositories/employee.repository.interface';
import { CreateEmployeeDto } from '../dtos/create-employee.dto';
import { UpdateEmployeeDto } from '../dtos/update-employee.dto';
import { UpdateEmployeeBasicDto } from '../dtos/update-employee-basic.dto';
import { ErrorMessages } from '@/common/helper/error-messages';
import { CreateEmployeeUseCase } from '../use-cases/create-employee.use-case';
import { UpdateEmployeeUseCase } from '../use-cases/update-employee.use-case';
import { DisableEmployeeUseCase } from '../use-cases/disable-employee.use-case';
import { Employee, EmployeeRole, Prisma } from '@prisma/client';

@Injectable()
export class EmployeeService {
  constructor(
    @Inject('EmployeeRepository')
    private readonly repository: EmployeeRepository,
    private readonly createEmployee: CreateEmployeeUseCase,
    private readonly updateEmployee: UpdateEmployeeUseCase,
    private readonly disableEmployee: DisableEmployeeUseCase
  ) {}

  async create(dto: CreateEmployeeDto, actor?: Employee) {
    if (
      actor?.role === EmployeeRole.MANAGER &&
      dto.role !== EmployeeRole.VOLUNTEER
    ) {
      throw new ForbiddenException('Gerentes só podem cadastrar voluntários.');
    }

    const employee = await this.createEmployee.execute(dto);
    return this.sanitizeEmployee(employee);
  }

  async findAll(actor?: Employee) {
    if (actor?.role === EmployeeRole.MANAGER) {
      const employees = await this.repository.findAllActives(EmployeeRole.VOLUNTEER);
      return employees.map((employee) => this.sanitizeEmployee(employee));
    }

    const employees = await this.repository.findAll();
    return employees.map((employee) => this.sanitizeEmployee(employee));
  }

  async findAllActives(actor?: Employee) {
    const employees = await this.repository.findAllActives(
      this.getManagedRoleFilter(actor)
    );
    return employees.map((employee) => this.sanitizeEmployee(employee));
  }

  async findAllPaginated(page = 1, size = 10, actor?: Employee) {
    const skip = (page - 1) * size;
    const roleFilter = this.getManagedRoleFilter(actor);

    const [employees, total] = await Promise.all([
      this.repository.findPaginated(skip, size, roleFilter),
      this.repository.countActives(roleFilter),
    ]);

    const totalPages = Math.ceil(total / size);
    const isLastPage = page >= totalPages;

    return {
      page,
      next_page: isLastPage ? page : page + 1,
      is_last_page: isLastPage,
      previous_page: page > 1 ? page - 1 : 1,
      total_pages: totalPages,
      list: employees.map((employee) => this.sanitizeEmployee(employee)),
    };
  }

  async findOne(id: string, actor?: Employee) {
    const employee = await this.repository.findById(id);
    if (!employee) {
      throw new NotFoundException(ErrorMessages.EMPLOYEE_NOT_FOUND);
    }

    this.ensureCanManageEmployee(actor, employee);
    return this.sanitizeEmployee(employee);
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    return this.updateEmployee.execute(id, dto);
  }

  async updateBasic(id: string, dto: UpdateEmployeeBasicDto, actor?: Employee) {
    const employee = await this.findOne(id, actor);
    return this.sanitizeEmployee(await this.updateBasicData(employee.id, dto));
  }

  async updateOwnProfile(employee: Employee, dto: UpdateEmployeeBasicDto) {
    return this.sanitizeEmployee(await this.updateBasicData(employee.id, dto));
  }

  async updateRole(id: string, role: EmployeeRole) {
    await this.findOne(id);
    return this.sanitizeEmployee(await this.repository.update(id, { role }));
  }

  async updatePassword(id: string, password: string) {
    await this.findOne(id);
    const hashedPassword = await bcrypt.hash(password, 10);
    return this.sanitizeEmployee(
      await this.repository.update(id, { password: hashedPassword })
    );
  }

  async updateOwnPassword(
    employee: Employee,
    currentPassword: string,
    newPassword: string
  ) {
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      employee.password
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException(ErrorMessages.INVALID_CREDENTIALS);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return this.sanitizeEmployee(
      await this.repository.update(employee.id, { password: hashedPassword })
    );
  }

  async remove(id: string) {
    return this.sanitizeEmployee(await this.disableEmployee.execute(id));
  }

  private async updateBasicData(id: string, dto: UpdateEmployeeBasicDto) {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(ErrorMessages.EMPLOYEE_NOT_FOUND);
    }

    const cleanedCpf = dto.cpf ? dto.cpf.replace(/\D/g, '') : undefined;
    const normalizedEmail = dto.email?.toLowerCase();

    if (normalizedEmail && normalizedEmail !== existing.email) {
      const emailExists = await this.repository.findByEmail(normalizedEmail);
      if (emailExists) {
        throw new BadRequestException(ErrorMessages.EMAIL_DUPLICATE);
      }
    }

    if (cleanedCpf && cleanedCpf !== existing.cpf) {
      const cpfExists = await this.repository.findByCpf(cleanedCpf);
      if (cpfExists) {
        throw new BadRequestException(ErrorMessages.CPF_DUPLICATE);
      }
    }

    const data: Prisma.EmployeeUpdateInput = {
      ...dto,
      cpf: cleanedCpf,
      email: normalizedEmail,
      birth_date: dto.birth_date ? new Date(dto.birth_date) : undefined,
    };

    return this.repository.update(id, data);
  }

  private getManagedRoleFilter(actor?: Employee) {
    return actor?.role === EmployeeRole.MANAGER
      ? EmployeeRole.VOLUNTEER
      : undefined;
  }

  private ensureCanManageEmployee(
    actor: Employee | undefined,
    employee: Employee
  ) {
    if (
      actor?.role === EmployeeRole.MANAGER &&
      employee.role !== EmployeeRole.VOLUNTEER
    ) {
      throw new ForbiddenException('Gerentes só podem gerenciar voluntários.');
    }
  }

  private sanitizeEmployee<T extends Partial<Employee>>(employee: T) {
    const { password: _password, ...safeEmployee } = employee;
    return safeEmployee;
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
