const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'creator' | 'reviewer' | 'solo';
  organization_id?: string;
}

export interface Organization {
  id: string;
  name: string;
  type: 'enterprise' | 'solo';
}

export interface AuthResponse {
  token: string;
  user: User;
  organization: Organization;
}

export interface Issue {
  id: string;
  type: 'banned_term' | 'outdated_term' | 'tone' | 'unverified_claim' | 'contradicted_claim' | 'accessibility' | 'visual';
  severity: 'high' | 'medium' | 'low';
  quote: string;
  start_idx: number;
  end_idx: number;
  explanation: string;
  source_ref: string;
  suggestion: string;
  status: 'open' | 'accepted' | 'dismissed';
  dismiss_reason?: string;
}

export interface ContentVersion {
  id: string;
  version_no: number;
  body: string;
  created_at: string;
  created_by_name?: string;
}

export interface ContentItem {
  id: string;
  title: string;
  channel: string;
  status: 'draft' | 'reviewed' | 'submitted' | 'changes_requested' | 'approved' | 'rejected' | 'published';
  latest_score: number;
  current_version_id: string;
  created_at: string;
  author_name: string;
  author_email: string;
  current_version_no?: number;
}

export interface CommentItem {
  id: string;
  body: string;
  start_idx?: number;
  end_idx?: number;
  version_id: string;
  parent_id?: string;
  created_at: string;
  author_name: string;
  author_role: string;
}

export interface ContentDetails {
  content: ContentItem;
  versions: ContentVersion[];
  latestReview: {
    id: string;
    status: 'queued' | 'running' | 'done' | 'failed';
    score: number;
    started_at: string;
    finished_at?: string;
  } | null;
  issues: Issue[];
  comments: CommentItem[];
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('inkloom_token');
}

async function fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    let errorMsg = `HTTP ${res.status}`;
    try {
      const errJson = await res.json();
      errorMsg = errJson.error || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  async login(email: string, password = 'password123'): Promise<AuthResponse> {
    const data = await fetchWithAuth<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    localStorage.setItem('inkloom_token', data.token);
    return data;
  },

  async register(orgName: string, orgType: string, name: string, email: string, password = 'password123'): Promise<AuthResponse> {
    const data = await fetchWithAuth<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ orgName, orgType, name, email, password })
    });
    localStorage.setItem('inkloom_token', data.token);
    return data;
  },

  async getMe(): Promise<{ user: User; organization: Organization }> {
    return fetchWithAuth<{ user: User; organization: Organization }>('/auth/me');
  },

  // Contents
  async getContents(): Promise<{ contents: ContentItem[] }> {
    return fetchWithAuth<{ contents: ContentItem[] }>('/contents');
  },

  async getContent(id: string): Promise<ContentDetails> {
    return fetchWithAuth<ContentDetails>(`/contents/${id}`);
  },

  async createContent(title: string, channel: string, body: string): Promise<{ content: ContentItem; version: ContentVersion }> {
    return fetchWithAuth<{ content: ContentItem; version: ContentVersion }>('/contents', {
      method: 'POST',
      body: JSON.stringify({ title, channel, body })
    });
  },

  async createNewVersion(contentId: string, body: string): Promise<{ version: ContentVersion }> {
    return fetchWithAuth<{ version: ContentVersion }>(`/contents/${contentId}/versions`, {
      method: 'POST',
      body: JSON.stringify({ body })
    });
  },

  async triggerReview(contentId: string): Promise<{ reviewId: string; status: string }> {
    return fetchWithAuth<{ reviewId: string; status: string }>(`/contents/${contentId}/review`, {
      method: 'POST'
    });
  },

  async getReview(reviewId: string): Promise<{ review: any; issues: Issue[] }> {
    return fetchWithAuth<{ review: any; issues: Issue[] }>(`/reviews/${reviewId}`);
  },

  async patchIssue(issueId: string, payload: { status: 'open' | 'accepted' | 'dismissed'; dismiss_reason?: string; suggestion?: string }): Promise<{ issue: Issue; newScore: number }> {
    return fetchWithAuth<{ issue: Issue; newScore: number }>(`/issues/${issueId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },

  async submitForApproval(contentId: string): Promise<{ status: string }> {
    return fetchWithAuth<{ status: string }>(`/contents/${contentId}/submit`, {
      method: 'POST'
    });
  },

  async submitDecision(contentId: string, decision: 'approved' | 'changes_requested' | 'rejected', note?: string): Promise<{ status: string }> {
    return fetchWithAuth<{ status: string }>(`/contents/${contentId}/decision`, {
      method: 'POST',
      body: JSON.stringify({ decision, note })
    });
  },

  async publishContent(contentId: string): Promise<{ status: string }> {
    return fetchWithAuth<{ status: string }>(`/contents/${contentId}/publish`, {
      method: 'POST'
    });
  },

  // Approvals Queue
  async getApprovalsQueue(): Promise<{ queue: any[] }> {
    return fetchWithAuth<{ queue: any[] }>('/approvals/queue');
  },

  // Comments
  async addComment(contentId: string, versionId: string, body: string, start_idx?: number, end_idx?: number): Promise<{ comment: CommentItem }> {
    return fetchWithAuth<{ comment: CommentItem }>(`/contents/${contentId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ version_id: versionId, body, start_idx, end_idx })
    });
  },

  // Guidelines
  async getGuidelines(): Promise<{ guidelines: any[] }> {
    return fetchWithAuth<{ guidelines: any[] }>('/guidelines');
  },

  async uploadGuideline(title: string, kind: string, content: string): Promise<any> {
    return fetchWithAuth('/guidelines', {
      method: 'POST',
      body: JSON.stringify({ title, kind, content })
    });
  },

  // Facts
  async getFacts(): Promise<{ facts: any[] }> {
    return fetchWithAuth<{ facts: any[] }>('/facts');
  },

  async uploadFact(title: string, content: string, effective_date?: string): Promise<any> {
    return fetchWithAuth('/facts', {
      method: 'POST',
      body: JSON.stringify({ title, content, effective_date })
    });
  },

  // Banned Terms
  async getBannedTerms(): Promise<{ bannedTerms: any[] }> {
    return fetchWithAuth<{ bannedTerms: any[] }>('/banned-terms');
  },

  async createBannedTerm(term: string, preferred_replacement: string, reason: string, severity: string): Promise<any> {
    return fetchWithAuth('/banned-terms', {
      method: 'POST',
      body: JSON.stringify({ term, preferred_replacement, reason, severity })
    });
  },

  async deleteBannedTerm(id: string): Promise<any> {
    return fetchWithAuth(`/banned-terms/${id}`, {
      method: 'DELETE'
    });
  },

  // Users
  async getUsers(): Promise<{ users: any[] }> {
    return fetchWithAuth<{ users: any[] }>('/users');
  },

  async inviteUser(email: string, name: string, role: string): Promise<any> {
    return fetchWithAuth('/users/invite', {
      method: 'POST',
      body: JSON.stringify({ email, name, role })
    });
  },

  // Analytics
  async getAnalytics(): Promise<any> {
    return fetchWithAuth('/analytics/summary');
  },

  // Audit Logs
  async getAuditLogs(): Promise<{ logs: any[] }> {
    return fetchWithAuth<{ logs: any[] }>('/audit-logs');
  },

  // Accessibility
  async checkContrast(foreground: string, background: string): Promise<any> {
    return fetchWithAuth('/accessibility/contrast', {
      method: 'POST',
      body: JSON.stringify({ foreground, background })
    });
  },

  async auditA11yText(text: string): Promise<{ issues: any[] }> {
    return fetchWithAuth('/accessibility/audit-text', {
      method: 'POST',
      body: JSON.stringify({ text })
    });
  }
};
