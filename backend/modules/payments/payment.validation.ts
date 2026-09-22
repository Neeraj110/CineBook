import { z } from "zod";

export const createPaymentSchema = z.object({
  booking_id: z.coerce.number().int().positive("Booking ID must be a positive integer"),
  payment_method: z.string().trim().min(1, "Payment method is required").max(30),
  transaction_id: z.string().trim().min(1).max(255).optional(),
});

export const paymentIdParamSchema = z.object({
  id: z.coerce.number().int().positive("Payment ID must be a positive integer"),
});
