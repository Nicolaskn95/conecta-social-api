import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './config/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { EventModule } from './modules/event/event.module';
import { LoggerModule } from './common/logger/logger.module';
import { FamilyModule } from './modules/family/family.module';
import { CategoryModule } from './modules/category/category.module';
import { DonationModule } from './modules/donation/donation.module';
import { EmailModule } from './modules/email/email.module';
import { PasswordResetModule } from './modules/password-reset/password-reset.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    EmployeeModule,
    EventModule,
    LoggerModule,
    FamilyModule,
    CategoryModule,
    DonationModule,
    EmailModule,
    PasswordResetModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
