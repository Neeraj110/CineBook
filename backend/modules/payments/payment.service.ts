import { createPayment, getPaymentById, getPaymentsByUserId } from "./payment.repository.js";
import { apiError } from "../../utils/index.js";

const notFound = (message: string) => apiError(404, message);

export const processPayment = (userId, bookingId, paymentMethod, transactionId) =>
  createPayment(userId, bookingId, paymentMethod, transactionId);

export const fetchUserPayments = (userId: bigint) => getPaymentsByUserId(userId);

export const fetchPaymentById = async (id: bigint, userId: bigint | null = null) => {
  const payment = await getPaymentById(id, userId);
  if (!payment) throw notFound("Payment not found");
  return payment;
};
