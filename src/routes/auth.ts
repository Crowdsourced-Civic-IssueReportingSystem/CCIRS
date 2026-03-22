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

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      firebaseUid: req.authUser.uid,
    },
  });
});

router.post("/sync", requireFirebaseAuth, async (req, res) => {
  if (!req.authUser?.uid) {
    return res.status(401).json({ message: "Firebase auth required" });
  }

  const authEmail = req.authUser.email ?? `${req.authUser.uid}@firebase.local`;
  // const user = await prisma.user.upsert({
    where: { email: authEmail },
    update: { name: req.authUser.name, email: authEmail },
    create: {
      email: authEmail,
      name: req.authUser.name,
      password: "firebase-auth-user",
    },
  });

  return res.status(200).json({ ok: true, user: { id: user.id, role: user.role } });
});

export default router;
