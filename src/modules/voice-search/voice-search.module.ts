import { Module } from '@nestjs/common';
import { VoiceSearchController } from './controllers/voice-search.controller';
import { VoiceSearchService } from './services/voice-search.service';

@Module({
  controllers: [VoiceSearchController],
  providers: [VoiceSearchService],
})
export class VoiceSearchModule {}
