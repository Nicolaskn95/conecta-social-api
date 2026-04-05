import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { PrismaModule } from '@/config/prisma/prisma.module';
import { InstagramContentService } from './services/instagram-content.service';

@Module({
  imports: [PrismaModule],
  controllers: [EventController],
  providers: [EventService, InstagramContentService],
})
export class EventModule {}
