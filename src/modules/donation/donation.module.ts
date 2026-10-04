import { Module } from '@nestjs/common';
import { DonationController } from './controllers/donation.controller';
import { DonationService } from './services/donation.service';
import { DonationImageService } from './services/donation-image.service';
import { AuditLogModule } from '@/modules/audit-log/audit-log.module';

@Module({
  imports: [AuditLogModule],
  controllers: [DonationController],
  providers: [DonationService, DonationImageService],
  exports: [DonationService],
})
export class DonationModule {}
