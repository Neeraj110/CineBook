import { prisma } from "../../config/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";
import type { MovieQueryOptions, UpdateFields } from "../../types/index.js";

type MovieMeta = {
  poster_url?: string | null;
  banner_url?: string | null;
  trailer_url?: string | null;
  certification?: string | null;
  rating?: number;
  is_released?: boolean;
};

export const createMovie = async (
  title: string,
  description: string,
  duration_minutes: number,
  release_date: Date,
  language: string,
  genre: string,
  movieMeta: MovieMeta = {},
) => {
  const {
    poster_url = null,
    banner_url = null,
    trailer_url = null,
    certification = null,
    rating = 0.0,
    is_released = true,
  } = movieMeta;

  return await prisma.movie.create({
    data: {
      title,
      description,
      durationMinutes: duration_minutes,
      releaseDate: new Date(release_date),
      language,
      genre,
      posterUrl: poster_url,
      bannerUrl: banner_url,
      trailerUrl: trailer_url,
      certification,
      rating,
      isReleased: is_released,
    },
  });
};

export const getAllMovies = async (options: MovieQueryOptions = {}) => {
  const limit = options.limit ?? 20;
  const searchTerm = options.search || options.q;
  const where: Prisma.MovieWhereInput = {};

  if (searchTerm) {
    where.OR = [
      { title: { contains: searchTerm, mode: "insensitive" } },
      { description: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  if (options.genre) {
    where.genre = { contains: options.genre, mode: "insensitive" };
  }

  if (options.language) {
    where.language = { contains: options.language, mode: "insensitive" };
  }

  if (options.is_released !== undefined) {
    where.isReleased = options.is_released;
  }

  if (options.min_rating !== undefined) {
    where.rating = { gte: options.min_rating };
  }

  const cursorObj = options.cursor ? { id: BigInt(options.cursor) } : undefined;

  const [movies, total] = await Promise.all([
    prisma.movie.findMany({
      take: limit + 1,
      skip: cursorObj ? 1 : 0,
      cursor: cursorObj,
      where,
      orderBy: { id: "desc" },
    }),
    prisma.movie.count({ where }),
  ]);

  const hasNextPage = movies.length > limit;
  const data = hasNextPage ? movies.slice(0, limit) : movies;
  const nextCursor = hasNextPage ? data[data.length - 1].id.toString() : null;

  return {
    movies: data,
    pagination: {
      limit,
      next_cursor: nextCursor,
      has_next_page: hasNextPage,
      total,
    },
  };
};

export const getMovieById = async (id: bigint) => {
  return await prisma.movie.findUnique({
    where: { id },
  });
};

export const updateMovie = async (id: bigint, updates: UpdateFields) => {
  // Map snake_case to camelCase for Prisma
  const data: Record<string, unknown> = {};
  if (updates.title !== undefined) data.title = updates.title;
  if (updates.description !== undefined) data.description = updates.description;
  if (updates.duration_minutes !== undefined) data.durationMinutes = updates.duration_minutes;
  if (updates.release_date !== undefined)
    data.releaseDate = new Date(updates.release_date as string | Date);
  if (updates.language !== undefined) data.language = updates.language;
  if (updates.genre !== undefined) data.genre = updates.genre;
  if (updates.poster_url !== undefined) data.posterUrl = updates.poster_url;
  if (updates.banner_url !== undefined) data.bannerUrl = updates.banner_url;
  if (updates.trailer_url !== undefined) data.trailerUrl = updates.trailer_url;
  if (updates.certification !== undefined) data.certification = updates.certification;
  if (updates.rating !== undefined) data.rating = updates.rating;
  if (updates.is_released !== undefined) data.isReleased = updates.is_released;

  return await prisma.movie.update({
    where: { id },
    data,
  });
};

export const deleteMovie = async (id: bigint) => {
  return await prisma.$transaction(async (tx) => {
    const futureShows = await tx.show.findMany({
      where: { movieId: id, startTime: { gte: new Date() } },
      select: { id: true },
    });
    const showIds = futureShows.map((show) => show.id);

    if (showIds.length > 0) {
      const bookingIds = (
        await tx.booking.findMany({
          where: { showId: { in: showIds } },
          select: { id: true },
        })
      ).map((booking) => booking.id);

      if (bookingIds.length > 0) {
        await tx.payment.deleteMany({ where: { bookingId: { in: bookingIds } } });
        await tx.booking.deleteMany({ where: { id: { in: bookingIds } } });
      }

      await tx.show.deleteMany({ where: { id: { in: showIds } } });
    }

    return tx.movie.delete({ where: { id } });
  });
};

export const searchMovies = async (searchTerm: string) => {
  return await prisma.movie.findMany({
    where: {
      OR: [
        { title: { contains: searchTerm, mode: "insensitive" } },
        { description: { contains: searchTerm, mode: "insensitive" } },
      ],
    },
  });
};

export const getMoviesByGenre = async (genre: string) => {
  return await prisma.movie.findMany({
    where: { genre },
  });
};

export const getShowsByMovieId = async (movieId: bigint) => {
  const shows = await prisma.show.findMany({
    where: { movieId },
    orderBy: { startTime: "asc" },
    include: {
      movie: { select: { id: true, title: true } },
      screen: {
        include: {
          theatre: { select: { id: true, name: true, city: true } },
        },
      },
    },
  });

  return shows.map((show) => ({
    id: show.id,
    start_time: show.startTime,
    end_time: show.endTime,
    ticket_price: show.ticketPrice,
    movie_id: show.movie.id,
    movie_title: show.movie.title,
    screen_id: show.screen.id,
    screen_name: show.screen.name,
    theatre_id: show.screen.theatre.id,
    theatre_name: show.screen.theatre.name,
    theatre_city: show.screen.theatre.city,
  }));
};
