import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class FaqChatHistoryMessageDto {
  @ApiProperty({
    enum: ['user', 'assistant'],
    example: 'user',
    description: 'Papel da mensagem no histórico do chat.',
  })
  @IsString()
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @ApiProperty({
    example: 'Como posso ajudar no próximo evento?',
    description: 'Texto da mensagem no histórico do chat.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  content: string;
}

export class FaqChatbotRequestDto {
  @ApiProperty({
    example: 'Quero ser voluntário, como faço?',
    description: 'Mensagem atual enviada pelo usuário para o chatbot.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  query: string;

  @ApiPropertyOptional({
    type: [FaqChatHistoryMessageDto],
    description:
      'Histórico opcional para manter contexto em conversas com múltiplos turnos.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FaqChatHistoryMessageDto)
  history?: FaqChatHistoryMessageDto[];
}
