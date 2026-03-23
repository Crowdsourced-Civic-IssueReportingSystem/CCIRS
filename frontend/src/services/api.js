import { getAuthToken } from "./auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

async function request(path, options = {}) {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    const message = data?.error || data?.message || "API request failed";
    throw new Error(message);
  }

  return data;
}

export function fetchIssues() {
  return request("/issues");
}

export function fetchPublicIssues(limit = 100) {
  return request(`/transparency/issues?limit=${limit}`);
}

export function createIssue(payload) {
  return request("/issues", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchIssueById(issueId) {
  return request(`/issues/${issueId}`);
}

export function fetchIssueTimeline(issueId) {
  return request(`/transparency/issues/${issueId}/timeline`);
}

export function loginUser(payload) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function registerUser(payload) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function logoutUser() {
  return request("/auth/logout", {
    method: "POST",
  });
}

export function fetchCurrentUser() {
  return request("/auth/me");
}

export function updateIssueStatus(issueId, status) {
  return request(`/issues/${issueId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function fetchTransparencyStats() {
  return request("/transparency/stats");
}
