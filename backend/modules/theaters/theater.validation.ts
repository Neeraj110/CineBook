import { z } from "zod";

export const createTheaterSchema = z.object({
  name: z.string().trim().min(1, "Theater name is required"),
  address: z.string().trim().min(1, "Address is required"),
  city: z.string().trim().min(1, "City is required"),
});

export const updateTheaterSchema = z
  .object({
    name: z.string().trim().min(1, "Theater name is required").optional(),
    address: z.string().trim().min(1, "Address is required").optional(),
    city: z.string().trim().min(1, "City is required").optional(),
  })
  .refine((theater) => Object.keys(theater).length > 0, {
    message: "At least one theater field is required",
  });

export const deleteTheaterSchema = z.object({
  id: z.string().trim().min(1, "Theater ID is required"),
});

export const createScreenSchema = z.object({
  name: z.string().trim().min(1, "Screen name is required"),
  rows: z.number().int().min(1).max(26).optional(),
  seatsPerRow: z.number().int().min(1).max(50).optional(),
});

export const updateScreenSchema = z
  .object({
    name: z.string().trim().min(1, "Screen name is required").optional(),
  })
  .refine((screen) => Object.keys(screen).length > 0, {
    message: "At least one screen field is required",
  });

export const theaterIdParamSchema = z.object({
  id: z.string().trim().min(1, "Theater ID is required"),
});

export const screenIdParamSchema = z.object({
  screenId: z.string().trim().min(1, "Screen ID is required"),
});

export const getTheatersQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  city: z.string().trim().optional(),
  search: z.string().trim().optional(),
});

export type GetTheatersQuery = z.infer<typeof getTheatersQuerySchema>;
