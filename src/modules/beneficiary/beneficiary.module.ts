import { Module } from '@nestjs/common';
import { PrismaModule } from '@/config/prisma/prisma.module';
import { AuditLogModule } from '@/modules/audit-log/audit-log.module';
import { BeneficiaryController } from './beneficiary.controller';
import { BeneficiaryService } from './beneficiary.service';

@Module({
  imports: [PrismaModule, AuditLogModule],
  controllers: [BeneficiaryController],
  providers: [BeneficiaryService],
})
export class BeneficiaryModule {}
