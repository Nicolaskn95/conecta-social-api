import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateDonationDto } from './update-donation.dto';

describe('Complementos opcionais da doação', () => {
  it('distingue omissão de limpeza explícita em JSON e multipart', async () => {
    expect(
      plainToInstance(UpdateDonationDto, {}).specifications
    ).toBeUndefined();

    for (const value of [null, '']) {
      const dto = plainToInstance(UpdateDonationDto, { specifications: value });
      expect(dto.specifications).toBeNull();
      expect(await validate(dto)).toEqual([]);
    }
  });

  it('interpreta objeto serializado em multipart', async () => {
    const dto = plainToInstance(UpdateDonationDto, {
      specifications: '{"shoe_size_br":36}',
    });
    expect(dto.specifications).toEqual({ shoe_size_br: 36 });
    expect(await validate(dto)).toEqual([]);
  });

  it('rejeita JSON inválido e valores que não são objetos', async () => {
    expect(() =>
      plainToInstance(UpdateDonationDto, { specifications: '{' })
    ).toThrow(BadRequestException);

    const dto = plainToInstance(UpdateDonationDto, { specifications: '[]' });
    expect(await validate(dto)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'specifications' }),
      ])
    );
  });
});
