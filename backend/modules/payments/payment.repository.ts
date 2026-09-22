import { prisma } from "../../config/prisma.js";
import { apiError } from "../../utils/index.js";

export const createPayment = async (
  userId: bigint,
  bookingId: bigint,
  paymentMethod: string,
  transactionId: string | null = null,
) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Get and validate booking
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw apiError(404, "Booking not found");
    }
    if (booking.userId !== userId) {
      throw apiError(403, "Access denied");
    }
    if (booking.status !== "pending") {
      throw apiError(409, "Only pending bookings can be paid");
    }

    // 2. Create payment
    const payment = await tx.payment.create({
      data: {
        bookingId: bookingId,
        amount: booking.totalAmount,
        status: "success",
        paymentMethod,
        transactionId,
      },
      include: {
        booking: {
          include: {
            seats: {
              include: {
                showSeat: {
                  include: {
                    seat: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // 3. Update booking status
    await tx.booking.update({
      where: { id: bookingId },
      data: { status: "confirmed" },
    });

    // 4. Update show seats status
    const bookingSeats = await tx.bookingSeat.findMany({
      where: { bookingId },
      select: { showSeatId: true },
    });

    const showSeatIds = bookingSeats.map((bs) => bs.showSeatId);

    if (showSeatIds.length > 0) {
      await tx.showSeat.updateMany({
        where: { id: { in: showSeatIds } },
        data: {
          status: "booked",
          lockedUntil: null,
          lockedByUserId: null,
        },
      });
    }

    return payment;
  });
};

export const getPaymentById = async (id: bigint, userId: bigint | null = null) => {
  return await prisma.payment.findFirst({
    where: {
      id,
      ...(userId !== null ? { booking: { userId } } : {}),
    },
    include: {
      booking: true,
    },
  });
};

export const getPaymentsByUserId = async (userId: bigint) => {
  return await prisma.payment.findMany({
    where: {
      booking: {
        userId,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      booking: true,
    },
  });
};
