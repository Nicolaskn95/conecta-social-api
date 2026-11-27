import {
  AuditActionType,
  AuditEntityType,
  DonationStockAdjustmentReason,
  EmployeeRole,
  EventStatus,
  DeliveryMode,
  DonationCondition,
  DonationAllocationStatus,
  NeedStatus,
} from '../enums';

/**
 * Entidades de domínio (formato retornado pela API).
 * Independentes de Prisma/Mongoose — os adapters de banco devem mapear para cá.
 */

export interface Employee {
  id: string;
  name: string;
  surname: string;
  birth_date: Date;
  cpf: string;
  email: string;
  phone: string;
  password: string;
  role: EmployeeRole;
  cep: string;
  street: string;
  neighborhood: string;
  number: string;
  city: string;
  state: string;
  complement: string | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Event {
  id: string;
  name: string;
  description: string | null;
  date: Date;
  greeting_description: string | null;
  attendance: number | null;
  embedded_instagram: string | null;
  status: EventStatus;
  street: string;
  neighborhood: string;
  number: string;
  city: string;
  state: string;
  cep: string;
  complement: string | null;
  active: boolean;
  updated_at: Date;
  created_at: Date;
}

export interface Family {
  monthly_income_cents?: number | null;
  housing_description?: string | null;
  preferred_delivery_mode?: `${DeliveryMode}` | null;

  id: string;
  name: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  created_at: Date;
  updated_at: Date;
  active: boolean;
}

export interface Category {
  id: string;
  name: string;
  measure_unity: string;
  created_at: Date;
  active: boolean;
}

export interface Donation {
  item_type_id?: string | null;
  condition?: DonationCondition | null;
  specifications?: ItemSpecifications | null;

  id: string;
  category_id: string;
  name: string;
  description: string | null;
  initial_quantity: number;
  current_quantity: number;
  donator_name: string | null;
  gender: string | null;
  size: string | null;
  image_key: string | null;
  image_bucket: string | null;
  image_content_type: string | null;
  image_original_name: string | null;
  active: boolean;
  available: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface DonationWithCategory extends Donation {
  category: Category;
}

export interface DonationToFamily {
  status?: DonationAllocationStatus;
  delivery_mode?: DeliveryMode | null;
  id_need?: string | null;
  id_beneficiary?: string | null;
  separated_at?: Date | null;
  received_at?: Date | null;
  confirmed_at?: Date | null;
  canceled_at?: Date | null;
  separated_by?: string | null;
  confirmed_by?: string | null;
  canceled_by?: string | null;
  request_id?: string | null;
  request_fingerprint?: string | null;

  id: string;
  id_donation: string;
  id_family: string;
  quantity: number;
  update_message: string | null;
  created_at: Date;
  updated_at: Date;
  active: boolean;
}

export interface DonationToFamilyWithRelations extends DonationToFamily {
  beneficiary?: { id: string; name: string; surname: string; active: boolean } | null;
  donation: DonationWithCategory;
  family: Family;
}

export interface DonationStockAdjustment {
  id: string;
  id_donation: string;
  id_employee: string;
  delta_quantity: number;
  previous_quantity: number;
  new_quantity: number;
  reason: DonationStockAdjustmentReason;
  note: string | null;
  created_at: Date;
}

export type EmployeeSummary = Pick<Employee, 'id' | 'name' | 'surname' | 'role'>;

export interface DonationStockAdjustmentWithEmployee
  extends DonationStockAdjustment {
  employee: EmployeeSummary;
}

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface AuditLog {
  id: string;
  entity_type: AuditEntityType;
  entity_id: string;
  action_type: AuditActionType;
  actor_employee_id: string | null;
  actor_role: EmployeeRole | null;
  message: string;
  metadata: JsonValue | null;
  created_at: Date;
}

export interface ItemSpecifications {
  seat_width_cm?: number;
  shoe_size_br?: number;
}

export interface ItemType {
  id: string;
  code: string;
  name: string;
  category_id: string;
  aliases: string[];
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Need {
  id: string;
  id_family: string;
  id_beneficiary: string | null;
  item_type_id: string | null;
  description: string | null;
  requested_quantity: number | null;
  specifications: ItemSpecifications | null;
  status: NeedStatus;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
  version: number;
}
