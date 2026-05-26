import { VoiceSearchService } from './voice-search.service';

describe('VoiceSearchService', () => {
  let service: VoiceSearchService;
  const originalApiKey = process.env.MARITACA_API_KEY;

  beforeEach(() => {
    delete process.env.MARITACA_API_KEY;
    service = new VoiceSearchService();
  });

  afterAll(() => {
    if (originalApiKey) {
      process.env.MARITACA_API_KEY = originalApiKey;
      return;
    }

    delete process.env.MARITACA_API_KEY;
  });

  it('normalizes accents, punctuation and casing', () => {
    expect(service.normalize('Qual É a CHAVE PIX?')).toBe('qual e a chave pix');
  });

  it('tokenizes text and removes portuguese stopwords', () => {
    expect(service.tokenize('como faco para doar roupas')).toEqual([
      'doar',
      'roupas',
    ]);
  });

  it('detects donation intent and returns matching faq results', () => {
    const response = service.searchFaq('como faço para doar roupas');

    expect(response.intent).toBe('doacao');
    expect(response.tokens).toContain('doar');
    expect(response.results[0].category).toBe('doacao');
  });

  it('detects pix intent', () => {
    const response = service.searchFaq('qual é a chave pix');

    expect(response.intent).toBe('pix');
    expect(response.results[0].category).toBe('pix');
  });

  it('returns fallback when there is no useful match', () => {
    const response = service.searchFaq('banana computador aleatorio');

    expect(response.intent).toBe('desconhecida');
    expect(response.results).toHaveLength(1);
    expect(response.results[0].id).toBe('faq-fallback');
  });

  it('returns faq fallback response when maritaca key is missing', async () => {
    const response = await service.chatFaq('qual é a chave pix');

    expect(response.source).toBe('faq_fallback');
    expect(response.intent).toBe('pix');
    expect(response.references[0].category).toBe('pix');
    expect(response.answer).toContain('chave PIX');
  });
});
