import { Router } from "express";
import { requireFirebaseAuth } from "../middleware/firebaseAuth";
import { getDoc, updateDoc, createDoc } from "../services/firestoreApi";

const router = Router();

// GET /auth/me - Get current user profile from Firestore
router.get("/me", requireFirebaseAuth, async (req, res) => {
  const uid = req.authUser?.uid;
  if (!uid) {
    return res.status(401).json({ message: "Firebase auth required" });
  }
  try {
    const userDoc = await getDoc("users", uid);
    if (!userDoc) {
      return res.status(404).json({ error: "User profile not found" });
    }
    res.json(userDoc);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

// POST /auth/sync - Ensure user exists in Firestore after Firebase auth
router.post("/sync", requireFirebaseAuth, async (req, res) => {
  const authUser = req.authUser;
  if (!authUser?.uid) {
    return res.status(401).json({ message: "Firebase auth required" });
  }
  try {
    const { email, name } = authUser;
    const existing = await getDoc("users", authUser.uid);
    const userData = {
      uid: authUser.uid,
      email,
      name: name || "",
      role: existing?.role || "CITIZEN",
      firebaseUid: authUser.uid,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await updateDoc("users", authUser.uid, userData);
    res.json({ message: "User synced successfully", user: userData });
  } catch (error) {
    res.status(500).json({ error: "Failed to sync user" });
  }
});

export default router;
