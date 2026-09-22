import { prisma } from "../../config/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";
import { apiError } from "../../utils/index.js";
import type { CreateShowInput, ShowQueryOptions, UpdateFields } from "../../types/index.js";

export const createShow = async ({
  movie_id,
  screen_id,
  start_time,
  end_time,
  ticket_price,
  format = "2D",
  language = "Hindi",
  has_subtitles = false,
}: CreateShowInput) => {
  // Create the show
  const show = await prisma.show.create({
    data: {
      movieId: movie_id,
      screenId: screen_id,
      startTime: start_time,
      endTime: end_time,
      ticketPrice: ticket_price,
      format,
      language,
      hasSubtitles: has_subtitles,
    },
  });

  // Auto-generate ShowSeat records for every seat in the screen
  const seats = await prisma.seat.findMany({
    where: { screenId: screen_id },
  });

  if (seats.length > 0) {
    await prisma.showSeat.createMany({
      data: seats.map((seat) => ({
        showId: show.id,
        seatId: seat.id,
        status: "available",
        price: ticket_price,
      })),
    });
  }

  return show;
};

const _dummyQuery = () =>
  prisma.show.findFirst({
    include: {
      movie: true,
      screen: {
        include: {
          theatre: true,
        },
      },
    },
  });

type ShowWithRelations = NonNullable<Awaited<ReturnType<typeof _dummyQuery>>>;

const mapShowResult = (show: ShowWithRelations) => ({
  id: show.id,
  movie_id: show.movieId,
  movie_title: show.movie.title,
  screen_id: show.screenId,
  screen_name: show.screen.name,
  theatre_id: show.screen.theatre.id,
  theatre_name: show.screen.theatre.name,
  theatre_city: show.screen.theatre.city,
  start_time: show.startTime,
  end_time: show.endTime,
  ticket_price: show.ticketPrice,
  format: show.format,
  language: show.language,
  has_subtitles: show.hasSubtitles,
});

export const getAllShows = async (options: ShowQueryOptions = {}) => {
  const limit = options.limit ?? 20;
  const where: Prisma.ShowWhereInput = {};

  if (options.movie_id) where.movieId = BigInt(options.movie_id);
  if (options.screen_id) where.screenId = BigInt(options.screen_id);
  if (options.format) where.format = { equals: options.format, mode: "insensitive" };
  if (options.language) where.language = { equals: options.language, mode: "insensitive" };
  if (options.start_date) where.startTime = { gte: options.start_date };

  if (options.theatre_id || options.theatre_city) {
    where.screen = {
      theatre: {
        ...(options.theatre_id ? { id: BigInt(options.theatre_id) } : {}),
        ...(options.theatre_city
          ? { city: { contains: options.theatre_city, mode: "insensitive" } }
          : {}),
      },
    };
  }

  const cursorObj = options.cursor ? { id: BigInt(options.cursor) } : undefined;

  const [shows, total] = await Promise.all([
    prisma.show.findMany({
      take: limit + 1,
      skip: cursorObj ? 1 : 0,
      cursor: cursorObj,
      where,
      orderBy: { id: "asc" },
      include: {
        movie: true,
        screen: {
          include: {
            theatre: true,
          },
        },
      },
    }),
    prisma.show.count({ where }),
  ]);

  const hasNextPage = shows.length > limit;
  const data = hasNextPage ? shows.slice(0, limit) : shows;
  const nextCursor = hasNextPage ? data[data.length - 1].id.toString() : null;

  return {
    shows: data.map(mapShowResult),
    pagination: {
      limit,
      next_cursor: nextCursor,
      has_next_page: hasNextPage,
      total,
    },
  };
};

export const getShowById = async (id: bigint) => {
  const show = await prisma.show.findUnique({
    where: { id },
    include: {
      movie: true,
      screen: {
        include: {
          theatre: true,
        },
      },
      showSeats: {
        orderBy: [{ seat: { rowLabel: "asc" } }, { seat: { colNumber: "asc" } }],
        include: { seat: true },
      },
    },
  });
  if (!show) return null;

  return {
    ...mapShowResult(show),
    seats: show.showSeats.map((showSeat) => ({
      id: showSeat.id,
      seat_number: showSeat.seat.seatNumber,
      row_label: showSeat.seat.rowLabel,
      col_number: showSeat.seat.colNumber,
      seat_type: showSeat.seat.seatType,
      price: showSeat.price,
      status:
        showSeat.status === "reserved" && showSeat.lockedUntil && showSeat.lockedUntil < new Date()
          ? "available"
          : showSeat.status,
    })),
  };
};

export const getShowsByMovieId = async (movieId: bigint) => {
  const shows = await prisma.show.findMany({
    where: { movieId },
    orderBy: { startTime: "asc" },
    include: {
      movie: true,
      screen: {
        include: {
          theatre: true,
        },
      },
    },
  });
  return shows.map(mapShowResult);
};

export const getShowsByScreenId = async (screenId: bigint) => {
  const shows = await prisma.show.findMany({
    where: { screenId },
    orderBy: { startTime: "asc" },
    include: {
      movie: true,
      screen: {
        include: {
          theatre: true,
        },
      },
    },
  });
  return shows.map(mapShowResult);
};

export const updateShow = async (id: bigint, updates: UpdateFields) => {
  const data: Record<string, unknown> = {};
  if (updates.movie_id !== undefined) data.movieId = updates.movie_id;
  if (updates.screen_id !== undefined) data.screenId = updates.screen_id;
  if (updates.start_time !== undefined) data.startTime = updates.start_time;
  if (updates.end_time !== undefined) data.endTime = updates.end_time;
  if (updates.ticket_price !== undefined) data.ticketPrice = updates.ticket_price;
  if (updates.format !== undefined) data.format = updates.format;
  if (updates.language !== undefined) data.language = updates.language;
  if (updates.has_subtitles !== undefined) data.hasSubtitles = updates.has_subtitles;

  return await prisma.show.update({
    where: { id },
    data,
  });
};

export const deleteShow = async (id: bigint) => {
  return await prisma.$transaction(async (tx) => {
    const show = await tx.show.findUnique({
      where: { id },
      select: { id: true, endTime: true },
    });

    if (!show) return null;

    if (show.endTime >= new Date()) {
      throw apiError(409, "Only previous shows can be deleted");
    }

    const bookingCount = await tx.booking.count({ where: { showId: id } });
    if (bookingCount > 0) {
      throw apiError(409, "Shows with bookings cannot be deleted");
    }

    return tx.show.delete({
      where: { id },
    });
  });
};
