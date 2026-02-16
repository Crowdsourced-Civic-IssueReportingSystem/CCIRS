import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { User } from "@prisma/client";

type TokenPair = { accessToken: string; refreshToken: string };

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const signTokens = (user: Pick<User, "id" | "email" | "role">): TokenPair => {
  const payload = { sub: user.id, email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  });
  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): jwt.JwtPayload => {
  return jwt.verify(token, config.jwt.accessSecret) as jwt.JwtPayload;
};
