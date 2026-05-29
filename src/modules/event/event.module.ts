import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { PrismaModule } from '@/config/prisma/prisma.module';
import { InstagramContentService } from './services/instagram-content.service';
import { AuditLogModule } from '@/modules/audit-log/audit-log.module';

@Module({
  imports: [PrismaModule, AuditLogModule],
  controllers: [EventController],
  providers: [EventService, InstagramContentService],
})
export class EventModule {}
