import { Router } from "express";
// import { prisma } from "../db";
import { requireFirebaseAuth } from "../middleware/firebaseAuth";

const router = Router();

router.get("/me", requireFirebaseAuth, async (req, res) => {
  if (!req.authUser?.uid) {
    return res.status(401).json({ message: "Firebase auth required" });
  }

  const authEmail = req.authUser.email ?? `${req.authUser.uid}@firebase.local`;
  // Database logic removed

  // Database removed: return demo user
  return res.json({
    user: {
      id: "demo",
      email: authEmail,
      name: req.authUser.name,
      role: "ADMIN",
      firebaseUid: req.authUser.uid,
    },
  });
});

router.post("/sync", requireFirebaseAuth, async (req, res) => {
  if (!req.authUser?.uid) {
    return res.status(401).json({ message: "Firebase auth required" });
  }

  const authEmail = req.authUser.email ?? `${req.authUser.uid}@firebase.local`;
  // Database logic removed

  // Database removed: return demo user
  return res.status(200).json({ ok: true, user: { id: "demo", role: "ADMIN" } });
});

export default router;
