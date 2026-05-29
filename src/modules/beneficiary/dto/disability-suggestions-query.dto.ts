import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const emptyToUndefined = ({ value }: { value: unknown }) =>
  value === '' || value === null ? undefined : value;

export class DisabilitySuggestionsQueryDto {
  @ApiPropertyOptional({ description: 'Texto para filtrar sugestões' })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(90)
  search?: string;

  @ApiPropertyOptional({ description: 'Limite de itens', default: 10, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
