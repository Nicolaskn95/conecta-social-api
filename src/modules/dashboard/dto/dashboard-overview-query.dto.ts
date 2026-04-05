import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export const DASHBOARD_PERIODS = [
  'month',
  'quarter',
  'semester',
  'year',
] as const;

export type DashboardPeriod = (typeof DASHBOARD_PERIODS)[number];

export class DashboardOverviewQueryDto {
  @ApiPropertyOptional({
    enum: DASHBOARD_PERIODS,
    default: 'year',
    description: 'Período usado para as séries temporais do dashboard',
  })
  @IsOptional()
  @IsIn(DASHBOARD_PERIODS)
  period?: DashboardPeriod;
}
