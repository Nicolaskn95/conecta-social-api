import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class InstagramEmbedService {
  private getBase() {
    return (
      process.env.INSTAGRAM_SERVICE_URL ||
      'https://conecta-social-api.vercel.app'
    );
  }

  private getTimeoutMs(): number {
    const v = parseInt(process.env.INSTAGRAM_FETCH_TIMEOUT_MS ?? '', 10);
    return Number.isFinite(v) && v > 0 ? v : 5000;
  }

  async generateEmbeds(urls: string[]): Promise<string[]> {
    if (!urls || urls.length === 0) return [];

    const endpoint = new URL('/generate-embeds', this.getBase()).toString();
    const timeoutMs = this.getTimeoutMs();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urls }),
        signal: controller.signal,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        console.error('InstagramEmbedService: resposta não OK', {
          status: response.status,
          endpoint,
          body: data,
        });
        throw new BadRequestException(
          'Serviço de geração de embeds indisponível'
        );
      }

      if (!data || data.success !== true || !Array.isArray(data.embeds)) {
        console.error('InstagramEmbedService: retorno sem embeds válidos', {
          endpoint,
          body: data,
        });
        throw new BadRequestException(
          'Microserviço de embeds retornou dados inválidos'
        );
      }

      return data.embeds;
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        console.error('InstagramEmbedService: timeout ao gerar embeds', {
          endpoint,
          timeoutMs,
          originalError: err,
        });
        throw new BadRequestException(
          'Geração de embeds demorou demais; tente novamente mais tarde'
        );
      }

      if (
        err?.code === 'ECONNREFUSED' ||
        (err?.cause && err.cause?.code === 'ECONNREFUSED') ||
        String(err).includes('ECONNREFUSED')
      ) {
        console.error(
          'InstagramEmbedService: conexão recusada ao gerar embeds',
          {
            endpoint,
            originalError: err,
          }
        );
        throw new BadRequestException(
          'Serviço de geração de embeds indisponível'
        );
      }

      if (err instanceof BadRequestException) throw err;

      console.error('Erro em InstagramEmbedService.generateEmbeds:', err);
      throw new BadRequestException(
        'Não foi possível gerar embeds do Instagram'
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
