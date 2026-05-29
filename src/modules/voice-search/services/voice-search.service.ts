import { Injectable } from '@nestjs/common';
import axios from 'axios';
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

type KnownFaqIntent = Exclude<FaqIntent, 'desconhecida'>;
type ChatbotSource = 'llm' | 'faq_fallback';
type FaqChatHistoryRole = 'user' | 'assistant';

interface FaqItem {
  id: string;
  category: KnownFaqIntent;
  question: string;
  answer: string;
  keywords: string[];
}

interface IntentTrainingSample {
  intent: KnownFaqIntent;
  text: string;
}

interface BinarySvmModel {
  weights: number[];
  bias: number;
}

interface TfIdfVectorizerArtifacts {
  vocabulary: string[];
  tokenIndex: Map<string, number>;
  idf: number[];
}

interface IntentPrediction {
  intent: KnownFaqIntent;
  score: number;
  margin: number;
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

export interface FaqChatHistoryMessage {
  role: FaqChatHistoryRole;
  content: string;
}

export interface FaqChatbotResponse {
  query: string;
  answer: string;
  source: ChatbotSource;
  intent: FaqIntent;
  references: FaqSearchResult[];
}

interface MaritacaOutputContent {
  type?: string;
  text?: string;
}

interface MaritacaOutputItem {
  type?: string;
  content?: MaritacaOutputContent[];
  text?: string;
}

interface MaritacaResponsesApiBody {
  status?: string;
  output?: MaritacaOutputItem[];
  error?: { message?: string } | null;
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

const INTENT_TRAINING_SAMPLES: IntentTrainingSample[] = [
  { intent: 'doacao', text: 'como faço uma doação' },
  { intent: 'doacao', text: 'quero doar roupas' },
  { intent: 'doacao', text: 'gostaria de doar alimentos' },
  { intent: 'doacao', text: 'como contribuir com doações' },
  { intent: 'doacao', text: 'aceitam doações de itens' },

  { intent: 'pix', text: 'qual é a chave pix' },
  { intent: 'pix', text: 'me passe a chave de pagamento' },
  { intent: 'pix', text: 'como fazer doação no pix' },
  { intent: 'pix', text: 'qual pix para transferir' },
  { intent: 'pix', text: 'quero pagar por pix' },

  { intent: 'voluntariado', text: 'quero ser voluntário' },
  { intent: 'voluntariado', text: 'como participar como voluntária' },
  { intent: 'voluntariado', text: 'tenho interesse em voluntariado' },
  { intent: 'voluntariado', text: 'como posso ajudar como voluntário' },
  { intent: 'voluntariado', text: 'como entro para equipe voluntária' },

  { intent: 'eventos', text: 'quais são os próximos eventos' },
  { intent: 'eventos', text: 'onde vejo o calendário de ações' },
  { intent: 'eventos', text: 'agenda de eventos do projeto' },
  { intent: 'eventos', text: 'datas dos eventos sociais' },
  { intent: 'eventos', text: 'como acompanhar os eventos' },

  { intent: 'localizacao', text: 'onde fica o projeto' },
  { intent: 'localizacao', text: 'qual é o endereço' },
  { intent: 'localizacao', text: 'como chegar no local' },
  { intent: 'localizacao', text: 'tem mapa da localização' },
  { intent: 'localizacao', text: 'qual rua da organização' },

  { intent: 'contato', text: 'como entro em contato' },
  { intent: 'contato', text: 'qual o telefone de vocês' },
  { intent: 'contato', text: 'me passa o whatsapp' },
  { intent: 'contato', text: 'quais redes sociais da ong' },
  { intent: 'contato', text: 'contato para falar com equipe' },

  { intent: 'horario', text: 'qual horário de funcionamento' },
  { intent: 'horario', text: 'que horas abre' },
  { intent: 'horario', text: 'que horas fecha' },
  { intent: 'horario', text: 'funciona segunda a sexta' },
  { intent: 'horario', text: 'horário de atendimento' },
];

@Injectable()
export class VoiceSearchService {
  private readonly tokenizer = new natural.WordTokenizer();
  private readonly stopwords = new Set(PORTUGUESE_STOPWORDS);
  private readonly maritacaApiKey = process.env.MARITACA_API_KEY?.trim() ?? '';
  private readonly maritacaModel =
    process.env.MARITACA_MODEL?.trim() || 'sabia-4';
  private readonly maritacaResponsesUrl =
    process.env.MARITACA_RESPONSES_URL?.trim() ||
    'https://chat.maritaca.ai/api/v1/responses';
  private readonly maritacaAuthScheme =
    process.env.MARITACA_AUTH_SCHEME?.trim() || 'Bearer';
  private readonly maritacaTimeoutMs = Number(
    process.env.MARITACA_TIMEOUT_MS ?? 15000
  );
  private readonly maxHistoryMessages = 6;

  private readonly knownIntents: KnownFaqIntent[] = [
    'doacao',
    'pix',
    'voluntariado',
    'eventos',
    'localizacao',
    'contato',
    'horario',
  ];

  private readonly svmEpochs = 120;
  private readonly svmLambda = 0.01;
  private readonly svmLearningRate = 0.1;
  private readonly minIntentScore = 0.05;
  private readonly minIntentMargin = 0.02;

  private intentVectorizer: TfIdfVectorizerArtifacts;
  private semanticVectorizer: TfIdfVectorizerArtifacts;
  private svmModels: Record<KnownFaqIntent, BinarySvmModel>;
  private semanticFaqVectors: number[][];

  constructor() {
    this.trainIntentClassifier();
    this.buildSemanticFaqIndex();
  }

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

  async chatFaq(
    query: string,
    history: FaqChatHistoryMessage[] = []
  ): Promise<FaqChatbotResponse> {
    const faqResponse = this.searchFaq(query);
    const references = faqResponse.results.slice(0, 3);
    const fallbackAnswer = this.buildFallbackAnswer(faqResponse);

    if (!this.maritacaApiKey) {
      return {
        query,
        answer: fallbackAnswer,
        source: 'faq_fallback',
        intent: faqResponse.intent,
        references,
      };
    }

    try {
      const reply = await this.generateMaritacaReply(
        query,
        references,
        this.sanitizeHistory(history)
      );

      if (!reply) {
        throw new Error('Resposta vazia da Maritaca');
      }

      return {
        query,
        answer: reply,
        source: 'llm',
        intent: faqResponse.intent,
        references,
      };
    } catch (error) {
      console.error('[voice-search] Falha ao consultar Maritaca:', error);
      return {
        query,
        answer: fallbackAnswer,
        source: 'faq_fallback',
        intent: faqResponse.intent,
        references,
      };
    }
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

  private trainIntentClassifier() {
    const trainingSamples = this.prepareIntentTrainingSamples();
    const tokenizedDocuments = trainingSamples.map((sample) => sample.tokens);

    this.intentVectorizer = this.createTfidfVectorizer(tokenizedDocuments);

    const trainingVectors = tokenizedDocuments.map((tokens) =>
      this.vectorizeTokens(tokens, this.intentVectorizer)
    );

    const labels = trainingSamples.map((sample) => sample.intent);
    this.svmModels = this.trainOneVsRestSvm(trainingVectors, labels);
  }

  private prepareIntentTrainingSamples() {
    const rawSamples: IntentTrainingSample[] = [...INTENT_TRAINING_SAMPLES];

    // Reinforce each intent using curated FAQ questions from the project domain.
    FAQ_ITEMS.forEach((faq) => {
      rawSamples.push({
        intent: faq.category,
        text: faq.question,
      });
    });

    return rawSamples
      .map((sample) => ({
        intent: sample.intent,
        tokens: this.tokenize(this.normalize(sample.text)),
      }))
      .filter((sample) => sample.tokens.length > 0);
  }

  private buildSemanticFaqIndex() {
    const semanticDocs = FAQ_ITEMS.map((faq) =>
      this.tokenize(
        this.normalize(`${faq.question} ${faq.answer} ${faq.keywords.join(' ')}`)
      )
    );

    this.semanticVectorizer = this.createTfidfVectorizer(semanticDocs);
    this.semanticFaqVectors = semanticDocs.map((tokens) =>
      this.vectorizeTokens(tokens, this.semanticVectorizer)
    );
  }

  private createTfidfVectorizer(
    tokenizedDocuments: string[][]
  ): TfIdfVectorizerArtifacts {
    const tokenDocumentFrequency = new Map<string, number>();

    tokenizedDocuments.forEach((tokens) => {
      const uniqueTokens = new Set(tokens);
      uniqueTokens.forEach((token) => {
        tokenDocumentFrequency.set(
          token,
          (tokenDocumentFrequency.get(token) ?? 0) + 1
        );
      });
    });

    const vocabulary = Array.from(tokenDocumentFrequency.keys()).sort();
    const tokenIndex = new Map<string, number>();

    vocabulary.forEach((token, index) => {
      tokenIndex.set(token, index);
    });

    const documentCount = tokenizedDocuments.length;
    const idf = vocabulary.map((token) => {
      const df = tokenDocumentFrequency.get(token) ?? 0;
      return Math.log((1 + documentCount) / (1 + df)) + 1;
    });

    return {
      vocabulary,
      tokenIndex,
      idf,
    };
  }

  private vectorizeTokens(
    tokens: string[],
    vectorizer: TfIdfVectorizerArtifacts
  ): number[] {
    const vector = new Array(vectorizer.vocabulary.length).fill(0);

    if (!tokens.length || !vectorizer.vocabulary.length) {
      return vector;
    }

    const termFrequency = new Map<string, number>();

    tokens.forEach((token) => {
      if (vectorizer.tokenIndex.has(token)) {
        termFrequency.set(token, (termFrequency.get(token) ?? 0) + 1);
      }
    });

    const totalTerms = Array.from(termFrequency.values()).reduce(
      (accumulator, value) => accumulator + value,
      0
    );

    if (totalTerms === 0) {
      return vector;
    }

    termFrequency.forEach((count, token) => {
      const tokenIndex = vectorizer.tokenIndex.get(token);
      if (tokenIndex === undefined) {
        return;
      }

      const tf = count / totalTerms;
      vector[tokenIndex] = tf * vectorizer.idf[tokenIndex];
    });

    return this.normalizeVector(vector);
  }

  private normalizeVector(vector: number[]): number[] {
    const magnitude = Math.sqrt(
      vector.reduce((accumulator, value) => accumulator + value * value, 0)
    );

    if (magnitude === 0) {
      return vector;
    }

    return vector.map((value) => value / magnitude);
  }

  private trainOneVsRestSvm(
    trainingVectors: number[][],
    labels: KnownFaqIntent[]
  ) {
    const featureCount = this.intentVectorizer.vocabulary.length;
    const models = {} as Record<KnownFaqIntent, BinarySvmModel>;

    this.knownIntents.forEach((intent) => {
      const weights = new Array(featureCount).fill(0);
      let bias = 0;

      for (let epoch = 0; epoch < this.svmEpochs; epoch += 1) {
        const learningRate =
          this.svmLearningRate / (1 + epoch * this.svmLambda * 10);

        for (let sampleIndex = 0; sampleIndex < trainingVectors.length; sampleIndex += 1) {
          const vector = trainingVectors[sampleIndex];
          const target = labels[sampleIndex] === intent ? 1 : -1;
          const score = this.dotProduct(weights, vector) + bias;
          const margin = target * score;

          for (let featureIndex = 0; featureIndex < weights.length; featureIndex += 1) {
            weights[featureIndex] =
              weights[featureIndex] * (1 - learningRate * this.svmLambda);

            if (margin < 1) {
              weights[featureIndex] +=
                learningRate * target * vector[featureIndex];
            }
          }

          if (margin < 1) {
            bias += learningRate * target;
          }
        }
      }

      models[intent] = {
        weights,
        bias,
      };
    });

    return models;
  }

  private classifyIntent(tokens: string[]): FaqIntent {
    const prediction = this.predictIntent(tokens);

    if (!prediction) {
      return 'desconhecida';
    }

    if (
      prediction.score < this.minIntentScore ||
      prediction.margin < this.minIntentMargin
    ) {
      return 'desconhecida';
    }

    return prediction.intent;
  }

  private predictIntent(tokens: string[]): IntentPrediction | null {
    if (!tokens.length) {
      return null;
    }

    const queryVector = this.vectorizeTokens(tokens, this.intentVectorizer);
    const vectorMagnitude = Math.sqrt(
      queryVector.reduce((accumulator, value) => accumulator + value * value, 0)
    );

    if (vectorMagnitude === 0) {
      return null;
    }

    const rankedScores = this.knownIntents
      .map((intent) => {
        const model = this.svmModels[intent];
        return {
          intent,
          score: this.dotProduct(model.weights, queryVector) + model.bias,
        };
      })
      .sort((first, second) => second.score - first.score);

    const best = rankedScores[0];
    const secondBestScore = rankedScores[1]?.score ?? -Infinity;

    return {
      intent: best.intent,
      score: best.score,
      margin: best.score - secondBestScore,
    };
  }

  private rankFaqs(tokens: string[], intent: FaqIntent): FaqSearchResult[] {
    if (!tokens.length) {
      return [];
    }

    const queryVector = this.vectorizeTokens(tokens, this.semanticVectorizer);
    const queryMagnitude = Math.sqrt(
      queryVector.reduce((accumulator, value) => accumulator + value * value, 0)
    );

    if (queryMagnitude === 0) {
      return [];
    }

    return FAQ_ITEMS.map((faq, index) => {
      const semanticScore = this.dotProduct(queryVector, this.semanticFaqVectors[index]);
      const intentBoost = intent === faq.category ? 0.25 : 0;
      const keywordBoost = tokens.some((token) => faq.keywords.includes(token))
        ? 0.1
        : 0;
      const score = semanticScore + intentBoost + keywordBoost;

      return {
        id: faq.id,
        category: faq.category,
        question: faq.question,
        answer: faq.answer,
        score,
      };
    })
      .filter((faq) => faq.score > 0.05)
      .sort((first, second) => second.score - first.score);
  }

  private dotProduct(firstVector: number[], secondVector: number[]) {
    const maxIndex = Math.min(firstVector.length, secondVector.length);
    let accumulator = 0;

    for (let index = 0; index < maxIndex; index += 1) {
      accumulator += firstVector[index] * secondVector[index];
    }

    return accumulator;
  }

  private async generateMaritacaReply(
    query: string,
    references: FaqSearchResult[],
    history: FaqChatHistoryMessage[]
  ): Promise<string | null> {
    const context = this.buildFaqContext(references);
    const { data } = await axios.post<MaritacaResponsesApiBody>(
      this.maritacaResponsesUrl,
      {
        model: this.maritacaModel,
        instructions: [
          'Você é o assistente virtual do projeto social Conecta Social.',
          'Responda sempre em português do Brasil, com linguagem clara, acolhedora e objetiva.',
          'Use apenas as informações do contexto fornecido.',
          'Se não houver contexto suficiente, informe com transparência e oriente o contato via WhatsApp +55 (15) 99999-9999.',
          'Evite inventar dados, nomes, horários ou endereços que não estejam no contexto.',
        ].join(' '),
        input: [
          ...history,
          {
            role: 'user',
            content: `Contexto confiável do Conecta Social:\n${context}\n\nPergunta do usuário: ${query}`,
          },
        ],
        max_output_tokens: 260,
        temperature: 0.2,
        top_p: 0.95,
      },
      {
        headers: {
          Authorization: `${this.maritacaAuthScheme} ${this.maritacaApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: this.maritacaTimeoutMs,
      }
    );

    if (data?.status === 'failed') {
      const errorMessage = data.error?.message ?? 'Falha retornada pela API';
      throw new Error(errorMessage);
    }

    const text = this.extractTextFromResponsesApi(data);
    return text?.trim() || null;
  }

  private extractTextFromResponsesApi(
    payload: MaritacaResponsesApiBody
  ): string | null {
    if (!Array.isArray(payload?.output)) {
      return null;
    }

    const textParts = payload.output
      .filter((item) => item?.type === 'message')
      .flatMap((item) => item.content ?? [])
      .map((content) => content?.text ?? '')
      .filter(Boolean);

    if (textParts.length > 0) {
      return textParts.join('\n').trim();
    }

    const topLevelText = payload.output
      .map((item) => item.text ?? '')
      .filter(Boolean)
      .join('\n')
      .trim();

    return topLevelText || null;
  }

  private buildFaqContext(references: FaqSearchResult[]): string {
    if (!references.length) {
      return [
        '- Doações: chave PIX conectasocial@email.com e contato pelo WhatsApp.',
        '- Voluntariado: contato via WhatsApp ou redes sociais.',
        '- Horário: segunda a sexta, 10:00 às 16:00.',
        '- Endereço: Rua Lorem Ipsum, 4923, Sorocaba - São Paulo - Brasil.',
      ].join('\n');
    }

    return references
      .map(
        (reference, index) =>
          `${index + 1}. Tema: ${reference.category}\nPergunta: ${
            reference.question
          }\nResposta: ${reference.answer}`
      )
      .join('\n\n');
  }

  private buildFallbackAnswer(faqResponse: FaqVoiceSearchResponse): string {
    const best = faqResponse.results[0];
    if (!best) {
      return this.getFallbackResult().answer;
    }

    if (faqResponse.results.length === 1) {
      return best.answer;
    }

    return `${best.answer}\n\nSe precisar, também posso ajudar com ${faqResponse.results
      .slice(1, 3)
      .map((result) => result.category)
      .join(' e ')}.`;
  }

  private sanitizeHistory(
    history: FaqChatHistoryMessage[]
  ): FaqChatHistoryMessage[] {
    if (!Array.isArray(history)) {
      return [];
    }

    return history
      .filter(
        (message) =>
          (message?.role === 'user' || message?.role === 'assistant') &&
          typeof message.content === 'string' &&
          message.content.trim().length > 0
      )
      .slice(-this.maxHistoryMessages)
      .map((message) => ({
        role: message.role,
        content: message.content.trim().slice(0, 500),
      }));
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
