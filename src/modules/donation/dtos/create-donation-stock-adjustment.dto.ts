import { ApiProperty } from '@nestjs/swagger';
import { DonationStockAdjustmentReason } from '@/domain/enums';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  NotEquals,
} from 'class-validator';

const emptyToUndefined = ({ value }: { value: unknown }) =>
  value === '' || value === null ? undefined : value;

export class CreateDonationStockAdjustmentDto {
  @ApiProperty({
    example: -2,
    description: 'Delta da quantidade em estoque. Pode ser positivo ou negativo.',
  })
  @Type(() => Number)
  @IsInt()
  @NotEquals(0)
  delta_quantity: number;

  @ApiProperty({
    enum: DonationStockAdjustmentReason,
    example: DonationStockAdjustmentReason.SPOILAGE,
    description: 'Motivo padronizado para o ajuste de estoque.',
  })
  @IsEnum(DonationStockAdjustmentReason)
  reason: DonationStockAdjustmentReason;

  @ApiProperty({
    example: 'Produto vencido identificado durante conferência.',
    description:
      'Observação complementar do ajuste. Obrigatória quando o motivo for OTHER.',
    required: false,
  })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(500)
  note?: string;
}
