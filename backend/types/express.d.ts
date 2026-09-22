import type { User as AuthUser } from "./domain.js";

declare global {
  namespace Express {
    interface User extends AuthUser {}

    interface Request {
      user: User;
    }
  }
}

export {};
