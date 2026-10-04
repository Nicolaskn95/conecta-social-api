import { Event } from '../entities';
import { EventStatus } from '../enums';

export interface CreateEventData {
  name: string;
  description?: string | null;
  date: Date;
  greeting_description?: string | null;
  attendance?: number | null;
  embedded_instagram?: string | null;
  status?: EventStatus;
  street: string;
  neighborhood: string;
  number: string;
  city: string;
  state: string;
  cep: string;
  complement?: string | null;
  active?: boolean;
}

export type UpdateEventData = Partial<CreateEventData>;

export abstract class EventRepository {
  abstract create(data: CreateEventData): Promise<Event>;
  abstract findAll(): Promise<Event[]>;
  abstract findAllActives(): Promise<Event[]>;
  abstract findById(id: string): Promise<Event | null>;
  abstract update(id: string, data: UpdateEventData): Promise<Event>;
  /** Eventos ativos com data >= `from`, ordem crescente de data. */
  abstract findUpcoming(from: Date, limit?: number): Promise<Event[]>;
  /** Eventos ativos com data < `before`, ordem decrescente de data. */
  abstract findPast(before: Date, limit: number): Promise<Event[]>;
  /** Eventos ativos com embedded_instagram preenchido, ordem decrescente de data. */
  abstract findRecentWithInstagram(limit: number): Promise<Event[]>;
  abstract findPaginated(skip: number, take: number): Promise<Event[]>;
  abstract countActives(): Promise<number>;
}
