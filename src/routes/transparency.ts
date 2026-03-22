import { Request, Response, Router } from "express";
// import { prisma } from "../db";
import { verifyLedger } from "../services/ledger";

const router = Router();

router.get("/issues/:id/timeline", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  // Database logic removed

  if (!issue) {
    res.status(404).json({ message: "Issue not found" });
    return;
  }

  // Database logic removed
  const timeline = [];

  const integrityOk = await verifyLedger(id);

  res.json({
    issue,
    integrityOk,
    timeline,
  });
});

export default router;
