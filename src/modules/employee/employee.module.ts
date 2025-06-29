import { Module } from '@nestjs/common';
import { EmployeeService } from './services/employee.service';
import { EmployeeController } from './controllers/employee.controller';
import { PrismaModule } from '@/config/prisma/prisma.module';
import { EmployeeRepositoryImpl } from './repositories/employee.repository';
import { CreateEmployeeUseCase } from './use-cases/create-employee.use-case';
import { UpdateEmployeeUseCase } from './use-cases/update-employee.use-case';
import { DisableEmployeeUseCase } from './use-cases/disable-employee.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [EmployeeController],
  providers: [
    EmployeeService,
    CreateEmployeeUseCase,
    UpdateEmployeeUseCase,
    DisableEmployeeUseCase,
    {
      provide: 'EmployeeRepository',
      useClass: EmployeeRepositoryImpl,
    },
  ],
  exports: [EmployeeService],
})
export class EmployeeModule {}
