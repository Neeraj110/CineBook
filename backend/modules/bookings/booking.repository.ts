import { prisma } from "../../config/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";
import { apiError } from "../../utils/index.js";
import type { BookingQueryOptions } from "../../types/index.js";

type RawSeatRow = { id: bigint; price: unknown };
type BookingSeatResult = {
  id: bigint;
  showSeatId: bigint;
  price: unknown;
  showSeat: { seat: { seatNumber: string; rowLabel: string; colNumber: number } };
};
type BookingResult = {
  id: bigint;
  userId: bigint;
  showId: bigint;
  status: string;
  totalAmount: unknown;
  createdAt: Date;
  updatedAt: Date;
  show: {
    movie: { title: string };
    startTime: Date;
    endTime: Date;
    screen: { name: string; theatre: { name: string; city: string } };
  };
  payment: { status: string; amount: unknown } | null;
  seats?: BookingSeatResult[];
};

export const createBooking = async (userId: bigint, showId: bigint, showSeatIds: bigint[]) => {
  const bookingId = await prisma.$transaction(async (tx) => {
    // 1. Fetch seats with FOR UPDATE lock to prevent concurrent bookings
    const seatsResult = await tx.$queryRaw<RawSeatRow[]>`
      SELECT id, price
      FROM show_seats
      WHERE show_id = ${showId}
        AND id = ANY(${showSeatIds})
        AND (status = 'available' OR (status = 'reserved' AND locked_until < NOW()))
      FOR UPDATE
    `;

    if (seatsResult.length !== showSeatIds.length) {
      throw apiError(409, "One or more seats are unavailable");
    }

    const totalAmount = seatsResult.reduce((total, seat) => total + Number(seat.price), 0);

    // 2. Create the booking
    const booking = await tx.booking.create({
      data: {
        userId,
        showId,
        totalAmount,
      },
    });

    // 3. Create booking seats
    const bookingSeatsData = seatsResult.map((seat) => ({
      bookingId: booking.id,
      showSeatId: seat.id,
      price: Number(seat.price),
    }));

    await tx.bookingSeat.createMany({
      data: bookingSeatsData,
    });

    // 4. Update show_seats to reserved
    await tx.$executeRaw`
      UPDATE show_seats
      SET status = 'reserved', locked_until = NOW() + INTERVAL '10 minutes', locked_by_user_id = ${userId}
      WHERE id = ANY(${showSeatIds})
    `;

    // Fetch the mapped booking after the transaction commits. Querying through
    // the global Prisma client here can run before this transaction is visible.
    return booking.id;
  });

  return getBookingById(bookingId, userId);
};

const mapBookingResult = (b: BookingResult) => ({
  id: b.id,
  user_id: b.userId,
  show_id: b.showId,
  status: b.status,
  total_amount: b.totalAmount,
  created_at: b.createdAt,
  updated_at: b.updatedAt,
  movie_title: b.show.movie.title,
  start_time: b.show.startTime,
  end_time: b.show.endTime,
  screen_name: b.show.screen.name,
  theatre_name: b.show.screen.theatre.name,
  theatre_city: b.show.screen.theatre.city,
  payment_status: b.payment?.status ?? null,
  refund_amount:
    b.status === "cancelled" && b.payment?.status === "partially_refunded"
      ? Number(b.payment.amount) / 2
      : 0,
  refund_percentage:
    b.status === "cancelled" && b.payment?.status === "partially_refunded" ? 50 : 0,
  seats: b.seats
    ? b.seats.map((bs) => ({
        id: bs.id,
        show_seat_id: bs.showSeatId,
        price: bs.price,
        seat_number: bs.showSeat.seat.seatNumber,
        row_label: bs.showSeat.seat.rowLabel,
        col_number: bs.showSeat.seat.colNumber,
      }))
    : undefined,
});

export const getAllBookings = async (options: BookingQueryOptions = {}) => {
  const limit = options.limit ?? 20;
  const where: Prisma.BookingWhereInput = {};

  if (options.status) {
    where.status = { equals: options.status, mode: "insensitive" };
  }

  if (options.user_id) {
    where.userId = BigInt(options.user_id);
  }

  if (options.show_id) {
    where.showId = BigInt(options.show_id);
  }

  if (options.search) {
    const isNum = !isNaN(Number(options.search)) && options.search.trim() !== "";
    where.OR = [
      ...(isNum ? [{ id: BigInt(options.search) }] : []),
      {
        show: {
          movie: {
            title: { contains: options.search, mode: "insensitive" },
          },
        },
      },
    ];
  }

  const cursorObj = options.cursor ? { id: BigInt(options.cursor) } : undefined;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      take: limit + 1,
      skip: cursorObj ? 1 : 0,
      cursor: cursorObj,
      where,
      orderBy: { id: "desc" },
      include: {
        show: {
          include: {
            movie: true,
            screen: {
              include: { theatre: true },
            },
          },
        },
        payment: true,
      },
    }),
    prisma.booking.count({ where }),
  ]);

  const hasNextPage = bookings.length > limit;
  const data = hasNextPage ? bookings.slice(0, limit) : bookings;
  const nextCursor = hasNextPage ? data[data.length - 1].id.toString() : null;

  return {
    bookings: data.map(mapBookingResult),
    pagination: {
      limit,
      next_cursor: nextCursor,
      has_next_page: hasNextPage,
      total,
    },
  };
};

export const getBookingsByUserId = async (userId: bigint) => {
  const bookings = await prisma.booking.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      show: {
        include: {
          movie: true,
          screen: {
            include: { theatre: true },
          },
        },
      },
      payment: true,
    },
  });
  return bookings.map(mapBookingResult);
};

export const getBookingById = async (id: bigint, userId: bigint | null = null) => {
  const booking = await prisma.booking.findFirst({
    where: {
      id,
      ...(userId !== null ? { userId } : {}),
    },
    include: {
      show: {
        include: {
          movie: true,
          screen: {
            include: { theatre: true },
          },
        },
      },
      seats: {
        orderBy: [
          { showSeat: { seat: { rowLabel: "asc" } } },
          { showSeat: { seat: { colNumber: "asc" } } },
        ],
        include: {
          showSeat: {
            include: {
              seat: true,
            },
          },
        },
      },
      payment: true,
    },
  });

  if (!booking) return undefined;
  return mapBookingResult(booking);
};

export const cancelBooking = async (id: bigint, userId: bigint | null = null) => {
  const cancelledBookingId = await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findFirst({
      where: {
        id,
        ...(userId !== null ? { userId } : {}),
        status: { in: ["pending", "confirmed"] },
      },
    });

    if (!booking) return undefined;

    if (booking.status === "confirmed") {
      const show = await tx.show.findUnique({
        where: { id: booking.showId },
        select: { startTime: true },
      });
      if (show && show.startTime <= new Date()) {
        throw apiError(409, "Bookings cannot be cancelled after the show starts");
      }
    }

    await tx.booking.update({
      where: { id },
      data: { status: "cancelled" },
    });

    if (booking.status === "confirmed") {
      await tx.payment.updateMany({
        where: { bookingId: id, status: "success" },
        data: { status: "partially_refunded" },
      });
    }

    const bookingSeats = await tx.bookingSeat.findMany({
      where: { bookingId: id },
      select: { showSeatId: true },
    });

    const showSeatIds = bookingSeats.map((bs) => bs.showSeatId);

    if (showSeatIds.length > 0) {
      await tx.showSeat.updateMany({
        where: {
          id: { in: showSeatIds },
          status: { in: ["reserved", "booked"] },
        },
        data: {
          status: "available",
          lockedUntil: null,
          lockedByUserId: null,
        },
      });
    }

    return booking.id;
  });

  return cancelledBookingId ? getBookingById(cancelledBookingId, userId) : undefined;
};

export const confirmBooking = async (id: bigint, userId: bigint | null = null) => {
  return await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findFirst({
      where: {
        id,
        ...(userId !== null ? { userId } : {}),
        status: "pending",
      },
    });

    if (!booking) return undefined;

    await tx.booking.update({
      where: { id },
      data: { status: "confirmed" },
    });

    const bookingSeats = await tx.bookingSeat.findMany({
      where: { bookingId: id },
      select: { showSeatId: true },
    });

    const showSeatIds = bookingSeats.map((bs) => bs.showSeatId);

    if (showSeatIds.length > 0) {
      await tx.showSeat.updateMany({
        where: {
          id: { in: showSeatIds },
          status: "reserved",
        },
        data: {
          status: "booked",
          lockedUntil: null,
          lockedByUserId: null,
        },
      });
    }

    return getBookingById(id, userId);
  });
};
