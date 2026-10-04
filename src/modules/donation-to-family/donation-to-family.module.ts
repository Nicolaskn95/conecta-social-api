import { Module } from '@nestjs/common';
import { DonationToFamilyController } from './donation-to-family.controller';
import { DonationToFamilyService } from './donation-to-family.service';
import { AuditLogModule } from '@/modules/audit-log/audit-log.module';

@Module({
  imports: [AuditLogModule],
  controllers: [DonationToFamilyController],
  providers: [DonationToFamilyService],
  exports: [DonationToFamilyService],
})
export class DonationToFamilyModule {}
