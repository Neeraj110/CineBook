export type UserRole = "user" | "admin";

export interface User {
  id: bigint | number;
  name: string;
  email: string;
  role: UserRole | string;
  createdAt: Date | string;
  passwordHash?: string;
  updatedAt?: Date | string;
}

export interface MovieQueryOptions {
  cursor?: string;
  limit?: number;
  search?: string;
  q?: string;
  genre?: string;
  language?: string;
  is_released?: boolean;
  min_rating?: number;
}

export interface BookingQueryOptions {
  cursor?: string;
  limit?: number;
  status?: string;
  search?: string;
  user_id?: number;
  show_id?: number;
}

export interface ShowQueryOptions {
  cursor?: string;
  limit?: number;
  movie_id?: number;
  screen_id?: number;
  theatre_id?: number;
  theatre_city?: string;
  format?: string;
  language?: string;
  start_date?: Date;
}

export interface TheaterQueryOptions {
  cursor?: string;
  limit?: number;
  city?: string;
  search?: string;
}

export interface CreateShowInput {
  movie_id: bigint;
  screen_id: bigint;
  start_time: Date;
  end_time: Date;
  ticket_price: number;
  format?: string;
  language?: string;
  has_subtitles?: boolean;
}

export interface CreateShowRequest {
  movie_id: number;
  screen_id: number;
  start_time: Date;
  end_time: Date;
  ticket_price: number;
  format?: string;
  language?: string;
  has_subtitles?: boolean;
}

export interface BookingInput {
  show_id: number;
  show_seat_ids: number[];
}

export type UpdateFields = Record<string, unknown>;
