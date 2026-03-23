import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  createIssue,
  fetchIssueById,
  fetchIssueTimeline,
  fetchIssues,
  fetchPublicIssues,
} from "../services/api";

const IssuesContext = createContext(null);

const orderedStages = ["Submitted", "Assigned", "In Progress", "Resolved"];

const statusMap = {
  OPEN: "Submitted",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Resolved",
  Submitted: "Submitted",
  Assigned: "Assigned",
  "In Progress": "In Progress",
  Resolved: "Resolved",
};

function normalizeStatus(status) {
  return statusMap[status] || status || "Submitted";
}

function toTimestamp(value) {
  if (!value) return Date.now();
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? Date.now() : ts;
}

function fallbackTimeline(status, createdAt, updatedAt) {
  const current = normalizeStatus(status);
  const created = toTimestamp(createdAt);
  const updated = toTimestamp(updatedAt || createdAt);
  const timeline = [{ key: "Submitted", timestamp: created }];

  if (current === "Assigned" || current === "In Progress" || current === "Resolved") {
    timeline.push({ key: "Assigned", timestamp: updated });
  }
  if (current === "In Progress" || current === "Resolved") {
    timeline.push({ key: "In Progress", timestamp: updated });
  }
  if (current === "Resolved") {
    timeline.push({ key: "Resolved", timestamp: updated });
  }
  return timeline;
}

function mapTimeline(transparencyData, issue) {
  const events = transparencyData?.timeline || [];
  if (!events.length) {
    return fallbackTimeline(issue.status, issue.createdAt, issue.updatedAt);
  }

  const points = {
    Submitted: toTimestamp(issue.createdAt),
  };

  for (const event of events) {
    const status = event?.details?.newStatus;
    if (!status) continue;
    const mapped = normalizeStatus(status);
    if (orderedStages.includes(mapped) && !points[mapped]) {
      points[mapped] = toTimestamp(event.timestamp);
    }
  }

  const currentStatus = normalizeStatus(issue.status);
  if ((currentStatus === "Assigned" || currentStatus === "In Progress" || currentStatus === "Resolved") && !points.Assigned) {
    points.Assigned = toTimestamp(issue.updatedAt || issue.createdAt);
  }
  if ((currentStatus === "In Progress" || currentStatus === "Resolved") && !points["In Progress"]) {
    points["In Progress"] = toTimestamp(issue.updatedAt || issue.createdAt);
  }
  if (currentStatus === "Resolved" && !points.Resolved) {
    points.Resolved = toTimestamp(issue.updatedAt || issue.createdAt);
  }

  return orderedStages.filter((key) => Boolean(points[key])).map((key) => ({ key, timestamp: points[key] }));
}

function normalizeIssue(issue) {
  const status = normalizeStatus(issue.status);
  const createdAt = issue.createdAt || new Date().toISOString();
  const updatedAt = issue.updatedAt || createdAt;

  const latitude = typeof issue.latitude === "number" ? issue.latitude : null;
  const longitude = typeof issue.longitude === "number" ? issue.longitude : null;

  let location = issue.address || "";
  if (!location && latitude != null && longitude != null) {
    location = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
  if (!location) {
    location = "Location unavailable";
  }

  return {
    id: issue.id,
    title: issue.title || "Untitled Issue",
    description: issue.description || "",
    category: issue.category || "General",
    status,
    rawStatus: issue.status,
    location,
    image: issue.image || (Array.isArray(issue.photoUrls) ? issue.photoUrls[0] : ""),
    createdAt: toTimestamp(createdAt),
    updatedAt: toTimestamp(updatedAt),
    timeline: fallbackTimeline(status, createdAt, updatedAt),
    voteCount: typeof issue.voteCount === "number" ? issue.voteCount : (issue.votes?.length || 0),
  };
}

export function IssuesProvider({ children }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const upsertIssue = (incomingIssue) => {
    setIssues((prev) => {
      const idx = prev.findIndex((item) => item.id === incomingIssue.id);
      if (idx === -1) return [incomingIssue, ...prev];
      const next = [...prev];
      next[idx] = incomingIssue;
      return next;
    });
  };

  const loadIssues = async () => {
    setLoading(true);
    setError("");
    try {
      let data = [];
      try {
        data = await fetchIssues();
      } catch {
        data = await fetchPublicIssues(100);
      }
      setIssues(data.map(normalizeIssue));
    } catch (err) {
      setError(err.message || "Unable to load issues");
      setIssues([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
  }, []);

  const submitIssue = async (payload) => {
    setSubmitting(true);
    try {
      const created = await createIssue({
        title: payload.title,
        description: payload.description,
        latitude: payload.coordinates?.latitude ?? null,
        longitude: payload.coordinates?.longitude ?? null,
        address: payload.locationLabel,
        photoUrls: payload.imagePreview ? [payload.imagePreview] : [],
        language: "en",
        priority: "MEDIUM",
      });
      const normalized = normalizeIssue(created);
      upsertIssue(normalized);
      return normalized;
    } finally {
      setSubmitting(false);
    }
  };

  const loadIssueById = async (id) => {
    const local = issues.find((issue) => issue.id.toLowerCase() === id.toLowerCase());
    try {
      const detail = await fetchIssueById(id);
      const normalized = normalizeIssue(detail);

      try {
        const timelineData = await fetchIssueTimeline(id);
        normalized.timeline = mapTimeline(timelineData, normalized);
      } catch {
        normalized.timeline = local?.timeline || normalized.timeline;
      }

      upsertIssue(normalized);
      return normalized;
    } catch {
      if (local) return local;
      return null;
    }
  };

  const findById = (id) => issues.find((issue) => issue.id.toLowerCase() === id.toLowerCase());

  const stats = useMemo(() => {
    return issues.reduce(
      (acc, issue) => {
        if (issue.status === "Resolved") acc.resolved += 1;
        if (issue.status === "In Progress") acc.active += 1;
        if (issue.status === "Submitted" || issue.status === "Assigned") acc.pending += 1;
        return acc;
      },
      { resolved: 0, active: 0, pending: 0 }
    );
  }, [issues]);

  const value = useMemo(
    () => ({
      issues,
      stats,
      loading,
      error,
      submitting,
      loadIssues,
      submitIssue,
      findById,
      loadIssueById,
    }),
    [issues, stats, loading, error, submitting]
  );

  return <IssuesContext.Provider value={value}>{children}</IssuesContext.Provider>;
}

export function useIssues() {
  const context = useContext(IssuesContext);
  if (!context) {
    throw new Error("useIssues must be used within IssuesProvider");
  }
  return context;
}
