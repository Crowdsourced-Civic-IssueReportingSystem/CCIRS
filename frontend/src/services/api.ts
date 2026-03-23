import { getAuthToken } from "./auth";
import type {
  AuthResponse,
  AuthUser,
  CreateIssuePayload,
  IssueDto,
  IssueTimelineResponse,
  TransparencyStats,
} from "../types/api";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export const API_ENDPOINTS = {
  issues: "/issues",
  issueById: (issueId: string) => `/issues/${issueId}`,
  issueStatus: (issueId: string) => `/issues/${issueId}/status`,
  publicIssues: (limit: number) => `/transparency/issues?limit=${limit}`,
  issueTimeline: (issueId: string) => `/transparency/issues/${issueId}/timeline`,
  transparencyStats: "/transparency/stats",
  authLogin: "/auth/login",
  authRegister: "/auth/register",
  authLogout: "/auth/logout",
  authMe: "/auth/me",
} as const;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    const err = data as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || "API request failed";
    throw new Error(message);
  }

  return data as T;
}

export function fetchIssues(): Promise<IssueDto[]> {
  return request<IssueDto[]>(API_ENDPOINTS.issues);
}

export function fetchPublicIssues(limit = 100): Promise<IssueDto[]> {
  return request<IssueDto[]>(API_ENDPOINTS.publicIssues(limit));
}

export function createIssue(payload: CreateIssuePayload): Promise<IssueDto> {
  return request<IssueDto>(API_ENDPOINTS.issues, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchIssueById(issueId: string): Promise<IssueDto> {
  return request<IssueDto>(API_ENDPOINTS.issueById(issueId));
}

export function fetchIssueTimeline(issueId: string): Promise<IssueTimelineResponse> {
  return request<IssueTimelineResponse>(API_ENDPOINTS.issueTimeline(issueId));
}

export function loginUser(payload: { email: string; password: string }): Promise<AuthResponse> {
  return request<AuthResponse>(API_ENDPOINTS.authLogin, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function registerUser(payload: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return request<AuthResponse>(API_ENDPOINTS.authRegister, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function logoutUser(): Promise<{ message?: string }> {
  return request<{ message?: string }>(API_ENDPOINTS.authLogout, {
    method: "POST",
  });
}

export function fetchCurrentUser(): Promise<AuthUser | null> {
  return request<AuthUser | null>(API_ENDPOINTS.authMe);
}

export function updateIssueStatus(issueId: string, status: string): Promise<IssueDto> {
  return request<IssueDto>(API_ENDPOINTS.issueStatus(issueId), {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function fetchTransparencyStats(): Promise<TransparencyStats | null> {
  return request<TransparencyStats | null>(API_ENDPOINTS.transparencyStats);
}
