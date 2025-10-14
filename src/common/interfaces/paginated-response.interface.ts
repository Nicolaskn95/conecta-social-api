export interface PaginatedResponse<T> {
  page: number;
  next_page: number;
  is_last_page: boolean;
  previous_page: number;
  list: T[];
}
