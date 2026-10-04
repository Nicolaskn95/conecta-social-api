import { Injectable } from '@nestjs/common';
import {
  DashboardEventRow,
  DashboardRepository,
  DashboardSource,
} from '@/domain/repositories';
import { PrismaService } from '../prisma.service';
import { toDomain } from '../prisma-transaction-manager';

@Injectable()
export class DashboardPrismaRepository extends DashboardRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async getOverviewSource(): Promise<DashboardSource> {
    const [families, employees, events, donations] = await Promise.all([
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
        select: { id: true, role: true },
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
          category: { select: { name: true, measure_unity: true } },
        },
      }),
    ]);

    return toDomain<DashboardSource>({ families, employees, events, donations });
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
