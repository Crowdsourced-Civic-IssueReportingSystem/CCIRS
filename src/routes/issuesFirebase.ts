/**
 * Issues routes using Firestore
 * All endpoints require Firebase authentication
 */

import { Router, Request, Response } from "express";
import { requireFirebaseAuth } from "../middleware/firebaseAuth";
import {
  createDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  deleteSubDoc,
  listDocs,
  createSubDoc,
  listSubDocs,
} from "../services/firestoreApi";
import { classifyIssue } from "../services/aiRouter";
import { appendLedgerEvent, verifyLedger } from "../services/ledger";

const router = Router();

/**
 * POST /issues
 * Create a new civic issue
 */
router.post("/", requireFirebaseAuth, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).authUser?.uid;
    const { title, description, latitude, longitude, address, voiceNoteUrl, priority } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: "Title and description required" });
    }

    // AI classification
    const aiResult = await classifyIssue({ title, description });

    const issueId = `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const issueData = {
      id: issueId,
      title,
      description,
      createdBy: uid,
      status: "OPEN",
      severity: priority || "MEDIUM",
      category: aiResult.category,
      department: aiResult.department,
      aiConfidence: aiResult.confidence,
      latitude: latitude || null,
      longitude: longitude || null,
      address: address || "",
      voiceNoteUrl: voiceNoteUrl || "",
      voteCount: 0,
      commentCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store in Firestore
    await createDoc("issues", issueId, issueData);

    // Record in ledger
    await appendLedgerEvent(issueId, "CREATED", {
      createdBy: uid,
      title,
      category: aiResult.category,
    });

    res.status(201).json(issueData);
  } catch (error) {
    console.error("POST /issues error:", error);
    res.status(500).json({ error: "Failed to create issue" });
  }
});

/**
 * GET /issues
 * List issues with optional filters
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { status, department, limit = "50" } = req.query;

    // For now, list all and filter in memory (TODO: implement Firestore query)
    let issues = await listDocs("issues", parseInt(limit as string));

    if (status) {
      issues = issues.filter((i) => i.status === status);
    }
    if (department) {
      issues = issues.filter((i) => i.department === department);
    }

    res.json(issues);
  } catch (error) {
    console.error("GET /issues error:", error);
    res.status(500).json({ error: "Failed to fetch issues" });
  }
});

/**
 * GET /issues/:id
 * Get single issue detail with comments
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const issue = await getDoc("issues", id);
    if (!issue) {
      return res.status(404).json({ error: "Issue not found" });
    }

    // Get comments
    const comments = await listSubDocs("issues", id, "comments");

    // Get votes
    const votes = await listSubDocs("issues", id, "votes");

    res.json({
      ...issue,
      comments,
      votes: votes.length,
    });
  } catch (error) {
    console.error("GET /issues/:id error:", error);
    res.status(500).json({ error: "Failed to fetch issue" });
  }
});

/**
 * PATCH /issues/:id/status
 * Update issue status (requires moderator role)
 */
router.patch("/:id/status", requireFirebaseAuth, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).authUser?.uid;
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status required" });
    }

    // Check moderator role (simplified - in production, fetch user doc)
    // For now, assume any authenticated user can update
    const issue = await getDoc("issues", id);
    if (!issue) {
      return res.status(404).json({ error: "Issue not found" });
    }

    const updatedIssue = {
      ...issue,
      status,
      updatedAt: new Date().toISOString(),
    };

    await updateDoc("issues", id, updatedIssue);

    // Record in ledger
    await appendLedgerEvent(id, "STATUS_UPDATED", {
      updatedBy: uid,
      newStatus: status,
      previousStatus: issue.status,
    });

    res.json(updatedIssue);
  } catch (error) {
    console.error("PATCH /issues/:id/status error:", error);
    res.status(500).json({ error: "Failed to update issue status" });
  }
});

/**
 * POST /issues/:id/vote
 * Upvote an issue
 */
router.post("/:id/vote", requireFirebaseAuth, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).authUser?.uid;
    const { id } = req.params;

    const issue = await getDoc("issues", id);
    if (!issue) {
      return res.status(404).json({ error: "Issue not found" });
    }

    // Check if user already voted
    const votes = await listSubDocs("issues", id, "votes");
    const alreadyVoted = votes.some((v) => v.userId === uid);

    if (alreadyVoted) {
      return res.status(400).json({ error: "Already voted" });
    }

    // Record vote
    const voteId = `vote_${Date.now()}`;
    await createSubDoc("issues", id, "votes", voteId, {
      userId: uid,
      createdAt: new Date().toISOString(),
    });

    // Update vote count on issue
    const newVoteCount = (issue.voteCount || 0) + 1;
    await updateDoc("issues", id, { voteCount: newVoteCount });

    // Record in ledger
    await appendLedgerEvent(id, "VOTED", {
      votedBy: uid,
    });

    res.json({ message: "Vote recorded", voteCount: newVoteCount });
  } catch (error) {
    console.error("POST /issues/:id/vote error:", error);
    res.status(500).json({ error: "Failed to vote" });
  }
});

/**
 * DELETE /issues/:id/vote
 * Remove upvote
 */
router.delete("/:id/vote", requireFirebaseAuth, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).authUser?.uid;
    const { id } = req.params;

    const issue = await getDoc("issues", id);
    if (!issue) {
      return res.status(404).json({ error: "Issue not found" });
    }

    // Find and delete user's vote
    const votes = await listSubDocs("issues", id, "votes");
    const userVote = votes.find((v) => v.userId === uid);

    if (!userVote) {
      return res.status(400).json({ error: "No vote to remove" });
    }

    const voteDocId = userVote.id || `vote_${uid}`;
    await deleteSubDoc("issues", id, "votes", voteDocId);

    // Update vote count
    const newVoteCount = Math.max(0, (issue.voteCount || 1) - 1);
    await updateDoc("issues", id, { voteCount: newVoteCount });

    res.json({ message: "Vote removed", voteCount: newVoteCount });
  } catch (error) {
    console.error("DELETE /issues/:id/vote error:", error);
    res.status(500).json({ error: "Failed to remove vote" });
  }
});

/**
 * POST /issues/:id/comments
 * Add comment to issue
 */
router.post("/:id/comments", requireFirebaseAuth, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).authUser?.uid;
    const { id } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Comment text required" });
    }

    const issue = await getDoc("issues", id);
    if (!issue) {
      return res.status(404).json({ error: "Issue not found" });
    }

    // Create comment
    const commentId = `comment_${Date.now()}`;
    const commentData = {
      id: commentId,
      userId: uid,
      text,
      createdAt: new Date().toISOString(),
    };

    await createSubDoc("issues", id, "comments", commentId, commentData);

    // Update comment count
    const newCommentCount = (issue.commentCount || 0) + 1;
    await updateDoc("issues", id, { commentCount: newCommentCount });

    // Record in ledger
    await appendLedgerEvent(id, "COMMENTED", {
      commentedBy: uid,
      text: text.substring(0, 100),
    });

    res.status(201).json(commentData);
  } catch (error) {
    console.error("POST /issues/:id/comments error:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

export default router;
