import { Router } from "express";
// import { prisma } from "../db";
import { requireFirebaseAuth } from "../middleware/firebaseAuth";
import { classifyIssue } from "../services/aiRouter";
import { appendLedgerEvent } from "../services/ledger";
import { z } from "zod";

const router = Router();
const statusValues = ["PENDING", "APPROVED", "REJECTED", "IN_PROGRESS", "RESOLVED"] as const;
const severityValues = ["LOW", "MEDIUM", "HIGH"] as const;

const ensureAppUserFromFirebase = async (req: Express.Request) => {
  if (!req.authUser?.uid) {
    return null;
  }

  const authEmail = req.authUser.email ?? `${req.authUser.uid}@firebase.local`;

  // Database logic removed
};

const createIssueSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(5),
  category: z.string().min(2).max(100).optional(),
  severity: z.enum(severityValues).optional(),
  latitude: z.number().gte(-90).lte(90),
  longitude: z.number().gte(-180).lte(180),
  address: z.string().min(3).max(255).optional(),
  language: z.string().min(2).max(10).optional(),
  voiceNoteUrl: z.string().url().optional(),
  mediaUrls: z.array(z.string().url()).optional(),
  media: z.array(z.object({ url: z.string().url(), type: z.string().optional() })).optional(),
});

router.post("/", requireFirebaseAuth, async (req, res) => {
  const parsed = createIssueSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.format());

  if (!req.authUser?.uid) {
    return res.status(401).json({ message: "Firebase auth required" });
  }

  const data = parsed.data;
  const ai = await classifyIssue({
    title: data.title,
    description: data.description,
  });

  const reporter = await ensureAppUserFromFirebase(req);
  if (!reporter) {
    return res.status(401).json({ message: "Firebase auth required" });
  }

  // Database logic removed

  await appendLedgerEvent(issue.id, "ISSUE_REPORTED", {
    by: req.authUser.uid,
    title: data.title,
    language: data.language ?? null,
    latitude: data.latitude,
    longitude: data.longitude,
  });

  await appendLedgerEvent(issue.id, "ISSUE_ROUTED", {
    category: ai.category,
    department: ai.department,
    confidence: ai.confidence,
  });

  return res.status(201).json(issue);
});

router.get("/", async (req, res) => {
  const { status, category, search, page = "1", pageSize = "10" } = req.query;
  const skip = (Number(page) - 1) * Number(pageSize);
  const take = Math.min(Number(pageSize), 50);
  const where: any = {};
  if (status && typeof status === "string" && statusValues.includes(status as any)) where.status = status;
  if (category && typeof category === "string") where.category = category;
  if (search && typeof search === "string") {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }
  const [items, total] = await Promise.all([
    // Database logic removed
    // prisma.issue.count({ where }),
  ]);
  return res.json({ items, total, page: Number(page), pageSize: take });
});

router.get("/:id", async (req, res) => {
  // Database logic removed
  if (!issue) return res.status(404).json({ message: "Issue not found", id: req.params.id });
  return res.json(issue);
});

const statusSchema = z.object({
  status: z.enum(statusValues),
  assignedTo: z.string().optional(),
});

router.patch(
  "/:id/status",
  requireFirebaseAuth,
  async (req, res) => {
    const actor = await ensureAppUserFromFirebase(req);
    if (!actor) {
      return res.status(401).json({ message: "Firebase auth required" });
    }
    if (!["MODERATOR", "ADMIN"].includes(actor.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.format());
    try {
      // Database logic removed

      await appendLedgerEvent(issue.id, "STATUS_CHANGED", {
        by: actor.id,
        status: parsed.data.status,
        assignedTo: parsed.data.assignedTo ?? null,
      });

      return res.json(issue);
    } catch (err: any) {
      if (err.code === "P2025") {
        return res.status(404).json({ message: "Issue not found", id: req.params.id });
      }
      return res.status(500).json({ message: "Unable to update issue" });
    }
  },
);

const commentSchema = z.object({ body: z.string().min(1) });

router.post("/:id/comments", requireFirebaseAuth, async (req, res) => {
  const actor = await ensureAppUserFromFirebase(req);
  if (!actor) {
    return res.status(401).json({ message: "Firebase auth required" });
  }

  const parsed = commentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.format());
  // Database logic removed

  await appendLedgerEvent(issue.id, "COMMENT_ADDED", {
    by: actor.id,
  });

  return res.status(201).json(comment);
});

router.get("/:id/comments", async (req, res) => {
  // Database logic removed
  return res.json(comments);
});

router.post("/:id/vote", requireFirebaseAuth, async (req, res) => {
  const actor = await ensureAppUserFromFirebase(req);
  if (!actor) {
    return res.status(401).json({ message: "Firebase auth required" });
  }

  // Database logic removed

    // Database logic removed
    return res.status(201).json({ ok: true });
});

router.delete("/:id/vote", requireFirebaseAuth, async (req, res) => {
  const actor = await ensureAppUserFromFirebase(req);
  if (!actor) {
    return res.status(401).json({ message: "Firebase auth required" });
  }

  // const issue = await prisma.issue.findUnique({ where: { id: req.params.id } });
  if (!issue) return res.status(404).json({ message: "Issue not found", id: req.params.id });
  // await prisma.vote.deleteMany({ where: { issueId: req.params.id, userId: actor.id } });

  await appendLedgerEvent(issue.id, "ISSUE_UNVOTED", {
    by: actor.id,
  });

  return res.json({ ok: true });
});

export default router;
