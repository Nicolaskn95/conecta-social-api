import { Injectable, BadRequestException } from '@nestjs/common';
import { InstagramValidationResponse } from '../interfaces/instagram-validation-response.interface';

@Injectable()
export class InstagramValidatorService {
  async validate(url: string): Promise<string> {
    const base = process.env.INSTAGRAM_SERVICE_URL || 'http://localhost:3000';
    const validateEndpoint = new URL('/validate-url', base).toString();

    try {
      const response = await fetch(validateEndpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data: InstagramValidationResponse = await response.json();

      if (!response.ok || !data.success || !data.isValid) {
        throw new BadRequestException('URL do Instagram inválida');
      }

      return data.url;
    } catch (err) {
      console.error('Erro ao validar URL do Instagram:', err);
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException(
        'Não foi possível validar a URL do Instagram'
      );
    }
  }
}
