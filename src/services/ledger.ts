import crypto from "crypto";
import { createSubDoc, listSubDocs } from "./firestoreApi";
import { anchorLedgerHash } from "./blockchainAnchor";

type LedgerPayload = Record<string, unknown>;
type LedgerIntegrityResult = {
  ok: boolean;
  totalEntries: number;
  failedIndex: number | null;
};

const GENESIS_HASH = "GENESIS";

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

const computeHash = (
  prevHash: string,
  timestampIso: string,
  eventType: string,
  payload: LedgerPayload,
): string => {
  const raw = `${prevHash}|${timestampIso}|${eventType}|${stableStringify(payload)}`;
  return crypto.createHash("sha256").update(raw).digest("hex");
};

const sortByTimestamp = (entries: Array<Record<string, unknown>>): Array<Record<string, unknown>> => {
  return [...entries].sort((a, b) => {
    const aTs = new Date(String(a.timestamp || a.createdAt || 0)).getTime();
    const bTs = new Date(String(b.timestamp || b.createdAt || 0)).getTime();
    if (aTs !== bTs) return aTs - bTs;
    return String(a.id || "").localeCompare(String(b.id || ""));
  });
};

export const verifyLedgerDetailed = async (issueId: string): Promise<LedgerIntegrityResult> => {
  const entriesRaw = await listSubDocs("issues", issueId, "ledger");
  const entries = sortByTimestamp(entriesRaw);
  if (entries.length === 0) {
    return { ok: true, totalEntries: 0, failedIndex: null };
  }

  let previousHash = GENESIS_HASH;

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const eventType = String(entry.eventType || "");
    const timestamp = String(entry.timestamp || entry.createdAt || "");
    const payload = (entry.payload || {}) as LedgerPayload;
    const expected = computeHash(previousHash, timestamp, eventType, payload);
    const actual = String(entry.hash || "");
    const actualPrev = String(entry.prevHash || "");

    if (!timestamp || !eventType || actualPrev !== previousHash || actual !== expected) {
      return { ok: false, totalEntries: entries.length, failedIndex: index };
    }

    previousHash = actual;
  }

  return { ok: true, totalEntries: entries.length, failedIndex: null };
};

export const appendLedgerEvent = async (
  issueId: string,
  eventType: string,
  payload: LedgerPayload,
): Promise<void> => {
  const timestamp = new Date().toISOString();
  const entries = sortByTimestamp(await listSubDocs("issues", issueId, "ledger"));
  const previousHash = entries.length > 0 ? String(entries[entries.length - 1].hash || GENESIS_HASH) : GENESIS_HASH;
  const hash = computeHash(previousHash, timestamp, eventType, payload);
  const entryId = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const anchor = await anchorLedgerHash({
    issueId,
    ledgerHash: hash,
    timestamp,
  });

  await createSubDoc("issues", issueId, "ledger", entryId, {
    id: entryId,
    issueId,
    eventType,
    payload,
    prevHash: previousHash,
    hash,
    timestamp,
    anchor: anchor || undefined,
  });
};

export const verifyLedger = async (issueId: string): Promise<boolean> => {
  const result = await verifyLedgerDetailed(issueId);
  return result.ok;
};
