import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClient } from "./client";

export interface Seat {
  id: number;
  screen_id: number;
  seat_number: string;
  row_label: string;
  col_number: number;
  is_wheelchair: boolean;
  seat_type: "regular" | "premium" | "recliner";
}

export function useSeats(theaterId?: number) {
  return useQuery({
    queryKey: ["seats", theaterId],
    queryFn: async (): Promise<Seat[]> => {
      if (!theaterId) return [];
      const data = await fetchClient(`/theaters/${theaterId}/seats`);
      return data.seats || [];
    },
    enabled: !!theaterId,
  });
}

export interface TheaterFilterOptions {
  cursor?: string | null;
  limit?: number;
  city?: string;
  search?: string;
}

export interface TheatersResponse {
  theaters: any[];
  pagination?: {
    limit: number;
    next_cursor: string | null;
    has_next_page: boolean;
    total: number;
  };
}

export function useTheaters(options: TheaterFilterOptions = {}) {
  return useQuery({
    queryKey: ["admin-theaters", options],
    queryFn: async (): Promise<TheatersResponse> => {
      const params = new URLSearchParams();
      if (options.cursor) params.set("cursor", options.cursor);
      if (options.limit) params.set("limit", options.limit.toString());
      if (options.city) params.set("city", options.city);
      if (options.search) params.set("search", options.search);

      const qs = params.toString();
      const endpoint = qs ? `/theaters/with-screens?${qs}` : "/theaters/with-screens";
      const data = await fetchClient(endpoint);
      return {
        theaters: data.theaters || [],
        pagination: data.pagination,
      };
    },
  });
}

export function useCreateTheater() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (theater: any) => {
      const data = await fetchClient("/theaters", { method: "POST", body: JSON.stringify(theater) });
      return data.theater;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-theaters"] })
  });
}

export function useUpdateTheater() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...theater }: any) => {
      const data = await fetchClient(`/theaters/${id}`, { method: "PATCH", body: JSON.stringify(theater) });
      return data.theater;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-theaters"] })
  });
}

export function useDeleteTheater() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const data = await fetchClient(`/theaters/${id}`, { method: "DELETE" });
      return data.theater;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-theaters"] })
  });
}

export function useCreateScreen() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ theaterId, name, rows, seatsPerRow }: { theaterId: number, name: string, rows?: number, seatsPerRow?: number }) => {
      const data = await fetchClient(`/theaters/${theaterId}/screens`, { method: "POST", body: JSON.stringify({ name, rows, seatsPerRow }) });
      return data.screen;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-theaters"] })
  });
}

export function useDeleteScreen() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ theaterId, screenId }: { theaterId: number, screenId: number }) => {
      const data = await fetchClient(`/theaters/${theaterId}/screens/${screenId}`, { method: "DELETE" });
      return data.screen;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-theaters"] })
  });
}
