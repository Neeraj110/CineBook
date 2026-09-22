import type { Response } from "express";

export class ApiResponse<T = unknown> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;

  constructor(statusCode: number, data: T, message: string = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }

  send(res: Response): Response {
    return res.status(this.statusCode).json({
      success: this.success,
      message: this.message,
      data: this.data,
    });
  }
}

export const apiResponse = <T = unknown>(
  res: Response,
  statusCode: number,
  data: T,
  message: string = "Success",
) => {
  return new ApiResponse(statusCode, data, message).send(res);
};
