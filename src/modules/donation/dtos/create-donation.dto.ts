import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  MaxLength,
  IsUUID,
} from 'class-validator';

export class CreateDonationDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID da categoria da doação',
  })
  @IsNotEmpty()
  @IsUUID()
  category_id: string;

  @ApiProperty({
    example: 'Arroz',
    description: 'Nome da doação',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(60)
  name: string;

  @ApiProperty({
    example: 'Arroz tipo 1',
    description: 'Descrição da doação',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  description?: string;

  @ApiProperty({
    example: 10,
    description: 'Quantidade inicial',
  })
  @IsNotEmpty()
  @IsNumber()
  initial_quantity: number;

  @ApiProperty({
    example: 'João da Silva',
    description: 'Nome do doador',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(90)
  donator_name?: string;

  @ApiProperty({
    example: 'Masculino',
    description: 'Gênero (para roupas)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  gender?: string;

  @ApiProperty({
    example: 'G',
    description: 'Tamanho (para roupas/calçados)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  size?: string;
}
