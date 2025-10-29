import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { PrismaModule } from '@/config/prisma/prisma.module';
import { InstagramValidatorService } from './services/instagram-validator.service';
import { InstagramEmbedService } from './services/instagram-embed.service';

@Module({
  imports: [PrismaModule],
  controllers: [EventController],
  providers: [EventService, InstagramValidatorService, InstagramEmbedService],
})
export class EventModule {}
