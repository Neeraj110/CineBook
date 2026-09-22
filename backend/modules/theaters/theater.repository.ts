import { prisma } from "../../config/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";
import type { TheaterQueryOptions, UpdateFields } from "../../types/index.js";

type TheaterLocation = {
  latitude?: number | null;
  longitude?: number | null;
  landmark?: string | null;
};

const createTheater = async (
  name: string,
  address: string,
  city: string,
  location: TheaterLocation = {},
) => {
  const { latitude = null, longitude = null, landmark = null } = location;

  return await prisma.theatre.create({
    data: {
      name,
      address,
      city,
      latitude,
      longitude,
      landmark,
    },
  });
};

const getAllTheaters = async (options: TheaterQueryOptions = {}) => {
  const limit = options.limit ?? 20;
  const where: Prisma.TheatreWhereInput = {};

  if (options.city) {
    where.city = { contains: options.city, mode: "insensitive" };
  }

  if (options.search) {
    where.name = { contains: options.search, mode: "insensitive" };
  }

  const cursorObj = options.cursor ? { id: BigInt(options.cursor) } : undefined;

  const [theaters, total] = await Promise.all([
    prisma.theatre.findMany({
      take: limit + 1,
      skip: cursorObj ? 1 : 0,
      cursor: cursorObj,
      where,
      orderBy: { id: "asc" },
      include: {
        screens: {
          orderBy: { id: "asc" },
        },
      },
    }),
    prisma.theatre.count({ where }),
  ]);

  const hasNextPage = theaters.length > limit;
  const data = hasNextPage ? theaters.slice(0, limit) : theaters;
  const nextCursor = hasNextPage ? data[data.length - 1].id.toString() : null;

  return {
    theaters: data,
    pagination: {
      limit,
      next_cursor: nextCursor,
      has_next_page: hasNextPage,
      total,
    },
  };
};

const getTheaterById = async (id: bigint) => {
  return await prisma.theatre.findUnique({
    where: { id },
  });
};

const updateTheater = async (id: bigint, updates: UpdateFields) => {
  return await prisma.theatre.update({
    where: { id },
    data: updates,
  });
};

const deleteTheater = async (id: bigint) => {
  return await prisma.$transaction(async (tx) => {
    const screens = await tx.screen.findMany({ where: { theatreId: id }, select: { id: true } });
    const screenIds = screens.map((s) => s.id);

    if (screenIds.length > 0) {
      const shows = await tx.show.findMany({
        where: { screenId: { in: screenIds } },
        select: { id: true },
      });
      const showIds = shows.map((s) => s.id);

      if (showIds.length > 0) {
        const bookings = await tx.booking.findMany({
          where: { showId: { in: showIds } },
          select: { id: true },
        });
        const bookingIds = bookings.map((b) => b.id);

        if (bookingIds.length > 0) {
          // BookingSeat cascades from Booking, but Payment restricts Booking
          await tx.payment.deleteMany({ where: { bookingId: { in: bookingIds } } });

          // ShowSeat is restricted from being deleted if BookingSeat exists.
          // Wait, if Booking is deleted, BookingSeat is deleted by Cascade.
          await tx.booking.deleteMany({ where: { showId: { in: showIds } } });
        }

        // ShowSeat cascades from Show, so deleting Show will delete ShowSeat
        await tx.show.deleteMany({ where: { screenId: { in: screenIds } } });
      }
    }

    return await tx.theatre.delete({
      where: { id },
    });
  });
};

const getScreensByTheaterId = async (theatreId: bigint) => {
  return await prisma.screen.findMany({
    where: { theatreId },
    orderBy: { id: "asc" },
  });
};

const getScreenById = async (theatreId: bigint, screenId: bigint) => {
  return await prisma.screen.findUnique({
    where: {
      id: screenId,
    },
  });
};

const createScreen = async (
  theatreId: bigint,
  name: string,
  screenType = "2D",
  rows = 10,
  seatsPerRow = 12,
) => {
  const screen = await prisma.screen.create({
    data: {
      theatreId,
      name,
      screenType,
    },
  });

  // Auto-generate seats for the new screen
  await seedSeatsForScreen(screen.id, rows, seatsPerRow);

  return screen;
};

const seedSeatsForScreen = async (screenId: bigint, rows = 10, seatsPerRow = 12) => {
  // Check if seats already exist
  const existingSeats = await prisma.seat.count({ where: { screenId } });
  if (existingSeats > 0) return existingSeats;

  const rowLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".slice(0, rows).split("");
  const seatData: {
    screenId: bigint;
    seatNumber: string;
    rowLabel: string;
    colNumber: number;
    seatType: string;
    isWheelchair: boolean;
  }[] = [];

  for (const rowLabel of rowLabels) {
    const rowIndex = rowLabels.indexOf(rowLabel);
    // Last 2 rows = recliner, next 2 = premium, rest = regular
    let seatType = "regular";
    if (rowIndex >= rows - 2) seatType = "recliner";
    else if (rowIndex >= rows - 4) seatType = "premium";

    for (let col = 1; col <= seatsPerRow; col++) {
      seatData.push({
        screenId,
        seatNumber: `${rowLabel}${col}`,
        rowLabel,
        colNumber: col,
        seatType,
        isWheelchair: rowLabel === rowLabels[0] && (col === 1 || col === seatsPerRow),
      });
    }
  }

  await prisma.seat.createMany({ data: seatData });
  return seatData.length;
};

const updateScreen = async (theatreId: bigint, screenId: bigint, updates: UpdateFields) => {
  // Map snake_case to camelCase
  const data: Record<string, unknown> = {};
  if (updates.name !== undefined) data.name = updates.name;
  if (updates.screen_type !== undefined) data.screenType = updates.screen_type;

  return await prisma.screen.update({
    where: { id: screenId },
    data,
  });
};

const deleteScreen = async (theatreId: bigint, screenId: bigint) => {
  return await prisma.screen.delete({
    where: { id: screenId },
  });
};

const getShowsByScreenId = async (screenId: bigint) => {
  const shows = await prisma.show.findMany({
    where: { screenId },
    orderBy: { startTime: "asc" },
    include: {
      movie: true,
    },
  });

  return shows.map((s) => ({
    id: s.id,
    movie_id: s.movieId,
    screen_id: s.screenId,
    start_time: s.startTime,
    end_time: s.endTime,
    ticket_price: s.ticketPrice,
    format: s.format,
    language: s.language,
    has_subtitles: s.hasSubtitles,
    movie_title: s.movie.title,
    movie_genre: s.movie.genre,
    poster_url: s.movie.posterUrl,
    certification: s.movie.certification,
    rating: s.movie.rating,
  }));
};

const getSeatsByScreenId = async (screenId: bigint) => {
  const seats = await prisma.seat.findMany({
    where: { screenId },
    orderBy: [{ rowLabel: "asc" }, { colNumber: "asc" }],
    select: {
      id: true,
      screenId: true,
      seatNumber: true,
      rowLabel: true,
      colNumber: true,
      isWheelchair: true,
      seatType: true,
    },
  });

  return seats.map((s) => ({
    id: s.id,
    screen_id: s.screenId,
    seat_number: s.seatNumber,
    row_label: s.rowLabel,
    col_number: s.colNumber,
    is_wheelchair: s.isWheelchair,
    seat_type: s.seatType,
  }));
};

export {
  createTheater,
  getAllTheaters,
  getTheaterById,
  updateTheater,
  deleteTheater,
  getScreensByTheaterId,
  getScreenById,
  createScreen,
  updateScreen,
  deleteScreen,
  getShowsByScreenId,
  getSeatsByScreenId,
  seedSeatsForScreen,
};
