import { DashboardService } from './dashboard.service';
import { EmployeeRole } from '@/domain/enums';
import { DashboardRepository, DashboardSource } from '@/domain/repositories';

describe('DashboardService', () => {
  let dashboardRepository: {
    getOverviewSource: jest.Mock<Promise<DashboardSource>>;
  };
  let service: DashboardService;

  beforeEach(() => {
    dashboardRepository = {
      getOverviewSource: jest.fn(),
    };

    service = new DashboardService(
      dashboardRepository as unknown as DashboardRepository
    );
  });

  it('retorna overview vazio sem quebrar o contrato', async () => {
    dashboardRepository.getOverviewSource.mockResolvedValue({
      families: [],
      employees: [],
      events: [],
      donations: [],
    });

    const result = await service.getOverview('year');

    expect(result.summary).toEqual({
      active_families: 0,
      active_employees: 0,
      employees_by_role: {
        ADMIN: 0,
        MANAGER: 0,
        VOLUNTEER: 0,
      },
      active_events: 0,
      upcoming_events: 0,
      completed_events: 0,
      canceled_events: 0,
      active_donations: 0,
      available_donations: 0,
      critical_stock_items: 0,
    });
    expect(result.charts.activity_overview.labels).toHaveLength(12);
    expect(result.lists.upcoming_events).toEqual([]);
    expect(result.lists.critical_stock).toEqual([]);
  });

  it('agrega métricas operacionais usando o schema atual', async () => {
    const now = new Date();
    dashboardRepository.getOverviewSource.mockResolvedValue({
      families: [
        {
          id: 'family-1',
          name: 'Família Souza',
          city: 'Sorocaba',
          neighborhood: 'Centro',
          created_at: now,
        },
        {
          id: 'family-2',
          name: 'Família Lima',
          city: 'Votorantim',
          neighborhood: 'Vila Nova',
          created_at: now,
        },
      ],
      employees: [
        { id: 'employee-1', role: EmployeeRole.ADMIN },
        { id: 'employee-2', role: EmployeeRole.VOLUNTEER },
        { id: 'employee-3', role: EmployeeRole.VOLUNTEER },
      ],
      events: [
        {
          id: 'event-1',
          name: 'Mutirão',
          city: 'Sorocaba',
          date: new Date(now.getTime() + 1000 * 60 * 60 * 24),
          status: 'SCHEDULED',
          attendance: 20,
          created_at: now,
        },
        {
          id: 'event-2',
          name: 'Entrega',
          city: 'Votorantim',
          date: new Date(now.getTime() - 1000 * 60 * 60 * 24),
          status: 'COMPLETED',
          attendance: 30,
          created_at: now,
        },
      ],
      donations: [
        {
          id: 'donation-1',
          name: 'Arroz',
          donator_name: 'Maria',
          current_quantity: 4,
          available: true,
          created_at: now,
          updated_at: now,
          category: {
            name: 'Alimento não perecível',
            measure_unity: 'KG',
          },
        },
        {
          id: 'donation-2',
          name: 'Camiseta',
          donator_name: null,
          current_quantity: 12,
          available: false,
          created_at: now,
          updated_at: now,
          category: {
            name: 'Roupas',
            measure_unity: 'UN',
          },
        },
      ],
    });

    const result = await service.getOverview('quarter');

    expect(result.summary.active_families).toBe(2);
    expect(result.summary.active_employees).toBe(3);
    expect(result.summary.employees_by_role.ADMIN).toBe(1);
    expect(result.summary.employees_by_role.VOLUNTEER).toBe(2);
    expect(result.summary.active_events).toBe(2);
    expect(result.summary.upcoming_events).toBe(1);
    expect(result.summary.completed_events).toBe(1);
    expect(result.summary.active_donations).toBe(2);
    expect(result.summary.critical_stock_items).toBe(2);
    expect(result.charts.donations_by_category.labels).toEqual(
      expect.arrayContaining(['Alimento não perecível', 'Roupas'])
    );
    expect(result.charts.events_by_status.labels).toEqual(
      expect.arrayContaining(['Aberto', 'Concluído'])
    );
    expect(
      result.charts.families_by_neighborhood.labels.length
    ).toBeLessThanOrEqual(10);
    expect(result.charts.families_by_neighborhood.labels).toEqual(
      expect.arrayContaining(['Centro', 'Vila Nova'])
    );
    expect(result.lists.upcoming_events).toHaveLength(1);
    expect(result.lists.recent_families).toHaveLength(2);
  });

  it('remove métricas sensíveis do dashboard de voluntário', async () => {
    const now = new Date();
    dashboardRepository.getOverviewSource.mockResolvedValue({
      families: [
        {
          id: 'family-1',
          name: 'Família Souza',
          city: 'Sorocaba',
          neighborhood: 'Centro',
          created_at: now,
        },
      ],
      employees: [{ id: 'employee-1', role: EmployeeRole.ADMIN }],
      events: [],
      donations: [],
    });

    const result = await service.getOverview('year', EmployeeRole.VOLUNTEER);

    expect(result.summary).not.toHaveProperty('active_employees');
    expect(result.summary).not.toHaveProperty('employees_by_role');
    expect(result.lists).not.toHaveProperty('recent_donations');
    expect(result.lists).not.toHaveProperty('recent_families');
    expect(result.lists.upcoming_events).toEqual([]);
    expect(result.lists.critical_stock).toEqual([]);
  });
});
