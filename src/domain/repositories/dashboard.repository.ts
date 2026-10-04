import { EmployeeRole } from '../enums';

export interface DashboardFamilyRow {
  id: string;
  name: string;
  city: string;
  neighborhood: string;
  created_at: Date;
}

export interface DashboardEmployeeRow {
  id: string;
  role: EmployeeRole;
}

export interface DashboardEventRow {
  id: string;
  name: string;
  city: string;
  date: Date | string;
  status: string;
  attendance: number | null;
  created_at: Date | string;
}

export interface DashboardDonationRow {
  id: string;
  name: string;
  donator_name: string | null;
  current_quantity: number;
  available: boolean;
  created_at: Date;
  updated_at: Date;
  category: {
    name: string;
    measure_unity: string;
  };
}

export interface DashboardSource {
  families: DashboardFamilyRow[];
  employees: DashboardEmployeeRow[];
  events: DashboardEventRow[];
  donations: DashboardDonationRow[];
}

/** Leitura agregada (somente registros ativos) para o dashboard. */
export abstract class DashboardRepository {
  abstract getOverviewSource(): Promise<DashboardSource>;
}
