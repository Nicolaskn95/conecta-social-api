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
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ResourcesModule } from './modules/resources/resources.module';
import { VoiceSearchModule } from './modules/voice-search/voice-search.module';

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
    DashboardModule,
    ResourcesModule,
    VoiceSearchModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
