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
  if (!client.ledgerEntry) {
    return;
  }

  const last = await client.ledgerEntry.findFirst({
    where: { issueId },
    orderBy: { timestamp: "desc" },
  });

  const prevHash = last?.hash ?? "GENESIS";
  const timestamp = new Date();
  const hash = computeHash(prevHash, timestamp.toISOString(), payload);

  await client.ledgerEntry.create({
    data: {
      issueId,
      eventType,
      payload,
      prevHash,
      hash,
      timestamp,
    },
  });
};

export const verifyLedger = async (issueId: string): Promise<boolean> => {
  // const client = prisma as any;
  if (!client.ledgerEntry) {
    return true;
  }

  const entries = await client.ledgerEntry.findMany({
    where: { issueId },
    orderBy: { timestamp: "asc" },
  });

  let prevHash = "GENESIS";
  for (const entry of entries) {
    const payload = entry.payload as LedgerPayload;
    const expected = computeHash(prevHash, entry.timestamp.toISOString(), payload);

    if (entry.prevHash !== prevHash || entry.hash !== expected) {
      return false;
    }

    prevHash = entry.hash;
  }

  return true;
};
