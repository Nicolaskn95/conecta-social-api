import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateEventInstagramDto {
  @ApiPropertyOptional({ example: 'https://www.instagram.com/p/DKZm15CskZp/' })
  @IsOptional()
  @IsString()
  embedded_instagram?: string;
}
