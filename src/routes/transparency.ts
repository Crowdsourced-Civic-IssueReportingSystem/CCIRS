import { Request, Response, Router } from "express";
import { prisma } from "../db";
import { verifyLedger } from "../services/ledger";

const router = Router();

router.get("/issues/:id/timeline", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const issue = await prisma.issue.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
    },
  });

  if (!issue) {
    res.status(404).json({ message: "Issue not found" });
    return;
  }

  const client = prisma as any;
  const timeline = client.ledgerEntry
    ? await client.ledgerEntry.findMany({
        where: { issueId: id },
        orderBy: { timestamp: "asc" },
        select: {
          eventType: true,
          payload: true,
          prevHash: true,
          hash: true,
          timestamp: true,
        },
      })
    : [];

  const integrityOk = await verifyLedger(id);

  res.json({
    issue,
    integrityOk,
    timeline,
  });
});

export default router;
