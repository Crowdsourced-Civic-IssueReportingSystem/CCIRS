import crypto from "crypto";
// import { prisma } from "../db";

type LedgerPayload = Record<string, unknown>;

const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`)
    .join(",")}}`;
};

const computeHash = (prevHash: string, timestampIso: string, payload: LedgerPayload): string => {
  const raw = `${prevHash}|${timestampIso}|${stableStringify(payload)}`;
  return crypto.createHash("sha256").update(raw).digest("hex");
};

export const appendLedgerEvent = async (
  issueId: string,
  eventType: string,
  payload: LedgerPayload,
): Promise<void> => {
  // const client = prisma as any;
    // Database removed: do nothing
    return;
};

export const verifyLedger = async (issueId: string): Promise<boolean> => {
  // const client = prisma as any;
    // Database removed: always return true
    return true;
};
