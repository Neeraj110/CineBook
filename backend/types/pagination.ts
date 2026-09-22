export interface PaginationQuery {
  cursor?: string;
  limit?: number;
}

export interface PaginationMeta {
  limit: number;
  next_cursor: string | null;
  has_next_page: boolean;
  total: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}
