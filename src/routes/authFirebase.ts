/**
 * Authentication routes using Firebase/Firestore
 * POST /auth/register - Create new user (Firebase handles this)
 * POST /auth/login - Sign in (Firebase handles this)
 * GET /auth/me - Get current user profile from Firestore
 * POST /auth/sync - Sync Firebase user to Firestore
 */

import { Router, Request, Response } from "express";
import { requireFirebaseAuth } from "../middleware/firebaseAuth";
import { updateDoc, getDoc, createDoc } from "../services/firestoreApi";

const router = Router();

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

    const userDoc = await getDoc("users", uid);
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
      role: existing?.role || "CITIZEN", // Preserve existing role
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
