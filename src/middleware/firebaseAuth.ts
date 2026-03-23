import { NextFunction, Request, Response } from "express";
import { config } from "../config";

interface FirebaseLookupUser {
  localId: string;
  email?: string;
  displayName?: string;
}

interface FirebaseLookupResponse {
  users?: FirebaseLookupUser[];
}

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

const verifyWithFirebaseLookup = async (
  token: string,
): Promise<{ uid: string; email?: string; name?: string } | null> => {
  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  if (!apiKey) {
    return null;
  }

  const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: token }),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as FirebaseLookupResponse;
  const user = data.users?.[0];
  if (!user?.localId) {
    return null;
  }

  return {
    uid: user.localId,
    email: user.email,
    name: user.displayName,
  };
};

export const requireFirebaseAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const strictMode = config.auth.firebaseStrictMode;
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    res.status(401).json({ message: "Missing bearer token" });
    return;
  }

  const verifiedUser = await verifyWithFirebaseLookup(token);
  if (verifiedUser?.uid) {
    req.authUser = verifiedUser;
    next();
    return;
  }

  if (strictMode) {
    res.status(401).json({ message: "Invalid Firebase ID token" });
    return;
  }

  const payload = decodeJwtPayload(token);
  const uid =
    (payload?.uid as string | undefined) ??
    (payload?.user_id as string | undefined) ??
    (payload?.sub as string | undefined);

  if (!uid) {
    res.status(401).json({ message: "Invalid token payload" });
    return;
  }

  req.authUser = {
    uid,
    email: payload?.email as string | undefined,
    name: (payload?.name as string | undefined) ?? (payload?.displayName as string | undefined),
  };
  next();
};
