/**
 * CCIRS Backend - Firebase/Firestore Edition
 * Express.js app with Firebase Auth and Firestore database
 */

import express, { Express, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import authRoutes from "./routes/authFirebase";
import issuesRoutes from "./routes/issuesFirebase";
import transparencyRoutes from "./routes/transparencyFirebase";

const app: Express = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(morgan("combined"));
app.use(express.json());

// Serve frontend files (index.html, app.js, styles.css)
app.use(express.static(path.resolve(__dirname, "../")));

// Frontend entry point
app.get("/", (req: Request, res: Response) => {
  res.sendFile(path.resolve(__dirname, "../index.html"));
});

// Health check (support both direct and /api-prefixed paths)
app.get(["/health", "/api/health"], (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    database: "firestore",
  });
});

// Routes (direct paths)
app.use("/auth", authRoutes);
app.use("/issues", issuesRoutes);
app.use("/transparency", transparencyRoutes);

// Routes (/api-prefixed compatibility paths)
app.use("/api/auth", authRoutes);
app.use("/api/issues", issuesRoutes);
app.use("/api/transparency", transparencyRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler
app.use((error: any, req: Request, res: Response) => {
  console.error("Unhandled error:", error);
  res.status(500).json({ error: "Internal server error" });
});

const server = app.listen(PORT, () => {
  console.log(`✅ CCIRS Backend running on port ${PORT}`);
  console.log(`📊 API Documentation:`);
  console.log(`   GET  /health - Health check`);
  console.log(`   GET  /auth/me - Get current user`);
  console.log(`   POST /auth/sync - Sync user to Firestore`);
  console.log(`   GET  /issues - List issues`);
  console.log(`   POST /issues - Create issue`);
  console.log(`   GET  /issues/:id - Get issue detail`);
  console.log(`   POST /issues/:id/vote - Vote on issue`);
  console.log(`   GET  /transparency/issues/:id/timeline - Issue timeline`);
  console.log(`🔥 Database: Firestore`);
  console.log(`🔐 Auth: Firebase ID tokens`);
});

export default app;
