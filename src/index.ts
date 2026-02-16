import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "./config";
import authRoutes from "./routes/auth";
import issueRoutes from "./routes/issues";
import { prisma } from "./db";

const app = express();
app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.get("/health", async (_, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok" });
  } catch (err) {
    res.status(500).json({ status: "error" });
  }
});

app.use("/auth", authRoutes);
app.use("/issues", issueRoutes);

app.use((_, res) => res.status(404).json({ message: "Not found" }));

app.listen(config.port, () => {
  console.log(`API running on http://localhost:${config.port}`);
});
