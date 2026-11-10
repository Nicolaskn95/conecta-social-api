import { Module } from '@nestjs/common';
import { AuditLogModule } from '@/modules/audit-log/audit-log.module';
import { BeneficiaryController } from './beneficiary.controller';
import { BeneficiaryService } from './beneficiary.service';

@Module({
  imports: [AuditLogModule],
  controllers: [BeneficiaryController],
  providers: [BeneficiaryService],
})
export class BeneficiaryModule {}
