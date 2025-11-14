import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateFamilyDto {
  @ApiProperty({ description: 'Nome da família' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Rua' })
  @IsString()
  street: string;

  @ApiProperty({ description: 'Número' })
  @IsString()
  number: string;

  @ApiProperty({ description: 'Bairro' })
  @IsString()
  neighborhood: string;

  @ApiProperty({ description: 'Cidade' })
  @IsString()
  city: string;

  @ApiProperty({ description: 'Estado' })
  @IsString()
  state: string;

  @ApiProperty({ description: 'CEP' })
  @IsString()
  cep: string;

  @ApiProperty({ description: 'Status ativo/inativo' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
