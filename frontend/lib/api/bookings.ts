import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClient } from "./client";

export interface BookingSeat {
  id: number;
  show_seat_id: number;
  price: string;
  seat_number: string;
  row_label: string;
  col_number: number;
}

export interface Booking {
  id: number;
  user_id: number;
  show_id: number;
  status: "pending" | "confirmed" | "cancelled" | "expired";
  total_amount: string;
  created_at: string;
  updated_at: string;
  movie_title: string;
  start_time: string;
  end_time: string;
  screen_name: string;
  theatre_name: string;
  theatre_city: string;
  seats?: BookingSeat[];
  payment_status?: string | null;
  refund_amount?: number;
  refund_percentage?: number;
}

export function useBooking(bookingId?: string) {
  return useQuery({
    queryKey: ["booking", bookingId],
    queryFn: async (): Promise<Booking> => {
      const data = await fetchClient(`/bookings/${bookingId}`);
      return data.booking;
    },
    enabled: !!bookingId,
  });
}

export function useMyBookings() {
  return useQuery({
    queryKey: ["my-bookings"],
    queryFn: async (): Promise<Booking[]> => {
      const data = await fetchClient(`/bookings/mine`);
      return data.bookings || [];
    }
  });
}

export interface BookingFilterOptions {
  cursor?: string | null;
  limit?: number;
  status?: string;
  search?: string;
}

export interface BookingsResponse {
  bookings: Booking[];
  pagination?: {
    limit: number;
    next_cursor: string | null;
    has_next_page: boolean;
    total: number;
  };
}

export function useAllBookings(options: BookingFilterOptions = {}) {
  return useQuery({
    queryKey: ["admin-bookings", options],
    queryFn: async (): Promise<BookingsResponse> => {
      const params = new URLSearchParams();
      if (options.cursor) params.set("cursor", options.cursor);
      if (options.limit) params.set("limit", options.limit.toString());
      if (options.status) params.set("status", options.status);
      if (options.search) params.set("search", options.search);

      const qs = params.toString();
      const endpoint = qs ? `/bookings?${qs}` : "/bookings";
      const data = await fetchClient(endpoint);
      return {
        bookings: data.bookings || [],
        pagination: data.pagination,
      };
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bookingId: number) => {
      const data = await fetchClient(`/bookings/${bookingId}/cancel`, { method: "PATCH" });
      return data.booking;
    },
    onSuccess: (data, bookingId) => {
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking", bookingId.toString()] });
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
    }
  });
}

