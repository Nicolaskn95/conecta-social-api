import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { InstagramContentService } from './services/instagram-content.service';
import { AuditLogModule } from '@/modules/audit-log/audit-log.module';

@Module({
  imports: [AuditLogModule],
  controllers: [EventController],
  providers: [EventService, InstagramContentService],
  exports: [EventService],
})
export class EventModule {}
