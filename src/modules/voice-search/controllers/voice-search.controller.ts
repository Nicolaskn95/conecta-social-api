import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FaqChatbotRequestDto } from '../dtos/faq-chatbot-request.dto';
import { FaqVoiceSearchRequestDto } from '../dtos/faq-voice-search-request.dto';
import { VoiceSearchService } from '../services/voice-search.service';

@ApiTags('Voice Search')
@Controller('voice-search')
export class VoiceSearchController {
  constructor(private readonly voiceSearchService: VoiceSearchService) {}

  @Post('faq')
  @ApiOperation({
    summary: 'Buscar respostas da FAQ usando texto reconhecido por voz',
  })
  @ApiResponse({
    status: 201,
    description: 'Resultado da busca com processamento linguístico',
  })
  searchFaq(@Body() dto: FaqVoiceSearchRequestDto) {
    return this.voiceSearchService.searchFaq(dto.query);
  }

  @Post('chatbot')
  @ApiOperation({
    summary: 'Responder dúvidas da FAQ com LLM (Maritaca) e fallback local',
  })
  @ApiResponse({
    status: 201,
    description: 'Resposta do chatbot com contexto da FAQ',
  })
  chatWithLlm(@Body() dto: FaqChatbotRequestDto) {
    return this.voiceSearchService.chatFaq(dto.query, dto.history ?? []);
  }
}
