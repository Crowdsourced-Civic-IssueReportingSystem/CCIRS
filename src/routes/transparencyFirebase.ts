/**
 * Transparency routes using Firestore
 * Public endpoints showing issue timeline and ledger integrity
 */

import { Router, Request, Response } from "express";
import { getDoc, listSubDocs, listDocs } from "../services/firestoreApi";

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
        language: issue.language || "en",
        latitude: issue.latitude,
        longitude: issue.longitude,
        address: issue.address,
        photoUrls: issue.photoUrls || [],
        voiceNoteUrl: issue.voiceNoteUrl || "",
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
    const { limit = "100", status, department, search } = req.query;

    const parsedLimit = Math.max(1, Math.min(200, parseInt(limit as string, 10) || 100));
    const allIssues = await listDocs("issues", 2000);

    let issues = allIssues.map((issue) => ({
      id: issue.id,
      title: issue.title,
      description: issue.description,
      status: issue.status,
      severity: issue.severity,
      category: issue.category,
      department: issue.department,
      language: issue.language || "en",
      voteCount: issue.voteCount || 0,
      commentCount: issue.commentCount || 0,
      photoCount: Array.isArray(issue.photoUrls) ? issue.photoUrls.length : 0,
      hasVoiceNote: Boolean(issue.voiceNoteUrl),
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
    }));

    if (status) {
      issues = issues.filter((i) => i.status === status);
    }

    if (department) {
      issues = issues.filter((i) => i.department === department);
    }

    if (search) {
      const q = String(search).toLowerCase().trim();
      if (q) {
        issues = issues.filter((i) => {
          const haystack = `${i.title || ""} ${i.description || ""} ${i.department || ""} ${i.category || ""}`.toLowerCase();
          return haystack.includes(q);
        });
      }
    }

    issues.sort((a, b) => {
      const aTs = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bTs = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bTs - aTs;
    });

    res.json(issues.slice(0, parsedLimit));
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
    const issues = await listDocs("issues", 1000);

    const stats = {
      totalIssues: issues.length,
      byStatus: {
        OPEN: 0,
        IN_PROGRESS: 0,
        RESOLVED: 0,
        CLOSED: 0,
      },
      byDepartment: {} as any,
      totalVotes: 0,
      totalComments: 0,
    };

    // Calculate stats
    for (const issue of issues) {
      // Count by status
      const status = issue.status as keyof typeof stats.byStatus;
      if (status in stats.byStatus) {
        stats.byStatus[status]++;
      } else {
        console.warn(`Unknown status: ${status}`);
      }

      // Count by department
      if (issue.department) {
        stats.byDepartment[issue.department] = (stats.byDepartment[issue.department] || 0) + 1;
      }

      // Count votes and comments
      stats.totalVotes += issue.voteCount || 0;
      stats.totalComments += issue.commentCount || 0;
    }

    res.json(stats);
  } catch (error) {
    console.error("GET /transparency/stats error:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
