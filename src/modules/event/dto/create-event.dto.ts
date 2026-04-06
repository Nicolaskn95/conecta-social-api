import {
  IsString,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsInt,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventStatus } from '@prisma/client';

export class CreateEventDto {
  @ApiProperty({ example: 'Campanha de Natal', description: 'Nome do evento' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Evento para doação de brinquedos' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: '2025-12-24T18:00:00Z',
    description: 'Data do evento em formato ISO',
  })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: 'Seja bem-vindo ao nosso evento!' })
  @IsOptional()
  @IsString()
  greeting_description?: string;

  @ApiPropertyOptional({
    example: 120,
    description: 'Número de participantes esperados',
  })
  @IsOptional()
  @IsInt()
  attendance?: number;

  @ApiPropertyOptional({ example: '<iframe src="..."></iframe>' })
  @IsOptional()
  @IsString()
  embedded_instagram?: string;

  @ApiProperty({ example: '01001-000' })
  @IsString()
  cep: string;

  @ApiProperty({ example: 'Rua das Flores' })
  @IsString()
  street: string;

  @ApiProperty({ example: 'Centro' })
  @IsString()
  neighborhood: string;

  @ApiProperty({ example: '123' })
  @IsString()
  number: string;

  @ApiProperty({ example: 'São Paulo' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'São Paulo' })
  @IsString()
  state: string;

  @ApiPropertyOptional({ example: 'Próximo à praça' })
  @IsOptional()
  @IsString()
  complement?: string;

  @ApiProperty({
    enum: EventStatus,
    example: EventStatus.SCHEDULED,
    description: 'Status do evento',
  })
  @IsEnum(EventStatus)
  status: EventStatus;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
