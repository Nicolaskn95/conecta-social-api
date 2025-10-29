import { Injectable, BadRequestException } from '@nestjs/common';
import { InstagramValidationResponse } from '../interfaces/instagram-validation-response.interface';

@Injectable()
export class InstagramValidatorService {
  private getBase() {
    return process.env.INSTAGRAM_SERVICE_URL || 'http://localhost:3008';
  }

  private getTimeoutMs(): number {
    const v = parseInt(process.env.INSTAGRAM_FETCH_TIMEOUT_MS ?? '', 10);
    return Number.isFinite(v) && v > 0 ? v : 5000;
  }

  async validate(url: string): Promise<string> {
    const base = this.getBase();
    const validateEndpoint = new URL('/validate-url', base).toString();
    const timeoutMs = this.getTimeoutMs();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(validateEndpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      });

      // tenta parsear o body (pode lançar)
      const data: InstagramValidationResponse | null = await response
        .json()
        .catch(() => null);

      // se o serviço respondeu com status de erro (503/5xx ou 4xx)
      if (!response.ok) {
        console.error('InstagramValidatorService: resposta não OK', {
          status: response.status,
          endpoint: validateEndpoint,
          body: data,
        });
        // tratar como indisponibilidade/erro do serviço, não como "URL inválida"
        throw new BadRequestException(
          'Serviço de validação do Instagram indisponível'
        );
      }

      if (!data) {
        console.error('InstagramValidatorService: body inválido/ausente', {
          endpoint: validateEndpoint,
        });
        throw new BadRequestException(
          'Serviço de validação do Instagram retornou dados inválidos'
        );
      }

      if (data.success !== true || data.isValid !== true) {
        // validação explícita de URL inválida
        return Promise.reject(
          new BadRequestException('URL do Instagram inválida')
        );
      }

      // sucesso: retorna a URL normalizada pelo microserviço
      return data.url;
    } catch (err: any) {
      // logs internos detalhados para debug em produção
      if (err?.name === 'AbortError') {
        console.error('InstagramValidatorService: timeout ao validar URL', {
          endpoint: validateEndpoint,
          timeoutMs,
          originalError: err,
        });
        throw new BadRequestException(
          'Validação do Instagram demorou demais; tente novamente mais tarde'
        );
      }

      // erros de rede (ex: ECONNREFUSED)
      if (
        err?.code === 'ECONNREFUSED' ||
        (err?.cause && err.cause?.code === 'ECONNREFUSED') ||
        String(err).includes('ECONNREFUSED')
      ) {
        console.error(
          'InstagramValidatorService: conexão recusada ao validar URL',
          {
            endpoint: validateEndpoint,
            originalError: err,
          }
        );
        throw new BadRequestException(
          'Serviço de validação do Instagram indisponível'
        );
      }

      // se já é BadRequestException (URL inválida), propaga
      if (err instanceof BadRequestException) throw err;

      // fallback genérico
      console.error(
        'InstagramValidatorService: erro inesperado ao validar URL',
        {
          endpoint: validateEndpoint,
          originalError: err,
        }
      );
      throw new BadRequestException(
        'Não foi possível validar a URL do Instagram'
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
