import { Module } from '@nestjs/common';
import { AuditLogModule } from '@/modules/audit-log/audit-log.module';
import { NeedsController } from './needs.controller';
import { NeedsService } from './needs.service';

@Module({
  imports: [AuditLogModule],
  controllers: [NeedsController],
  providers: [NeedsService],
})
export class NeedsModule {}
