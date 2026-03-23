import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
// import { prisma } from "../db";
import { config } from "../config";

export interface AuthedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const requireAuth = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ message: "Missing token" });
    return;
  }
  const token = header.slice("Bearer ".length);
  try {
      // Database removed: always allow and set a demo user
      req.user = { id: "demo", email: "demo@example.com", role: "ADMIN" };
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    next();
  };
};
