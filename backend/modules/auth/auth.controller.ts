import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { registerUser, loginUser, getUserProfile } from "./auth.service.js";
import { registerSchema, loginSchema } from "./auth.validation.js";
import { apiResponse, asyncHandler } from "../../utils/index.js";
import { revokeToken } from "../../utils/tokenBlacklist.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role } = registerSchema.parse(req.body);
  const { newUser, token } = await registerUser(name, email, password, role);
  res.cookie("token", token, cookieOptions);
  return apiResponse(res, 201, { user: newUser, token }, "Registration successful");
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);
  const { user, token } = await loginUser({ email, password });
  res.cookie("token", token, cookieOptions);
  return apiResponse(res, 200, { user, token }, "Login successful");
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.token;
  if (token) {
    const decoded = jwt.decode(token);
    if (decoded && typeof decoded !== "string" && decoded.jti && decoded.exp) {
      revokeToken(decoded.jti, decoded.exp * 1000);
    }
  }

  res.clearCookie("token", cookieOptions);
  return apiResponse(res, 200, { message: "Logged out successfully" });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await getUserProfile(BigInt(req.user!.id));
  return apiResponse(res, 200, { user });
});

export const googleCallback = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.user! as Express.User & { token: string };
  res.cookie("token", token, cookieOptions);
  return res.redirect(process.env.FRONTEND_URL ?? "http://localhost:3000");
});
