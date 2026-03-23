type AnchorRequest = {
  issueId: string;
  ledgerHash: string;
  timestamp: string;
};

type AnchorResponse = {
  provider?: string;
  chainId?: string;
  txHash?: string;
  explorerUrl?: string;
};

export type AnchorMetadata = {
  enabled: boolean;
  provider?: string;
  chainId?: string;
  txHash?: string;
  explorerUrl?: string;
  anchoredAt?: string;
};

/**
 * Optional blockchain anchoring adapter.
 * If LEDGER_ANCHOR_ENDPOINT is configured, hash anchors can be relayed
 * to an external service (for example, an ethers.js-based relayer).
 */
export async function anchorLedgerHash(payload: AnchorRequest): Promise<AnchorMetadata | null> {
  const endpoint = config.ledger.anchorEndpoint;
  if (!endpoint) return null;

  try {
    const controller = new AbortController();
    const timeoutMs = config.ledger.anchorTimeoutMs;
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.ledger.anchorApiKey
          ? { Authorization: `Bearer ${config.ledger.anchorApiKey}` }
          : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!response.ok) return null;
    const result = (await response.json()) as AnchorResponse;

    return {
      enabled: true,
      provider: result.provider || "external-relayer",
      chainId: result.chainId,
      txHash: result.txHash,
      explorerUrl: result.explorerUrl,
      anchoredAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
import { config } from "../config";
