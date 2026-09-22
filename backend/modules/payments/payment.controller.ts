import type { Request, Response } from "express";
import { processPayment, fetchUserPayments, fetchPaymentById } from "./payment.service.js";
import { paymentIdParamSchema, createPaymentSchema } from "./payment.validation.js";
import { getIO } from "../../config/socket.js";
import { apiResponse, asyncHandler } from "../../utils/index.js";

export const createPaymentController = asyncHandler(async (req: Request, res: Response) => {
  const { booking_id, payment_method, transaction_id } = createPaymentSchema.parse(req.body);
  const payment = await processPayment(
    BigInt(req.user!.id),
    booking_id,
    payment_method,
    transaction_id,
  );
  if (payment?.booking) {
    getIO().emit("admin_data_changed", { type: "payment_completed", bookingId: payment.bookingId });
    getIO().to(`show_${payment.booking.showId}`).emit("seat_status_changed", {
      action: "booked",
      showId: payment.booking.showId,
      seats: payment.booking.seats,
    });
  }
  return apiResponse(res, 201, { payment }, "Payment created successfully");
});

export const getMyPaymentsController = asyncHandler(async (req: Request, res: Response) => {
  return apiResponse(res, 200, { payments: await fetchUserPayments(BigInt(req.user!.id)) });
});

export const getPaymentByIdController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = paymentIdParamSchema.parse(req.params);
  const userId = req.user!.role === "admin" ? null : BigInt(req.user!.id);
  return apiResponse(res, 200, { payment: await fetchPaymentById(BigInt(id), userId) });
});
