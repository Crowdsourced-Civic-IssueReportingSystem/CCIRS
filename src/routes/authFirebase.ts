/**
 * Authentication routes using Firebase/Firestore
 * POST /auth/register - Create new user (Firebase handles this)
 * POST /auth/login - Sign in (Firebase handles this)
 * GET /auth/me - Get current user profile from Firestore
 * POST /auth/sync - Sync Firebase user to Firestore
 */

import { Router, Request, Response } from "express";
import { requireFirebaseAuth } from "../middleware/firebaseAuth";
import { updateDoc, getDoc, createDoc, queryDocs } from "../services/firestoreApi";

const router = Router();
const ENABLE_LOCAL_AUTH =
  process.env.FIREBASE_ENABLE_LOCAL_AUTH === "1" ||
  (process.env.NODE_ENV ?? "development") !== "production";
const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean),
);

const resolveRole = (email?: string, existingRole?: string): string => {
  if (existingRole) return existingRole;
  if (email && ADMIN_EMAILS.has(email.toLowerCase())) return "ADMIN";
  return "CITIZEN";
};

const userDocIdFromEmail = (email: string): string => {
  return `user_${Buffer.from(email.toLowerCase()).toString("base64url")}`;
};

const createDevToken = (payload: { uid: string; email?: string; name?: string }): string => {
  const body = {
    uid: payload.uid,
    email: payload.email,
    name: payload.name,
    iat: Math.floor(Date.now() / 1000),
  };

  return `dev.${Buffer.from(JSON.stringify(body)).toString("base64url")}.sig`;
};

/**
 * POST /auth/register
 * Local register endpoint for development/demo mode
 */
router.post("/register", async (req: Request, res: Response) => {
  if (!ENABLE_LOCAL_AUTH) {
    return res.status(501).json({ error: "Local register is disabled in production" });
  }

  try {
    const { name, email, password } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const docId = userDocIdFromEmail(email);
    const existing = await getDoc("users", docId);
    if (existing) {
      const updatedUser = {
        ...existing,
        email,
        name: name || existing.name || "Citizen",
        password,
        role: resolveRole(email, existing.role),
        updatedAt: new Date().toISOString(),
      };

      await updateDoc("users", docId, updatedUser);

      const token = createDevToken({ uid: updatedUser.uid, email: updatedUser.email, name: updatedUser.name });
      return res.status(200).json({
        message: "Account already existed. Credentials updated and logged in.",
        user: {
          uid: updatedUser.uid,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
        },
        tokens: {
          accessToken: token,
        },
      });
    }

    const uid = `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const user = {
      id: docId,
      uid,
      email,
      name: name || "Citizen",
      password,
      role: resolveRole(email),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await createDoc("users", docId, user);

    const token = createDevToken({ uid, email: user.email, name: user.name });
    return res.status(201).json({
      message: "Registered successfully",
      user: {
        uid: user.uid,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tokens: {
        accessToken: token,
      },
    });
  } catch (error) {
    console.error("POST /auth/register error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

/**
 * POST /auth/login
 * Local login endpoint for development/demo mode
 */
router.post("/login", async (req: Request, res: Response) => {
  if (!ENABLE_LOCAL_AUTH) {
    return res.status(501).json({ error: "Local login is disabled in production" });
  }

  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const docId = userDocIdFromEmail(email);
    const user = await getDoc("users", docId);
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = createDevToken({ uid: user.uid, email: user.email, name: user.name });
    res.json({
      message: "Login successful",
      user: {
        uid: user.uid,
        email: user.email,
        name: user.name,
        role: resolveRole(user.email, user.role),
      },
      tokens: {
        accessToken: token,
      },
    });
  } catch (error) {
    console.error("POST /auth/login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

/**
 * GET /auth/me
 * Retrieve current authenticated user's profile
 */
router.get("/me", requireFirebaseAuth, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).authUser?.uid;
    if (!uid) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    let userDoc = await getDoc("users", uid);
    if (!userDoc) {
      const matches = await queryDocs("users", "uid", "EQUAL", uid);
      userDoc = matches[0] || null;
    }

    if (!userDoc) {
      return res.status(404).json({ error: "User profile not found" });
    }

    res.json(userDoc);
  } catch (error) {
    console.error("GET /auth/me error:", error);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

/**
 * POST /auth/sync
 * Ensure user exists in Firestore after Firebase auth
 * Creates or updates user profile
 */
router.post("/sync", requireFirebaseAuth, async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).authUser;
    if (!authUser?.uid) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { email, name } = authUser;

    // Check if user exists
    const existing = await getDoc("users", authUser.uid);

    const userData = {
      uid: authUser.uid,
      email,
      name: name || "",
      role: resolveRole(email, existing?.role), // Preserve existing role
      firebaseUid: authUser.uid,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await updateDoc("users", authUser.uid, userData);

    res.json({
      message: "User synced successfully",
      user: userData,
    });
  } catch (error) {
    console.error("POST /auth/sync error:", error);
    res.status(500).json({ error: "Failed to sync user" });
  }
});

/**
 * POST /auth/logout
 * Client-side Firebase auth handles logout
 * This endpoint optional for backend cleanup
 */
router.post("/logout", requireFirebaseAuth, async (req: Request, res: Response) => {
  try {
    // Firebase handles token revocation client-side
    // Backend can do cleanup if needed (e.g., logout sessions)
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("POST /auth/logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
});

export default router;
