import jwt, { type SignOptions } from "jsonwebtoken";
import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import { createUser, getUserByEmail, getUserById } from "./auth.repository.js";
import type { User, UserRole } from "./auth.types.js";
import { apiError } from "../../utils/index.js";

interface LoginDetails {
  email: string;
  password: string;
}

export const createToken = (user: User) => {
  const payload = {
    jti: randomUUID(),
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET ?? "", {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"],
  });

  return token;
};

export const hashPassword = async (password: string): Promise<string> => {
  const hashedPassword = await bcrypt.hash(password, 10);
  return hashedPassword;
};

export const comparePassword = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  const isMatch = await bcrypt.compare(password, hashedPassword);
  return isMatch;
};

export const registerUser = async (
  name: string,
  email: string,
  password: string,
  role: UserRole,
) => {
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw apiError(409, "Email already registered");
  }
  const hashedPassword = await hashPassword(password);
  const newUser = await createUser(name, email, hashedPassword, role);
  const token = createToken(newUser);
  return { newUser, token };
};

export const loginUser = async (loginDetails: LoginDetails) => {
  const user = await getUserByEmail(loginDetails.email);
  if (!user) {
    throw apiError(401, "Invalid credentials");
  }

  const isPasswordValid = await bcrypt.compare(loginDetails.password, user.passwordHash);

  if (!isPasswordValid) {
    throw apiError(401, "Invalid credentials");
  }

  const token = jwt.sign(
    { jti: randomUUID(), id: user.id.toString(), role: user.role },
    process.env.JWT_SECRET ?? "",
    { expiresIn: (process.env.JWT_EXPIRES_IN ?? "24h") as SignOptions["expiresIn"] },
  );

  return {
    user: {
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.createdAt,
    },
    token,
  };
};

export const loginWithGoogle = async (name: string, email: string) => {
  const existingUser = await getUserByEmail(email);
  const user =
    existingUser ?? (await createUser(name, email, await hashPassword(randomUUID()), "user"));

  const token = createToken(user);
  return {
    user: {
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.createdAt,
    },
    token,
  };
};

export const getUserProfile = async (userId: bigint) => {
  const user = await getUserById(userId);
  if (!user) {
    throw apiError(404, "User not found");
  }

  return user;
};
