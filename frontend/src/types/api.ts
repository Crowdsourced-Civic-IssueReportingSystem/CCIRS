export type UserRole = "ADMIN" | "MODERATOR" | "CITIZEN" | string;

export interface AuthUser {
  uid?: string;
  id?: string;
  email?: string;
  name?: string;
  role?: UserRole;
  language?: string;
  notifications?: boolean;
  [key: string]: unknown;
}

export interface AuthResponse {
  message?: string;
  user?: AuthUser | null;
  tokens?: {
    accessToken?: string;
    refreshToken?: string;
  };
}

export interface IssueDto {
  id: string;
  title?: string;
  description?: string;
  category?: string;
  department?: string;
  status?: string;
  severity?: string;
  createdAt?: string | number;
  updatedAt?: string | number;
  latitude?: number | null;
  longitude?: number | null;
  address?: string;
  image?: string;
  photoUrls?: string[];
  voteCount?: number;
  votes?: Array<{ id?: string; userId?: string }>;
  [key: string]: unknown;
}

export interface TransparencyStats {
  totalIssues?: number;
  byStatus?: Record<string, number>;
  byDepartment?: Record<string, number>;
  totalVotes?: number;
  totalComments?: number;
}

export interface TimelineEvent {
  eventType?: string;
  timestamp?: string | number;
  details?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface IssueTimelineResponse {
  issue?: IssueDto;
  timeline?: TimelineEvent[];
  integrityCheckEnabled?: boolean;
  integrity?: {
    ok: boolean;
    totalEntries: number;
    failedIndex: number | null;
  };
}

export interface CreateIssuePayload {
  title: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  address: string;
  photoUrls: string[];
  language: string;
  priority: string;
}
