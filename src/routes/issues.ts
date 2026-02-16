import { Router } from "express";
import { prisma } from "../db";
import { AuthedRequest, requireAuth, requireRole } from "../middleware/auth";
import { z } from "zod";

const router = Router();
const statusValues = ["PENDING", "APPROVED", "REJECTED", "IN_PROGRESS", "RESOLVED"] as const;
const severityValues = ["LOW", "MEDIUM", "HIGH"] as const;

const createIssueSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(5),
  category: z.string().min(2).max(100),
  severity: z.enum(severityValues).optional(),
  latitude: z.number().gte(-90).lte(90),
  longitude: z.number().gte(-180).lte(180),
  address: z.string().min(3).max(255).optional(),
  media: z.array(z.object({ url: z.string().url(), type: z.string().optional() })).optional(),
});

router.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = createIssueSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.format());
  const data = parsed.data;
  const issue = await prisma.issue.create({
    data: {
      title: data.title,
      description: data.description,
      category: data.category,
      severity: data.severity ?? "MEDIUM",
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address,
      reporterId: req.user!.id,
      media: {
        create: data.media?.map((m) => ({ url: m.url, type: m.type ?? "image" })) ?? [],
      },
    },
    include: { media: true },
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
    prisma.issue.findMany({
      where,
      include: { media: true, _count: { select: { votes: true, comments: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.issue.count({ where }),
  ]);
  return res.json({ items, total, page: Number(page), pageSize: take });
});

router.get("/:id", async (req, res) => {
  const issue = await prisma.issue.findUnique({
    where: { id: req.params.id },
    include: {
      media: true,
      comments: { include: { author: { select: { id: true, email: true, name: true } } }, orderBy: { createdAt: "asc" } },
      _count: { select: { votes: true } },
    },
  });
  if (!issue) return res.status(404).json({ message: "Issue not found", id: req.params.id });
  return res.json(issue);
});

const statusSchema = z.object({
  status: z.enum(statusValues),
  assignedTo: z.string().optional(),
});

router.patch(
  "/:id/status",
  requireAuth,
  requireRole(["MODERATOR", "ADMIN"]),
  async (req, res) => {
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.format());
    try {
      const issue = await prisma.issue.update({
        where: { id: req.params.id },
        data: { status: parsed.data.status, assignedTo: parsed.data.assignedTo },
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

router.post("/:id/comments", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = commentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.format());
  const issue = await prisma.issue.findUnique({ where: { id: req.params.id } });
  if (!issue) return res.status(404).json({ message: "Issue not found", id: req.params.id });
  const comment = await prisma.comment.create({
    data: {
      body: parsed.data.body,
      issueId: req.params.id,
      authorId: req.user!.id,
    },
  });
  return res.status(201).json(comment);
});

router.get("/:id/comments", async (req, res) => {
  const comments = await prisma.comment.findMany({
    where: { issueId: req.params.id },
    include: { author: { select: { id: true, email: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });
  return res.json(comments);
});

router.post("/:id/vote", requireAuth, async (req: AuthedRequest, res) => {
  const issue = await prisma.issue.findUnique({ where: { id: req.params.id } });
  if (!issue) return res.status(404).json({ message: "Issue not found", id: req.params.id });
  try {
    await prisma.vote.create({
      data: { issueId: req.params.id, userId: req.user!.id },
    });
    return res.status(201).json({ ok: true });
  } catch (err) {
    const code = (err as any)?.code;
    if (code === "P2002") {
      return res.status(400).json({ message: "Already voted" });
    }
    return res.status(400).json({ message: "Unable to vote" });
  }
});

router.delete("/:id/vote", requireAuth, async (req: AuthedRequest, res) => {
  const issue = await prisma.issue.findUnique({ where: { id: req.params.id } });
  if (!issue) return res.status(404).json({ message: "Issue not found", id: req.params.id });
  await prisma.vote.deleteMany({ where: { issueId: req.params.id, userId: req.user!.id } });
  return res.json({ ok: true });
});

export default router;
