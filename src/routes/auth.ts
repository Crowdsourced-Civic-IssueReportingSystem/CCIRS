import { Router } from "express";
import { prisma } from "../db";
import { comparePassword, hashPassword, signTokens } from "../utils/auth";
import { z } from "zod";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100).optional(),
});

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.format());
  const { email, password, name } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ message: "Email already in use" });
  const hashed = await hashPassword(password);
  const user = await prisma.user.create({ data: { email, password: hashed, name } });
  const tokens = signTokens(user);
  return res.status(201).json({ user: { id: user.id, email: user.email, role: user.role }, tokens });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.format());
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  const ok = await comparePassword(password, user.password);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });
  const tokens = signTokens(user);
  return res.json({ user: { id: user.id, email: user.email, role: user.role }, tokens });
});

export default router;
