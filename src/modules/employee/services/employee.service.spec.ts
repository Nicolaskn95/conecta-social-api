import { NotFoundException } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { EmployeeRepository } from '../repositories/employee.repository.interface';
import { CreateEmployeeUseCase } from '../use-cases/create-employee.use-case';
import { UpdateEmployeeUseCase } from '../use-cases/update-employee.use-case';
import { DisableEmployeeUseCase } from '../use-cases/disable-employee.use-case';
import { ErrorMessages } from '@/common/helper/error-messages';

describe('EmployeeService', () => {
  let repository: jest.Mocked<EmployeeRepository>;
  let createUseCase: jest.Mocked<CreateEmployeeUseCase>;
  let updateUseCase: jest.Mocked<UpdateEmployeeUseCase>;
  let disableUseCase: jest.Mocked<DisableEmployeeUseCase>;
  let service: EmployeeService;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findAllActives: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByCpf: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      findPaginated: jest.fn(),
      countActives: jest.fn(),
    };

    createUseCase = { execute: jest.fn() } as any;
    updateUseCase = { execute: jest.fn() } as any;
    disableUseCase = { execute: jest.fn() } as any;

    service = new EmployeeService(
      repository as any,
      createUseCase,
      updateUseCase,
      disableUseCase
    );
  });

  it('delega criação para o use case', async () => {
    const dto = { name: 'John' } as any;
    createUseCase.execute.mockResolvedValue({ id: '1', ...dto } as any);

    const result = await service.create(dto);

    expect(createUseCase.execute).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: '1', ...dto });
  });

  it('lança NotFound quando funcionário não existe', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toThrow(
      new NotFoundException(ErrorMessages.EMPLOYEE_NOT_FOUND)
    );
  });

  it('retorna paginação correta em findAllPaginated', async () => {
    repository.findPaginated.mockResolvedValue([{ id: 'e1' } as any]);
    repository.countActives.mockResolvedValue(5);

    const result = await service.findAllPaginated(2, 2);

    expect(repository.findPaginated).toHaveBeenCalledWith(2, 2);
    expect(result).toEqual(
      expect.objectContaining({
        page: 2,
        next_page: 3,
        previous_page: 1,
        total_pages: 3,
        is_last_page: false,
        list: [{ id: 'e1' }],
      })
    );
  });

  it('usa use case para remover (soft delete)', async () => {
    disableUseCase.execute.mockResolvedValue({ id: 'e1', active: false } as any);
    const result = await service.remove('e1');
    expect(disableUseCase.execute).toHaveBeenCalledWith('e1');
    expect(result).toEqual({ id: 'e1', active: false });
  });
});
