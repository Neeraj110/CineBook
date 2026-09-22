import { z } from "zod";

const showFields = {
  movie_id: z.coerce.number().int().positive("Movie ID must be a positive integer"),
  screen_id: z.coerce.number().int().positive("Screen ID must be a positive integer"),
  start_time: z.coerce.date(),
  end_time: z.coerce.date(),
  ticket_price: z.coerce.number().min(0, "Ticket price cannot be negative"),
  format: z.string().trim().min(1, "Format is required").optional(),
  language: z.string().trim().min(1, "Language is required").optional(),
  has_subtitles: z.coerce.boolean().optional(),
};

const validateTimes = (show: { start_time: Date; end_time: Date }) =>
  show.end_time > show.start_time;

export const createShowSchema = z.object(showFields).refine(validateTimes, {
  message: "End time must be after start time",
  path: ["end_time"],
});

export const updateShowSchema = z
  .object({
    movie_id: showFields.movie_id.optional(),
    screen_id: showFields.screen_id.optional(),
    start_time: showFields.start_time.optional(),
    end_time: showFields.end_time.optional(),
    ticket_price: showFields.ticket_price.optional(),
    format: showFields.format,
    language: showFields.language,
    has_subtitles: showFields.has_subtitles,
  })
  .refine((show) => Object.keys(show).length > 0, {
    message: "At least one show field is required",
  });

export const showIdParamSchema = z.object({
  id: z.coerce.number().int().positive("Show ID must be a positive integer"),
});

export const relatedShowIdParamSchema = z.object({
  movieId: z.coerce.number().int().positive("Movie ID must be a positive integer").optional(),
  screenId: z.coerce.number().int().positive("Screen ID must be a positive integer").optional(),
});

export const getShowsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  movie_id: z.coerce.number().int().positive().optional(),
  screen_id: z.coerce.number().int().positive().optional(),
  theatre_id: z.coerce.number().int().positive().optional(),
  theatre_city: z.string().trim().optional(),
  format: z.string().trim().optional(),
  language: z.string().trim().optional(),
  start_date: z.coerce.date().optional(),
});

export type GetShowsQuery = z.infer<typeof getShowsQuerySchema>;
