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
      donator_name: '',
      gender: '',
      size: '',
      active: '',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto).toEqual(
      expect.objectContaining({
        category_id: undefined,
        name: undefined,
        description: undefined,
        donator_name: undefined,
        gender: undefined,
        size: undefined,
        active: undefined,
      })
    );
  });

  it('converte boolean enviado como string', async () => {
    const dto = plainToInstance(UpdateDonationDto, {
      active: 'false',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.active).toBe(false);
  });

  it('rejeita campos legados de estoque com whitelist estrita', async () => {
    const dto = plainToInstance(UpdateDonationDto, {
      current_quantity: 10,
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('current_quantity');
    expect(errors[0].constraints).toEqual(
      expect.objectContaining({
        whitelistValidation: expect.any(String),
      })
    );
  });
});
