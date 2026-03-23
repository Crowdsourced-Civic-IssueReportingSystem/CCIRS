process.env.FIREBASE_USE_LOCAL_STORE = "1";

import { createSubDoc } from "./firestoreApi";
import { appendLedgerEvent, verifyLedgerDetailed } from "./ledger";

describe("ledger", () => {
  it("verifies a valid hash chain", async () => {
    const issueId = `issue_test_valid_${Date.now()}`;
    await appendLedgerEvent(issueId, "CREATED", { title: "Test issue" });
    await appendLedgerEvent(issueId, "STATUS_UPDATED", { previousStatus: "OPEN", newStatus: "RESOLVED" });

    const result = await verifyLedgerDetailed(issueId);
    expect(result.ok).toBe(true);
    expect(result.totalEntries).toBeGreaterThanOrEqual(2);
  });

  it("detects tampered chain entries", async () => {
    const issueId = `issue_test_tamper_${Date.now()}`;
    await appendLedgerEvent(issueId, "CREATED", { title: "Tamper issue" });

    await createSubDoc("issues", issueId, "ledger", `evt_tampered_${Date.now()}`, {
      eventType: "STATUS_UPDATED",
      payload: { newStatus: "RESOLVED" },
      prevHash: "invalid-prev-hash",
      hash: "invalid-hash",
      timestamp: new Date(Date.now() + 1000).toISOString(),
    });

    const result = await verifyLedgerDetailed(issueId);
    expect(result.ok).toBe(false);
    expect(result.failedIndex).not.toBeNull();
  });
});
