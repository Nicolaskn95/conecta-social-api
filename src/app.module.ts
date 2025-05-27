import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './config/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { EventModule } from './modules/event/event.module';

@Module({
  imports: [PrismaModule, AuthModule, EmployeeModule, EventModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
