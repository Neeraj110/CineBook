import type { Request, Response } from "express";
import {
  addBooking,
  fetchAllBookings,
  fetchUserBookings,
  fetchBookingById,
  cancelUserBooking,
} from "./booking.service.js";
import {
  createBookingSchema,
  bookingIdParamSchema,
  getBookingsQuerySchema,
} from "./booking.validation.js";
import { getIO } from "../../config/socket.js";
import { apiResponse, asyncHandler } from "../../utils/index.js";

export const createBookingController = asyncHandler(async (req: Request, res: Response) => {
  const booking = await addBooking(BigInt(req.user!.id), createBookingSchema.parse(req.body));
  if (booking) {
    getIO().emit("admin_data_changed", { type: "booking_created", bookingId: booking.id });
    getIO().to(`show_${booking.show_id}`).emit("seat_status_changed", {
      action: "reserved",
      showId: booking.show_id,
      seats: booking.seats,
    });
  }
  return apiResponse(res, 201, { booking }, "Booking created successfully");
});

export const getAllBookingsController = asyncHandler(async (req: Request, res: Response) => {
  return apiResponse(res, 200, await fetchAllBookings(getBookingsQuerySchema.parse(req.query)));
});

export const getMyBookingsController = asyncHandler(async (req: Request, res: Response) => {
  return apiResponse(res, 200, { bookings: await fetchUserBookings(BigInt(req.user!.id)) });
});

export const getBookingByIdController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = bookingIdParamSchema.parse(req.params);
  const userId = req.user!.role === "admin" ? null : BigInt(req.user!.id);
  return apiResponse(res, 200, { booking: await fetchBookingById(BigInt(id), userId) });
});

export const cancelBookingController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = bookingIdParamSchema.parse(req.params);
  const userId = req.user!.role === "admin" ? null : BigInt(req.user!.id);
  const booking = await cancelUserBooking(BigInt(id), userId);
  if (booking) {
    getIO().emit("admin_data_changed", { type: "booking_cancelled", bookingId: booking.id });
    getIO().to(`show_${booking.show_id}`).emit("seat_status_changed", {
      action: "available",
      showId: booking.show_id,
      seats: booking.seats,
    });
  }
  return apiResponse(res, 200, { booking }, "Booking cancelled successfully");
});
