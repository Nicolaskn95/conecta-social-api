import { BadRequestException } from '@nestjs/common';
import { InstagramContentService } from './instagram-content.service';

describe('InstagramContentService', () => {
  let service: InstagramContentService;

  beforeEach(() => {
    service = new InstagramContentService();
  });

  it('valida uma URL válida do Instagram', () => {
    const url = 'https://www.instagram.com/p/ABC123xyz_-/';

    expect(service.validateUrl(url)).toBe(url);
    expect(service.extractPostId(url)).toBe('ABC123xyz_-');
  });

  it('lança erro para URL inválida do Instagram', () => {
    expect(() => service.validateUrl('https://example.com/post')).toThrow(
      new BadRequestException('URL do Instagram inválida')
    );
  });

  it('gera o embed HTML de um post válido', () => {
    const url = 'https://www.instagram.com/p/POST123/';

    expect(service.generateEmbed(url)).toBe(`<blockquote class="instagram-media"
  data-instgrm-permalink="${url}"
  data-instgrm-version="14"
  style="max-width:540px; min-width:326px; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);">
</blockquote>`);
  });

  it('gera embeds em lote preservando ordem e fallback para URL inválida', () => {
    const urls = [
      'https://www.instagram.com/p/VALID_1/',
      'https://invalid-url.com/post',
      'https://www.instagram.com/p/VALID_2/',
    ];

    expect(service.generateEmbeds(urls)).toEqual([
      `<blockquote class="instagram-media"
  data-instgrm-permalink="https://www.instagram.com/p/VALID_1/"
  data-instgrm-version="14"
  style="max-width:540px; min-width:326px; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);">
</blockquote>`,
      '<!-- URL inválida: https://invalid-url.com/post -->',
      `<blockquote class="instagram-media"
  data-instgrm-permalink="https://www.instagram.com/p/VALID_2/"
  data-instgrm-version="14"
  style="max-width:540px; min-width:326px; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);">
</blockquote>`,
    ]);
  });
});
