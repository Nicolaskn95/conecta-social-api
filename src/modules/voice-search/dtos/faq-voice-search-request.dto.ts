import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class FaqVoiceSearchRequestDto {
  @ApiProperty({
    example: 'como faço para doar roupas',
    description: 'Texto reconhecido pelo navegador ou digitado pelo usuário.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  query: string;
}
