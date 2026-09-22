import jwt, { type JwtPayload } from "jsonwebtoken";
import { getUserById } from "../modules/auth/auth.repository.js";
import type { Request, Response, NextFunction } from "express";
import type { UserRole } from "../modules/auth/auth.types.js";
import { apiError, ApiError } from "../utils/index.js";
import { isTokenRevoked } from "../utils/tokenBlacklist.js";

type AuthTokenPayload = JwtPayload & { id: number | string; jti?: string };

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token =
      req.cookies?.token ??
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : undefined);
    if (!token) {
      throw new ApiError(401, "No token provided");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET ?? "");
    if (
      typeof decoded === "string" ||
      (typeof decoded.id !== "number" && typeof decoded.id !== "string")
    ) {
      throw new ApiError(401, "Invalid token");
    }

    const payload = decoded as AuthTokenPayload;
    if (payload.jti && isTokenRevoked(payload.jti)) {
      throw new ApiError(401, "Token has been revoked");
    }
    const user = await getUserById(BigInt(payload.id));
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    req.user = user;
    return next();
  } catch (error) {
    next(error);
  }
};

export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(apiError(401, "Authentication required"));
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      return next(apiError(403, "Access denied"));
    }

    next();
  };
};
