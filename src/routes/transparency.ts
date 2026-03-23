import { Request, Response, Router } from "express";
// import { prisma } from "../db";
import { verifyLedger } from "../services/ledger";

const router = Router();

router.get("/issues/:id/timeline", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  // Database removed: return demo timeline
  const integrityOk = await verifyLedger(id);
  res.json({
    issue: { id, title: "Demo Issue", status: "PENDING", createdAt: new Date().toISOString() },
    integrityOk,
    timeline: [],
  });
});

export default router;
