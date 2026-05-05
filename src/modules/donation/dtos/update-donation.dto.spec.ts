import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateDonationDto } from './update-donation.dto';

describe('UpdateDonationDto', () => {
  it('permite payload vazio no update', async () => {
    const dto = plainToInstance(UpdateDonationDto, {});

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('trata strings vazias como campos ausentes', async () => {
    const dto = plainToInstance(UpdateDonationDto, {
      category_id: '',
      name: '',
      description: '',
      initial_quantity: '',
      current_quantity: '',
      donator_name: '',
      gender: '',
      size: '',
      active: '',
      available: '',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto).toEqual(
      expect.objectContaining({
        category_id: undefined,
        name: undefined,
        description: undefined,
        initial_quantity: undefined,
        current_quantity: undefined,
        donator_name: undefined,
        gender: undefined,
        size: undefined,
        active: undefined,
        available: undefined,
      })
    );
  });

  it('converte numeros e booleanos enviados como string', async () => {
    const dto = plainToInstance(UpdateDonationDto, {
      initial_quantity: '10',
      current_quantity: '4',
      active: 'false',
      available: 'true',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.initial_quantity).toBe(10);
    expect(dto.current_quantity).toBe(4);
    expect(dto.active).toBe(false);
    expect(dto.available).toBe(true);
  });
});
