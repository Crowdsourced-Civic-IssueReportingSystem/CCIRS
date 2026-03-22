import { NextFunction, Request, Response } from "express";

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const payload = Buffer.from(parts[1], "base64url").toString("utf-8");
    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return null;
  }
};

export const requireFirebaseAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    res.status(401).json({ message: "Missing bearer token" });
    return;
  }

  const payload = decodeJwtPayload(token);
  if (payload) {
    const uid =
      (payload.uid as string | undefined) ??
      (payload.user_id as string | undefined) ??
      (payload.sub as string | undefined);

    if (!uid) {
      res.status(401).json({ message: "Invalid token payload" });
      return;
    }

    req.authUser = {
      uid,
      email: payload.email as string | undefined,
      name: (payload.name as string | undefined) ?? (payload.displayName as string | undefined),
    };
    next();
    return;
  }

  // Development fallback for opaque tokens.
  req.authUser = {
    uid: token,
  };
  next();
};
