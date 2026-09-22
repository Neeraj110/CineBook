import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClient } from "./client";

export interface Show {
  id: number;
  movie_id: number;
  movie_title: string;
  screen_id: number;
  screen_name: string;
  theatre_id: number;
  theatre_name: string;
  theatre_city: string;
  start_time: string;
  end_time: string;
  ticket_price: string;
  format: string;
  language: string;
  has_subtitles: boolean;
  seats: {
    id: number;
    seat_number: string;
    row_label: string;
    col_number: number;
    seat_type: "regular" | "premium" | "recliner";
    price: string;
    status: "available" | "reserved" | "booked";
  }[];
}

export function useShowsForMovie(movieId: string) {
  return useQuery({
    queryKey: ["shows", "movie", movieId],
    queryFn: async (): Promise<Show[]> => {
      const data = await fetchClient(`/shows/movie/${movieId}`);
      return data.shows || [];
    },
    enabled: !!movieId,
  });
}

export function useShow(showId: string) {
  return useQuery({
    queryKey: ["show", showId],
    queryFn: async (): Promise<Show> => {
      const data = await fetchClient(`/shows/${showId}`);
      return data.show;
    },
    enabled: !!showId,
  });
}

export interface PaginationInfo {
  limit: number;
  next_cursor: string | null;
  has_next_page: boolean;
  total: number;
}

export interface ShowFilterOptions {
  cursor?: string | null;
  limit?: number;
  movie_id?: number;
  screen_id?: number;
  theatre_id?: number;
  theatre_city?: string;
  format?: string;
  language?: string;
  start_date?: string;
}

export interface ShowsResponse {
  shows: Show[];
  pagination?: PaginationInfo;
}

export function useAllShows(options: ShowFilterOptions = {}) {
  return useQuery({
    queryKey: ["admin-shows", options],
    queryFn: async (): Promise<ShowsResponse> => {
      const params = new URLSearchParams();
      if (options.cursor) params.set("cursor", options.cursor);
      if (options.limit) params.set("limit", options.limit.toString());
      if (options.movie_id) params.set("movie_id", options.movie_id.toString());
      if (options.screen_id) params.set("screen_id", options.screen_id.toString());
      if (options.theatre_id) params.set("theatre_id", options.theatre_id.toString());
      if (options.theatre_city) params.set("theatre_city", options.theatre_city);
      if (options.format) params.set("format", options.format);
      if (options.language) params.set("language", options.language);
      if (options.start_date) params.set("start_date", options.start_date);

      const qs = params.toString();
      const endpoint = qs ? `/shows?${qs}` : "/shows";
      const data = await fetchClient(endpoint);
      return {
        shows: data.shows || [],
        pagination: data.pagination,
      };
    },
  });
}

export function useCreateShow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (show: any) => {
      const data = await fetchClient("/shows", { method: "POST", body: JSON.stringify(show) });
      return data.show;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-shows"] });
      queryClient.invalidateQueries({ queryKey: ["shows"] });
    }
  });
}

export function useUpdateShow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const data = await fetchClient(`/shows/${id}`, { method: "PATCH", body: JSON.stringify(updates) });
      return data.show;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-shows"] });
      queryClient.invalidateQueries({ queryKey: ["shows"] });
    }
  });
}

export function useDeleteShow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const data = await fetchClient(`/shows/${id}`, { method: "DELETE" });
      return data.show;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-shows"] });
      queryClient.invalidateQueries({ queryKey: ["shows"] });
    }
  });
}
