import { BadRequestException } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsEnum, IsObject, IsOptional, IsUUID } from 'class-validator';
import { DonationCondition } from '@/domain/enums';
import { ItemSpecifications } from '@/domain/entities';

function blankToNull(value: unknown): unknown {
  return typeof value === 'string' && !value.trim() ? null : value;
}

export class DonationComplementsDto {
  @Transform(({ value }) => blankToNull(value))
  @IsOptional()
  @IsUUID()
  item_type_id?: string | null;

  @Transform(({ value }) => blankToNull(value))
  @IsOptional()
  @IsEnum(DonationCondition)
  condition?: DonationCondition | null;

  @Transform(({ value }) => {
    const normalized = blankToNull(value);
    if (typeof normalized !== 'string') return normalized;
    try {
      const parsed: unknown = JSON.parse(normalized);
      if (parsed === null || typeof parsed === 'string') {
        throw new Error('Objeto esperado');
      }
      return parsed;
    } catch {
      throw new BadRequestException(
        'Especificações devem ser um objeto JSON válido.'
      );
    }
  })
  @IsOptional()
  @IsObject()
  specifications?: ItemSpecifications | null;
}
