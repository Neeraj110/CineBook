import { z } from "zod";

export const createMovieSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().min(1, "Description is required"),
  duration_minutes: z.number().int().positive("Duration must be a positive integer"),
  release_date: z.string().trim().min(1, "Release date is required"),
  language: z.string().trim().min(1, "Language is required"),
  genre: z.string().trim().min(1, "Genre is required"),
  poster_url: z
    .string()
    .url("Poster URL must be a valid URL")
    .nullable()
    .optional()
    .or(z.literal("")),
  banner_url: z
    .string()
    .url("Banner URL must be a valid URL")
    .nullable()
    .optional()
    .or(z.literal("")),
  trailer_url: z
    .string()
    .url("Trailer URL must be a valid URL")
    .nullable()
    .optional()
    .or(z.literal("")),
  certification: z.enum(["U", "UA", "A", "R", "PG-13"]).nullable().optional().or(z.literal("")),
  rating: z.number().min(0).max(10).optional(),
  is_released: z.boolean().optional(),
});

export const updateMovieSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").optional(),
    description: z.string().trim().min(1, "Description is required").optional(),
    duration_minutes: z.number().int().positive("Duration must be a positive integer").optional(),
    release_date: z.string().trim().min(1, "Release date is required").optional(),
    language: z.string().trim().min(1, "Language is required").optional(),
    genre: z.string().trim().min(1, "Genre is required").optional(),
    poster_url: z
      .string()
      .url("Poster URL must be a valid URL")
      .nullable()
      .optional()
      .or(z.literal("")),
    banner_url: z
      .string()
      .url("Banner URL must be a valid URL")
      .nullable()
      .optional()
      .or(z.literal("")),
    trailer_url: z
      .string()
      .url("Trailer URL must be a valid URL")
      .nullable()
      .optional()
      .or(z.literal("")),
    certification: z.enum(["U", "UA", "A", "R", "PG-13"]).nullable().optional().or(z.literal("")),
    rating: z.number().min(0).max(10).optional(),
    is_released: z.boolean().optional(),
  })
  .refine((movie) => Object.keys(movie).length > 0, {
    message: "At least one movie field is required",
  });

export const deleteMovieSchema = z.object({
  id: z.string().trim().min(1, "Movie ID is required"),
});

export const searchMovieSchema = z.object({
  q: z.string().trim().min(1, "Search term is required").optional(),
});

export const movieGenreSchema = z.object({
  genre: z.string().trim().min(1, "Genre is required"),
});

export const movieIdParamSchema = z.object({
  id: z.string().trim().min(1, "Movie ID is required"),
});

export const getMoviesQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  q: z.string().trim().optional(),
  genre: z.string().trim().optional(),
  language: z.string().trim().optional(),
  is_released: z
    .preprocess((val) => {
      if (val === "true" || val === true) return true;
      if (val === "false" || val === false) return false;
      return undefined;
    }, z.boolean().optional())
    .optional(),
  min_rating: z.coerce.number().min(0).max(10).optional(),
});

export type GetMoviesQuery = z.infer<typeof getMoviesQuerySchema>;
