import { Module } from '@nestjs/common';
import { EmployeeService } from './services/employee.service';
import { EmployeeController } from './controllers/employee.controller';
import { CreateEmployeeUseCase } from './use-cases/create-employee.use-case';
import { UpdateEmployeeUseCase } from './use-cases/update-employee.use-case';
import { DisableEmployeeUseCase } from './use-cases/disable-employee.use-case';
import { LoggerModule } from '@/common/logger/logger.module';

@Module({
  imports: [LoggerModule],
  controllers: [EmployeeController],
  providers: [
    EmployeeService,
    CreateEmployeeUseCase,
    UpdateEmployeeUseCase,
    DisableEmployeeUseCase,
  ],
  exports: [EmployeeService],
})
export class EmployeeModule {}
