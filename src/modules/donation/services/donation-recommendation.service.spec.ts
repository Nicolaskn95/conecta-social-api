import { DonationRecommendationService } from './donation-recommendation.service';
import { NeedStatus } from '@/domain/enums';
import { RecommendationNeed } from '@/domain/repositories/need.repository';

describe('DonationRecommendationService', () => {
  it('prioriza pedidos compatíveis de lotes posteriores e exclui medidas diferentes e pedidos cobertos', async () => {
    const type = {
      id: 'type',
      code: 'SNEAKERS',
      name: 'Tênis',
      aliases: ['tênis'],
      category_id: 'category',
    };
    const date = new Date('2026-01-01T00:00:00Z');
    const need = (id: string, size?: number): RecommendationNeed => ({
      id,
      id_family: 'family',
      id_beneficiary: null,
      item_type_id: type.id,
      description: null,
      requested_quantity: 1,
      specifications: size ? { shoe_size_br: size } : null,
      status: NeedStatus.OPEN,
      created_by: null,
      created_at: date,
      updated_at: date,
      version: 0,
      family: { name: 'Família', active: true },
      beneficiary: null,
    });
    const first = Array.from({ length: 100 }, (_, index) =>
      need('review-' + String(index).padStart(3, '0'))
    );
    const service = new DonationRecommendationService(
      {
        findById: jest.fn().mockResolvedValue({
          name: 'Tênis',
          item_type_id: type.id,
          available: true,
          current_quantity: 2,
          category: { measure_unity: 'UN' },
          specifications: { shoe_size_br: 37 },
        }),
      } as never,
      { findActive: jest.fn().mockResolvedValue([type]) } as never,
      {
        listForRecommendation: jest
          .fn()
          .mockResolvedValueOnce(first)
          .mockResolvedValueOnce([
            need('b', 37),
            need('a', 37),
            need('wrong', 38),
            need('covered', 37),
          ]),
      } as never,
      {
        needQuantitiesFor: jest
          .fn()
          .mockResolvedValue(
            new Map([
              ['covered', { separated_quantity: 1, received_quantity: 0 }],
            ])
          ),
      } as never
    );

    const result = await service.find('donation');
    expect(result.suggestions.map((item) => item.id_need)).toEqual([
      'a',
      'b',
      'review-000',
      'review-001',
      'review-002',
    ]);
    expect(result.suggestions[0]).toMatchObject({
      classification: 'COMPATIBLE',
      max_separable_quantity: 1,
    });
    expect(result.suggestions[2]).toMatchObject({
      classification: 'REVIEW',
      checks: ['NEED_MEASUREMENT_MISSING'],
    });
  });
});
