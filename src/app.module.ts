import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './config/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EmployeeModule } from './modules/employee/employee.module';

@Module({
  imports: [PrismaModule, AuthModule, EmployeeModule],
  controllers: [AppController], // ❌ Remova EmployeeController
  providers: [], // ❌ Remova EmployeeService
})
export class AppModule {}
