import dotenv from "dotenv";

dotenv.config();

const withDefault = (key: string, fallback: string): string => {
  const value = process.env[key];
  return value && value.length > 0 ? value : fallback;
};

export const config = {
  port: Number(process.env.PORT ?? 3003),
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  nodeEnv: process.env.NODE_ENV ?? "development",
  // Optional for Firebase/Firestore deployments (e.g., Vercel serverless path).
  dbUrl: process.env.DATABASE_URL ?? "",
  firebase: {
    serviceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON ?? "",
    projectId: process.env.FIREBASE_PROJECT_ID ?? "",
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? "",
    privateKey: (process.env.FIREBASE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
  },
  jwt: {
    accessSecret: withDefault("JWT_ACCESS_SECRET", "dev-access-secret"),
    refreshSecret: withDefault("JWT_REFRESH_SECRET", "dev-refresh-secret"),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "30d",
  },
  auth: {
    firebaseStrictMode:
      typeof process.env.FIREBASE_AUTH_STRICT === "string"
        ? process.env.FIREBASE_AUTH_STRICT === "1"
        : (process.env.NODE_ENV ?? "development") !== "development",
  },
  ai: {
    classifierEndpoint: process.env.ML_CLASSIFIER_ENDPOINT ?? "",
    classifierApiKey: process.env.ML_CLASSIFIER_API_KEY ?? "",
  },
  ledger: {
    anchorEndpoint: process.env.LEDGER_ANCHOR_ENDPOINT ?? "",
    anchorApiKey: process.env.LEDGER_ANCHOR_API_KEY ?? "",
    anchorTimeoutMs: Number(process.env.LEDGER_ANCHOR_TIMEOUT_MS ?? 8000),
  },
};
