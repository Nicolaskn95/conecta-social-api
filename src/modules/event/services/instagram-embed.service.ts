import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class InstagramEmbedService {
  private getBase() {
    return process.env.INSTAGRAM_SERVICE_URL || 'http://localhost:3008';
  }

  async generateEmbeds(urls: string[]): Promise<string[]> {
    if (!urls || urls.length === 0) return [];

    const endpoint = new URL('/generate-embeds', this.getBase()).toString();

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urls }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data) {
        console.error('InstagramEmbedService: resposta inválida', {
          status: response.status,
          body: data,
        });
        throw new BadRequestException('Erro ao gerar embeds do Instagram');
      }

      if (data.success !== true || !Array.isArray(data.embeds)) {
        console.error(
          'InstagramEmbedService: retorno sem embeds válidos',
          data
        );
        throw new BadRequestException(
          'Microserviço de embeds retornou dados inválidos'
        );
      }

      return data.embeds;
    } catch (err) {
      console.error('Erro em InstagramEmbedService.generateEmbeds:', err);
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException(
        'Não foi possível gerar embeds do Instagram'
      );
    }
  }
}
