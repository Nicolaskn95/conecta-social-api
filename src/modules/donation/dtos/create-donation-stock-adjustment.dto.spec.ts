import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DonationStockAdjustmentReason } from '@prisma/client';
import { CreateDonationStockAdjustmentDto } from './create-donation-stock-adjustment.dto';

describe('CreateDonationStockAdjustmentDto', () => {
  it('aceita payload válido', async () => {
    const dto = plainToInstance(CreateDonationStockAdjustmentDto, {
      delta_quantity: '-2',
      reason: DonationStockAdjustmentReason.SPOILAGE,
      note: 'perda por validade',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.delta_quantity).toBe(-2);
  });

  it('rejeita delta igual a zero', async () => {
    const dto = plainToInstance(CreateDonationStockAdjustmentDto, {
      delta_quantity: 0,
      reason: DonationStockAdjustmentReason.LOSS,
    });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'delta_quantity')).toBe(
      true
    );
  });

  it('rejeita motivo fora do enum', async () => {
    const dto = plainToInstance(CreateDonationStockAdjustmentDto, {
      delta_quantity: -1,
      reason: 'INVALID',
    });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'reason')).toBe(true);
  });
});
