import { Injectable } from '@nestjs/common';
import * as natural from 'natural';

type FaqIntent =
  | 'doacao'
  | 'voluntariado'
  | 'eventos'
  | 'localizacao'
  | 'contato'
  | 'horario'
  | 'pix'
  | 'desconhecida';

interface FaqItem {
  id: string;
  category: Exclude<FaqIntent, 'desconhecida'>;
  question: string;
  answer: string;
  keywords: string[];
}

export interface FaqSearchResult {
  id: string;
  category: FaqItem['category'] | 'geral';
  question: string;
  answer: string;
  score: number;
}

export interface FaqVoiceSearchResponse {
  query: string;
  normalizedQuery: string;
  tokens: string[];
  intent: FaqIntent;
  results: FaqSearchResult[];
}

// The stopwords package from the activity does not ship a Portuguese list.
// Keep the PT-BR terms local so the PLN pipeline remains deterministic.
const PORTUGUESE_STOPWORDS = [
  'a',
  'ao',
  'aos',
  'as',
  'com',
  'como',
  'da',
  'das',
  'de',
  'do',
  'dos',
  'e',
  'em',
  'eu',
  'faco',
  'faz',
  'fazer',
  'me',
  'o',
  'os',
  'para',
  'por',
  'posso',
  'qual',
  'quais',
  'que',
  'quero',
  'sao',
  'se',
  'ser',
  'um',
  'uma',
];

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-doacao',
    category: 'doacao',
    question: 'Como posso fazer uma doação?',
    answer:
      'Você pode doar usando a chave PIX conectasocial@email.com ou entrar em contato pelo WhatsApp para combinar doações de roupas, alimentos e outros itens.',
    keywords: ['doacao', 'doar', 'doacoes', 'roupas', 'alimentos', 'ajudar'],
  },
  {
    id: 'faq-pix',
    category: 'pix',
    question: 'Qual é a chave PIX?',
    answer:
      'A chave PIX do projeto é conectasocial@email.com. Ela também está disponível no card de doação desta página.',
    keywords: ['pix', 'chave', 'pagamento', 'transferencia'],
  },
  {
    id: 'faq-voluntariado',
    category: 'voluntariado',
    question: 'Como faço para ser voluntário?',
    answer:
      'Entre em contato pelo WhatsApp ou pelas redes sociais para informar sua disponibilidade e entender as ações em que você pode participar.',
    keywords: [
      'voluntario',
      'voluntaria',
      'voluntariado',
      'participar',
      'ajudar',
    ],
  },
  {
    id: 'faq-eventos',
    category: 'eventos',
    question: 'Onde vejo os próximos eventos?',
    answer:
      'Os próximos eventos aparecem na seção Calendário da página inicial. As novidades também são divulgadas nas redes sociais do Conecta Social.',
    keywords: ['evento', 'eventos', 'calendario', 'agenda', 'proximos'],
  },
  {
    id: 'faq-localizacao',
    category: 'localizacao',
    question: 'Onde fica o projeto?',
    answer:
      'O endereço informado é Rua Lorem Ipsum, 4923, Sorocaba - São Paulo - Brasil. Use o mapa desta página para se orientar.',
    keywords: ['endereco', 'localizacao', 'local', 'rua', 'mapa', 'sorocaba'],
  },
  {
    id: 'faq-contato',
    category: 'contato',
    question: 'Como entro em contato?',
    answer:
      'Você pode falar com o Conecta Social pelo WhatsApp +55 (15) 99999-9999 ou acompanhar as redes sociais listadas nesta página.',
    keywords: ['contato', 'telefone', 'whatsapp', 'redes', 'instagram'],
  },
  {
    id: 'faq-horario',
    category: 'horario',
    question: 'Qual é o horário de funcionamento?',
    answer:
      'O horário de funcionamento informado é de segunda-feira a sexta-feira, das 10:00 às 16:00.',
    keywords: ['horario', 'funcionamento', 'abre', 'fecha', 'segunda', 'sexta'],
  },
];

const INTENT_KEYWORDS: Record<Exclude<FaqIntent, 'desconhecida'>, string[]> = {
  doacao: ['doacao', 'doar', 'doacoes', 'roupas', 'alimentos', 'ajudar'],
  voluntariado: ['voluntario', 'voluntaria', 'voluntariado', 'participar'],
  eventos: ['evento', 'eventos', 'calendario', 'agenda', 'proximos'],
  localizacao: ['endereco', 'localizacao', 'local', 'rua', 'mapa', 'onde'],
  contato: ['contato', 'telefone', 'whatsapp', 'redes', 'instagram'],
  horario: ['horario', 'funcionamento', 'abre', 'fecha', 'segunda', 'sexta'],
  pix: ['pix', 'chave', 'pagamento', 'transferencia'],
};

@Injectable()
export class VoiceSearchService {
  private readonly tokenizer = new natural.WordTokenizer();
  private readonly stopwords = new Set(PORTUGUESE_STOPWORDS);

  searchFaq(query: string): FaqVoiceSearchResponse {
    const normalizedQuery = this.normalize(query);
    const tokens = this.tokenize(normalizedQuery);
    const intent = this.classifyIntent(tokens);
    const results = this.rankFaqs(tokens, intent);

    return {
      query,
      normalizedQuery,
      tokens,
      intent,
      results: results.length > 0 ? results : [this.getFallbackResult()],
    };
  }

  normalize(text: string) {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  tokenize(normalizedText: string) {
    return this.tokenizer
      .tokenize(normalizedText)
      .filter((token) => token.length > 1 && !this.stopwords.has(token));
  }

  private classifyIntent(tokens: string[]): FaqIntent {
    const scores = Object.entries(INTENT_KEYWORDS).map(
      ([intent, keywords]) => ({
        intent: intent as Exclude<FaqIntent, 'desconhecida'>,
        score: tokens.filter((token) => keywords.includes(token)).length,
      })
    );

    const best = scores.sort((a, b) => b.score - a.score)[0];
    return best && best.score > 0 ? best.intent : 'desconhecida';
  }

  private rankFaqs(tokens: string[], intent: FaqIntent): FaqSearchResult[] {
    return FAQ_ITEMS.map((faq) => {
      const questionTokens = this.tokenize(this.normalize(faq.question));
      const answerTokens = this.tokenize(this.normalize(faq.answer));
      const keywordScore = tokens.filter((token) =>
        faq.keywords.includes(token)
      ).length;
      const questionScore = tokens.filter((token) =>
        questionTokens.includes(token)
      ).length;
      const answerScore = tokens.filter((token) =>
        answerTokens.includes(token)
      ).length;
      const intentScore = intent === faq.category ? 2 : 0;
      const score =
        keywordScore * 3 + questionScore * 2 + answerScore + intentScore;

      return {
        id: faq.id,
        category: faq.category,
        question: faq.question,
        answer: faq.answer,
        score,
      };
    })
      .filter((faq) => faq.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  private getFallbackResult(): FaqSearchResult {
    return {
      id: 'faq-fallback',
      category: 'geral',
      question: 'Não encontramos uma resposta exata.',
      answer:
        'Tente perguntar sobre doações, voluntariado, eventos, localização, horário, contato ou chave PIX.',
      score: 0,
    };
  }
}
