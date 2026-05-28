import { Module } from '@nestjs/common';
import { PrismaModule } from '@/config/prisma/prisma.module';
import { DonationToFamilyController } from './donation-to-family.controller';
import { DonationToFamilyService } from './donation-to-family.service';
import { AuditLogModule } from '@/modules/audit-log/audit-log.module';

@Module({
  imports: [PrismaModule, AuditLogModule],
  controllers: [DonationToFamilyController],
  providers: [DonationToFamilyService],
})
export class DonationToFamilyModule {}
