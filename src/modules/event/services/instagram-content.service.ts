import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class InstagramContentService {
  private static readonly INSTAGRAM_POST_REGEX =
    /https:\/\/www\.instagram\.com\/p\/([A-Za-z0-9_-]+)\/?/;

  extractPostId(url: string): string | null {
    try {
      const match = url.match(InstagramContentService.INSTAGRAM_POST_REGEX);
      return match?.[1] ?? null;
    } catch (error) {
      console.error('Erro ao extrair POST_ID:', error);
      return null;
    }
  }

  validateUrl(url: string): string {
    const postId = this.extractPostId(url);

    if (!postId) {
      throw new BadRequestException('URL do Instagram inválida');
    }

    return url;
  }

  generateEmbed(url: string): string {
    const postId = this.extractPostId(url);

    if (!postId) {
      return `<!-- URL inválida: ${url} -->`;
    }

    return `<blockquote class="instagram-media"
  data-instgrm-permalink="${url}"
  data-instgrm-version="14"
  style="max-width:540px; min-width:326px; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);">
</blockquote>`;
  }

  generateEmbeds(urls: string[]): string[] {
    if (!urls?.length) {
      return [];
    }

    return urls.map((url) => this.generateEmbed(url));
  }
}
