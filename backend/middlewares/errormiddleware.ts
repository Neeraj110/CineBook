import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const candidate = error instanceof Error ? error : new Error("Unknown server error");
  const statusCode = typeof error?.statusCode === "number" ? error.statusCode : 500;

  // Only log unexpected server errors (500+) to keep the development terminal clean
  if (statusCode >= 500) {
    console.error(`[ServerError] ${req.method} ${req.originalUrl}:`, candidate);
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.issues,
    });
  }

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? "Internal server error" : candidate.message,
    ...(Array.isArray(error?.errors) && error.errors.length > 0 ? { errors: error.errors } : {}),
  });
};
