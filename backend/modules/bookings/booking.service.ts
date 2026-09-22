import {
  createBooking,
  getAllBookings,
  getBookingsByUserId,
  getBookingById,
  cancelBooking,
} from "./booking.repository.js";
import { apiError } from "../../utils/index.js";
import type { BookingInput, BookingQueryOptions } from "../../types/index.js";

const notFound = (message: string) => apiError(404, message);

export const addBooking = (userId: bigint, bookingDetails: BookingInput) =>
  createBooking(userId, BigInt(bookingDetails.show_id), bookingDetails.show_seat_ids.map(BigInt));

export const fetchAllBookings = (options?: BookingQueryOptions) => getAllBookings(options);

export const fetchUserBookings = (userId: bigint) => getBookingsByUserId(userId);

export const fetchBookingById = async (id: bigint, userId: bigint | null = null) => {
  const booking = await getBookingById(id, userId);
  if (!booking) throw notFound("Booking not found");
  return booking;
};

export const cancelUserBooking = async (id: bigint, userId: bigint | null = null) => {
  const booking = await cancelBooking(id, userId);
  if (!booking) throw notFound("Booking not found or cannot be cancelled");
  return booking;
};
