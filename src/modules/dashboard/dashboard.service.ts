import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/config/prisma/prisma.service';
import { DashboardPeriod } from './dto/dashboard-overview-query.dto';

type SupportedStatus = 'ABERTO' | 'CONCLUIDO' | 'CANCELADO' | 'OUTROS';

interface BucketConfig {
  labels: string[];
  getIndex: (date: Date) => number;
  start: Date;
}

interface DashboardEventRow {
  id: string;
  name: string;
  city: string;
  date: Date | string;
  status: string;
  attendance: number | null;
  created_at: Date | string;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(period: DashboardPeriod = 'year') {
    const now = new Date();
    const bucketConfig = this.buildBucketConfig(period, now);

    const [families, employees, rawEvents, donations] = await Promise.all([
      this.prisma.family.findMany({
        where: { active: true },
        select: {
          id: true,
          name: true,
          city: true,
          neighborhood: true,
          created_at: true,
        },
      }),
      this.prisma.employee.findMany({
        where: { active: true },
        select: {
          id: true,
          role: true,
        },
      }),
      this.getActiveEventsForDashboard(),
      this.prisma.donation.findMany({
        where: { active: true },
        select: {
          id: true,
          name: true,
          donator_name: true,
          current_quantity: true,
          available: true,
          created_at: true,
          updated_at: true,
          category: {
            select: {
              name: true,
              measure_unity: true,
            },
          },
        },
      }),
    ]);

    const events = rawEvents.map((event) => ({
      ...event,
      date: event.date instanceof Date ? event.date : new Date(event.date),
      created_at:
        event.created_at instanceof Date
          ? event.created_at
          : new Date(event.created_at),
    }));

    const donationsCreatedSeries = this.createSeries(
      bucketConfig,
      donations.map((donation) => donation.created_at)
    );
    const familiesCreatedSeries = this.createSeries(
      bucketConfig,
      families.map((family) => family.created_at)
    );

    const employeeRoleCounts = {
      ADMIN: 0,
      MANAGER: 0,
      VOLUNTEER: 0,
    };

    for (const employee of employees) {
      employeeRoleCounts[employee.role] += 1;
    }

    const eventStatusCounts = {
      ABERTO: 0,
      CONCLUIDO: 0,
      CANCELADO: 0,
      OUTROS: 0,
    } satisfies Record<SupportedStatus, number>;

    for (const event of events) {
      eventStatusCounts[this.normalizeEventStatus(event.status)] += 1;
    }

    const categoryCounts = new Map<string, number>();
    for (const donation of donations) {
      const key = donation.category.name;
      categoryCounts.set(key, (categoryCounts.get(key) ?? 0) + 1);
    }

    const familyCityCounts = new Map<string, number>();
    const familyNeighborhoodCounts = new Map<string, number>();
    for (const family of families) {
      familyCityCounts.set(
        family.city,
        (familyCityCounts.get(family.city) ?? 0) + 1
      );

      if (family.neighborhood?.trim()) {
        familyNeighborhoodCounts.set(
          family.neighborhood,
          (familyNeighborhoodCounts.get(family.neighborhood) ?? 0) + 1
        );
      }
    }

    const currentDate = new Date();
    const upcomingEvents = [...events]
      .filter((event) => event.date >= currentDate)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5);

    const criticalStock = [...donations]
      .filter(
        (donation) =>
          donation.current_quantity <= 5 || donation.available === false
      )
      .sort((a, b) => {
        if (a.current_quantity !== b.current_quantity) {
          return a.current_quantity - b.current_quantity;
        }

        return b.updated_at.getTime() - a.updated_at.getTime();
      })
      .slice(0, 5);

    const recentDonations = [...donations]
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, 5);

    const recentFamilies = [...families]
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, 5);

    const eventStatusEntries = (
      [
        ['Aberto', eventStatusCounts.ABERTO],
        ['Concluído', eventStatusCounts.CONCLUIDO],
        ['Cancelado', eventStatusCounts.CANCELADO],
      ] as Array<[string, number]>
    ).filter(([, value]) => value > 0);

    const categoryEntries = [...categoryCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const cityEntries = [...familyCityCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const neighborhoodEntries = [...familyNeighborhoodCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return {
      period,
      generated_at: now.toISOString(),
      summary: {
        active_families: families.length,
        active_employees: employees.length,
        employees_by_role: employeeRoleCounts,
        active_events: events.length,
        upcoming_events: upcomingEvents.length,
        completed_events: eventStatusCounts.CONCLUIDO,
        canceled_events: eventStatusCounts.CANCELADO,
        active_donations: donations.length,
        available_donations: donations.filter((donation) => donation.available)
          .length,
        critical_stock_items: criticalStock.length,
      },
      charts: {
        activity_overview: {
          labels: bucketConfig.labels,
          datasets: [
            {
              key: 'donations_created',
              label: 'Doações cadastradas',
              data: donationsCreatedSeries,
            },
            {
              key: 'families_created',
              label: 'Famílias cadastradas',
              data: familiesCreatedSeries,
            },
          ],
        },
        donations_by_category: {
          labels: categoryEntries.map(([label]) => label),
          data: categoryEntries.map(([, value]) => value),
        },
        events_by_status: {
          labels: eventStatusEntries.map(([label]) => label),
          data: eventStatusEntries.map(([, value]) => value),
        },
        families_by_city: {
          labels: cityEntries.map(([label]) => label),
          data: cityEntries.map(([, value]) => value),
        },
        families_by_neighborhood: {
          labels: neighborhoodEntries.map(([label]) => label),
          data: neighborhoodEntries.map(([, value]) => value),
        },
      },
      lists: {
        upcoming_events: upcomingEvents.map((event) => ({
          id: event.id,
          name: event.name,
          city: event.city,
          date: event.date,
          status: event.status,
          attendance: event.attendance,
        })),
        critical_stock: criticalStock.map((donation) => ({
          id: donation.id,
          name: donation.name,
          quantity: donation.current_quantity,
          available: donation.available,
          category_name: donation.category.name,
          measure_unity: donation.category.measure_unity,
          updated_at: donation.updated_at,
        })),
        recent_donations: recentDonations.map((donation) => ({
          id: donation.id,
          name: donation.name,
          created_at: donation.created_at,
          donator_name: donation.donator_name,
          category_name: donation.category.name,
        })),
        recent_families: recentFamilies.map((family) => ({
          id: family.id,
          name: family.name,
          city: family.city,
          created_at: family.created_at,
        })),
      },
    };
  }

  private createSeries(bucketConfig: BucketConfig, dates: Date[]) {
    const series = bucketConfig.labels.map(() => 0);

    for (const date of dates) {
      if (date < bucketConfig.start) {
        continue;
      }

      const index = bucketConfig.getIndex(date);
      if (index >= 0 && index < series.length) {
        series[index] += 1;
      }
    }

    return series;
  }

  private buildBucketConfig(
    period: DashboardPeriod,
    referenceDate: Date
  ): BucketConfig {
    if (period === 'month') {
      const year = referenceDate.getFullYear();
      const month = referenceDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const start = new Date(year, month, 1);

      return {
        start,
        labels: Array.from({ length: daysInMonth }, (_, index) =>
          String(index + 1).padStart(2, '0')
        ),
        getIndex: (date: Date) => {
          if (date.getFullYear() !== year || date.getMonth() !== month) {
            return -1;
          }

          return date.getDate() - 1;
        },
      };
    }

    const months = period === 'quarter' ? 3 : period === 'semester' ? 6 : 12;
    const start = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth() - (months - 1),
      1
    );

    return {
      start,
      labels: Array.from({ length: months }, (_, index) => {
        const monthDate = new Date(
          start.getFullYear(),
          start.getMonth() + index,
          1
        );
        return this.formatMonthLabel(monthDate);
      }),
      getIndex: (date: Date) =>
        (date.getFullYear() - start.getFullYear()) * 12 +
        (date.getMonth() - start.getMonth()),
    };
  }

  private formatMonthLabel(date: Date) {
    const formatted = new Intl.DateTimeFormat('pt-BR', {
      month: 'short',
    }).format(date);

    return formatted.replace('.', '').toUpperCase();
  }

  private normalizeEventStatus(status: string): SupportedStatus {
    const normalized = status
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();

    if (normalized.includes('CONCLUID') || normalized.includes('COMPLET')) {
      return 'CONCLUIDO';
    }

    if (normalized.includes('CANCEL')) {
      return 'CANCELADO';
    }

    if (
      normalized.includes('ABERTO') ||
      normalized.includes('ATIVO') ||
      normalized.includes('SCHEDULED')
    ) {
      return 'ABERTO';
    }

    return 'OUTROS';
  }

  private async getActiveEventsForDashboard(): Promise<DashboardEventRow[]> {
    if (typeof (this.prisma as any).$queryRaw !== 'function') {
      return this.prisma.event.findMany({
        where: { active: true },
        select: {
          id: true,
          name: true,
          city: true,
          date: true,
          status: true,
          attendance: true,
          created_at: true,
        },
      }) as unknown as DashboardEventRow[];
    }

    return this.prisma.$queryRaw<DashboardEventRow[]>`
      SELECT
        e.id,
        e.name,
        e.city,
        e.date,
        e.attendance,
        e.created_at,
        CASE
          WHEN e.normalized_status LIKE '%CONCLUID%' OR e.normalized_status LIKE '%COMPLET%' THEN 'COMPLETED'
          WHEN e.normalized_status LIKE '%CANCEL%' THEN 'CANCELED'
          WHEN e.normalized_status LIKE '%ABERTO%' OR e.normalized_status LIKE '%ATIVO%' OR e.normalized_status LIKE '%SCHEDULED%' THEN 'SCHEDULED'
          ELSE 'SCHEDULED'
        END AS status
      FROM (
        SELECT
          id,
          name,
          city,
          date,
          attendance,
          created_at,
          UPPER(
            TRANSLATE(
              TRIM(status::text),
              'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
              'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'
            )
          ) AS normalized_status
        FROM "events"
        WHERE active = true
      ) e
    `;
  }
}
