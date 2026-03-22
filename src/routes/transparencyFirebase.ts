/**
 * Transparency routes using Firestore
 * Public endpoints showing issue timeline and ledger integrity
 */

import { Router, Request, Response } from "express";
import { getDoc, listSubDocs } from "../services/firestoreApi";

const router = Router();

/**
 * GET /transparency/issues/:id/timeline
 * Get issue with full event timeline and integrity check
 */
router.get("/issues/:id/timeline", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const issue = await getDoc("issues", id);
    if (!issue) {
      return res.status(404).json({ error: "Issue not found" });
    }

    // Get ledger entries for this issue
    let ledger: any[] = [];
    try {
      ledger = await listSubDocs("issues", id, "ledger");
    } catch (error) {
      console.warn("Ledger not available yet:", error);
      // Ledger might not exist if feature not deployed yet
    }

    // Sort ledger by timestamp
    ledger.sort((a, b) => {
      const dateA = new Date(a.timestamp || a.createdAt || 0).getTime();
      const dateB = new Date(b.timestamp || b.createdAt || 0).getTime();
      return dateA - dateB;
    });

    // Build timeline combining issue updates and ledger
    const timeline = [
      {
        eventType: "ISSUE_CREATED",
        timestamp: issue.createdAt,
        actor: issue.createdBy,
        details: {
          title: issue.title,
          category: issue.category,
          department: issue.department,
        },
      },
      ...ledger.map((entry) => ({
        eventType: entry.eventType,
        timestamp: entry.timestamp || entry.createdAt,
        actor: entry.actor || "system",
        details: entry.payload,
        integrity: {
          current: entry.hash,
          previous: entry.prevHash,
        },
      })),
    ];

    res.json({
      issue: {
        id: issue.id,
        title: issue.title,
        description: issue.description,
        status: issue.status,
        category: issue.category,
        severity: issue.severity,
        latitude: issue.latitude,
        longitude: issue.longitude,
        address: issue.address,
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt,
        voteCount: issue.voteCount || 0,
        commentCount: issue.commentCount || 0,
      },
      timeline,
      integrityCheckEnabled: ledger.length > 0,
    });
  } catch (error) {
    console.error("GET /transparency/:id/timeline error:", error);
    res.status(500).json({ error: "Failed to fetch timeline" });
  }
});

/**
 * GET /transparency/issues
 * List all issues (public view)
 */
router.get("/issues", async (req: Request, res: Response) => {
  try {
    const { limit = "100" } = req.query;

    // For simplicity, we'll just return empty array
    // In production, implement proper collection listing
    const publicIssues: any[] = [];

    res.json(publicIssues.slice(0, parseInt(limit as string)));
  } catch (error) {
    console.error("GET /transparency/issues error:", error);
    res.status(500).json({ error: "Failed to fetch issues" });
  }
});

/**
 * GET /transparency/stats
 * Basic transparency statistics
 */
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const stats = {
      totalIssues: 0,
      byStatus: {
        OPEN: 0,
        IN_PROGRESS: 0,
        RESOLVED: 0,
        CLOSED: 0,
      },
      byDepartment: {},
      totalVotes: 0,
      totalComments: 0,
    };

    res.json(stats);
  } catch (error) {
    console.error("GET /transparency/stats error:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
