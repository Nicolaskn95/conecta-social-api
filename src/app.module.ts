import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DatabaseModule } from './infra/database/database.module';
import { AuthModule } from './auth/auth.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { EventModule } from './modules/event/event.module';
import { LoggerModule } from './common/logger/logger.module';
import { FamilyModule } from './modules/family/family.module';
import { CategoryModule } from './modules/category/category.module';
import { DonationModule } from './modules/donation/donation.module';
import { DonationToFamilyModule } from './modules/donation-to-family/donation-to-family.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ResourcesModule } from './modules/resources/resources.module';
import { VoiceSearchModule } from './modules/voice-search/voice-search.module';
import { BeneficiaryModule } from './modules/beneficiary/beneficiary.module';

@Module({
  imports: [
    DatabaseModule.forRoot(),
    AuthModule,
    EmployeeModule,
    EventModule,
    LoggerModule,
    FamilyModule,
    CategoryModule,
    DonationModule,
    DonationToFamilyModule,
    DashboardModule,
    ResourcesModule,
    VoiceSearchModule,
    BeneficiaryModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
