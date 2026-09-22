import { z } from "zod";

export const createBookingSchema = z.object({
  show_id: z.coerce.number().int().positive("Show ID must be a positive integer"),
  show_seat_ids: z
    .array(z.coerce.number().int().positive())
    .min(1, "At least one seat is required")
    .refine((seatIds) => new Set(seatIds).size === seatIds.length, {
      message: "Seat IDs must be unique",
    }),
});

export const bookingIdParamSchema = z.object({
  id: z.coerce.number().int().positive("Booking ID must be a positive integer"),
});

export const getBookingsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.string().trim().optional(),
  search: z.string().trim().optional(),
  user_id: z.coerce.number().int().positive().optional(),
  show_id: z.coerce.number().int().positive().optional(),
});

export type GetBookingsQuery = z.infer<typeof getBookingsQuerySchema>;
