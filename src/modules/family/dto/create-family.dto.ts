import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, Min, Max, MaxLength } from 'class-validator';
import { DeliveryMode } from '@/domain/enums';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateFamilyDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2147483647)
  monthly_income_cents?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || null : value
  )
  @IsOptional()
  @IsString()
  @MaxLength(250)
  housing_description?: string | null;

  @ApiPropertyOptional({ enum: DeliveryMode, nullable: true })
  @IsOptional()
  @IsEnum(DeliveryMode)
  preferred_delivery_mode?: DeliveryMode | null;

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
