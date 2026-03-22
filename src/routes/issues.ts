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

    // Database removed: return demo issue
    const issue = { id: "demo-issue", ...data, reporterId: (reporter as any).id };
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
  // Database removed: return demo list
  return res.json({ items: [], total: 0, page: Number(page), pageSize: take });
});

router.get("/:id", async (req, res) => {
  // Database removed: return demo issue
  return res.json({ id: req.params.id, title: "Demo Issue" });
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
    if (!["MODERATOR", "ADMIN"].includes((actor as any).role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.format());
    // Database removed: return demo issue
    return res.json({ id: req.params.id, status: parsed.data.status, assignedTo: parsed.data.assignedTo });
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

  // Database removed: return demo comment
  return res.status(201).json({ id: "demo-comment", body: parsed.data.body, authorId: (actor as any).id });
});

router.get("/:id/comments", async (req, res) => {
  // Database removed: return demo comments
  return res.json([{ id: "demo-comment", body: "Demo", authorId: "demo" }]);
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

    // Database removed: do nothing

  return res.json({ ok: true });
});

export default router;
