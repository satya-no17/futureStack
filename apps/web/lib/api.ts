import {
  FALLBACK_USER,
  FALLBACK_ORG,
  FALLBACK_CONTENTS,
  FALLBACK_CONTENT_DETAILS,
  FALLBACK_GUIDELINES,
  FALLBACK_FACTS,
  FALLBACK_BANNED_TERMS,
  FALLBACK_ANALYTICS,
  FALLBACK_AUDIT_LOGS,
  FALLBACK_APPROVAL_QUEUE,
  FALLBACK_SLIDE_DECK,
  FALLBACK_SELF_HEALING,
  GuidelineItem,
  BrandFactItem,
  BannedTermItem,
  AnalyticsData,
  AuditLogEntry,
  ApprovalQueueItem,
  SlideDeckDemo,
  SelfHealingSuggestion
} from './fallbackData';

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
    error_message?: string;
    started_at: string;
    finished_at?: string;
  } | null;
  issues: Issue[];
  comments: CommentItem[];
}

export interface SocialPreview {
  channel: string;
  channelName: string;
  formattedText: string;
  characterCount: number;
  maxChars: number;
  isWithinLimit: boolean;
  intentUrl: string;
  complianceWatermark: string;
}

export interface ContrastResult {
  foreground?: string;
  background?: string;
  contrastRatio: number;
  wcag: {
    aaNormalText: boolean;
    aaLargeText: boolean;
    aaaNormalText: boolean;
  };
  ratio?: number;
  score?: 'AAA' | 'AA' | 'AA Large' | 'Fail';
  passesAA?: boolean;
  passesAALarge?: boolean;
  passesAAA?: boolean;
  foregroundLuminance?: number;
  backgroundLuminance?: number;
}

// ============================================================================
// SIMULATION & FALLBACK STATE MANAGEMENT
// ============================================================================

let programmaticSimulatedFailure = false;
let fallbackActive = false;
let fallbackReason: string | null = null;

type FallbackListener = (active: boolean, reason: string | null) => void;
const fallbackListeners = new Set<FallbackListener>();

export function isSimulatedFailureActive(): boolean {
  if (programmaticSimulatedFailure) return true;
  if (typeof window !== 'undefined') {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('simulate_failure') === 'true') {
        return true;
      }
      return localStorage.getItem('inkloom_simulate_failure') === 'true';
    } catch {
      return false;
    }
  }
  return false;
}

export function isFallbackActive(): boolean {
  return fallbackActive || isSimulatedFailureActive();
}

export function getFallbackReason(): string | null {
  if (isSimulatedFailureActive()) {
    return 'Simulated failure mode active (?simulate_failure=true)';
  }
  return fallbackReason;
}

function notifyFallbackState(active: boolean, reason: string | null) {
  fallbackActive = active;
  fallbackReason = reason;
  const effectiveActive = isFallbackActive();
  const effectiveReason = getFallbackReason();
  fallbackListeners.forEach((fn) => {
    try {
      fn(effectiveActive, effectiveReason);
    } catch (e) {
      console.error('Error in fallback subscriber:', e);
    }
  });
}

export function subscribeToFallbackState(
  callback: (active: boolean, reason: string | null) => void
): () => void {
  fallbackListeners.add(callback);
  callback(isFallbackActive(), getFallbackReason());
  return () => {
    fallbackListeners.delete(callback);
  };
}

export function setSimulatedFailure(active: boolean): void {
  programmaticSimulatedFailure = active;
  if (typeof window !== 'undefined') {
    try {
      if (active) {
        localStorage.setItem('inkloom_simulate_failure', 'true');
      } else {
        localStorage.removeItem('inkloom_simulate_failure');
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }
  notifyFallbackState(active, active ? 'Simulated failure mode active' : null);
}

export async function testConnection(): Promise<boolean> {
  if (isSimulatedFailureActive()) {
    return false;
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${API_URL}/health`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      notifyFallbackState(false, null);
      return true;
    }
  } catch {
    // Backend unreachable
  }
  return false;
}

// ============================================================================
// IN-MEMORY FALLBACK WORKING STATE
// ============================================================================

const localState = {
  contents: [...FALLBACK_CONTENTS],
  contentDetails: { ...FALLBACK_CONTENT_DETAILS },
  guidelines: [...FALLBACK_GUIDELINES],
  facts: [...FALLBACK_FACTS],
  bannedTerms: [...FALLBACK_BANNED_TERMS],
  analytics: { ...FALLBACK_ANALYTICS },
  auditLogs: [...FALLBACK_AUDIT_LOGS],
  approvalQueue: [...FALLBACK_APPROVAL_QUEUE]
};

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('inkloom_token');
}

// Core HTTP fetch with timeout and simulation interception
async function fetchWithAuth<T>(endpoint: string, options: RequestInit = {}, requestTimeoutMs = 8000): Promise<T> {
  if (isSimulatedFailureActive()) {
    throw new Error('Simulated network failure active (?simulate_failure=true)');
  }

  const token = getToken();
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      let errorMsg = `HTTP ${res.status}`;
      try {
        const errJson = await res.json();
        errorMsg = errJson.error || errorMsg;
      } catch {
        // Ignored
      }
      const requestError = new Error(errorMsg) as Error & { status?: number };
      requestError.status = res.status;
      throw requestError;
    }

    if (fallbackActive) {
      notifyFallbackState(false, null);
    }

    return (await res.json()) as T;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const message = err instanceof Error ? err.message : 'Network error';
    notifyFallbackState(true, message);
    throw err;
  }
}

// ============================================================================
// RESILIENT API CLIENT WITH AUTOMATED FALLBACK RECOVERY
// ============================================================================

export const api = {
  // Resilience status inspection helpers
  isFallbackActive,
  getFallbackReason,
  setSimulatedFailure,
  isSimulatedFailureActive,
  subscribeToFallbackState,
  testConnection,

  // Auth
  async login(email: string, password = 'password123'): Promise<AuthResponse> {
    try {
      const data = await fetchWithAuth<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      localStorage.setItem('inkloom_token', data.token);
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg && !msg.includes('Failed to fetch') && !msg.includes('AbortError') && !msg.includes('Network error')) {
        throw err;
      }
      notifyFallbackState(true, 'Offline fallback mode active');
      const mockToken = 'mock-jwt-token-fallback';
      if (typeof window !== 'undefined') {
        localStorage.setItem('inkloom_token', mockToken);
      }
      return {
        token: mockToken,
        user: { ...FALLBACK_USER, email: email || FALLBACK_USER.email },
        organization: FALLBACK_ORG
      };
    }
  },

  async register(
    orgName: string,
    orgType: string,
    name: string,
    email: string,
    password = 'password123'
  ): Promise<AuthResponse> {
    try {
      const data = await fetchWithAuth<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ orgName, orgType, name, email, password })
      });
      localStorage.setItem('inkloom_token', data.token);
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg && !msg.includes('Failed to fetch') && !msg.includes('AbortError') && !msg.includes('Network error')) {
        throw err;
      }
      notifyFallbackState(true, 'Offline fallback mode active');
      const mockToken = 'mock-jwt-token-fallback';
      if (typeof window !== 'undefined') {
        localStorage.setItem('inkloom_token', mockToken);
      }
      return {
        token: mockToken,
        user: { ...FALLBACK_USER, name, email, role: orgType === 'solo' ? 'solo' : 'admin' },
        organization: { id: 'org-fallback', name: orgName, type: orgType === 'solo' ? 'solo' : 'enterprise' }
      };
    }
  },

  async getMe(): Promise<{ user: User; organization: Organization }> {
    try {
      return await fetchWithAuth<{ user: User; organization: Organization }>('/auth/me');
    } catch {
      notifyFallbackState(true, 'Offline fallback mode active');
      return {
        user: FALLBACK_USER,
        organization: FALLBACK_ORG
      };
    }
  },

  // Contents
  async getContents(): Promise<{ contents: ContentItem[] }> {
    try {
      return await fetchWithAuth<{ contents: ContentItem[] }>('/contents');
    } catch {
      notifyFallbackState(true, 'Backend unreachable: serving cached drafts');
      return { contents: [...localState.contents] };
    }
  },

  async getContent(id: string): Promise<ContentDetails> {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUUID || id.startsWith('draft-fallback-')) {
      if (localState.contentDetails[id]) {
        return localState.contentDetails[id];
      }
      const item = localState.contents.find((c) => c.id === id) || localState.contents[0];
      return {
        content: item,
        versions: [
          {
            id: item.current_version_id || 'ver-1',
            version_no: item.current_version_no || 1,
            body: 'Our platform delivers audited brand governance across all publishing channels.',
            created_at: item.created_at,
            created_by_name: item.author_name
          }
        ],
        latestReview: {
          id: 'rev-auto',
          status: 'done',
          score: item.latest_score || 90,
          started_at: item.created_at,
          finished_at: item.created_at
        },
        issues: [],
        comments: []
      };
    }
    try {
      return await fetchWithAuth<ContentDetails>(`/contents/${id}`);
    } catch {
      notifyFallbackState(true, 'Backend unreachable: serving cached draft details');
      if (localState.contentDetails[id]) {
        return localState.contentDetails[id];
      }
      const item = localState.contents.find((c) => c.id === id) || localState.contents[0];
      const fallbackDetail: ContentDetails = {
        content: item,
        versions: [
          {
            id: item.current_version_id || 'ver-1',
            version_no: item.current_version_no || 1,
            body: 'Our platform delivers audited brand governance across all publishing channels.',
            created_at: item.created_at,
            created_by_name: item.author_name
          }
        ],
        latestReview: {
          id: 'rev-auto',
          status: 'done',
          score: item.latest_score || 90,
          started_at: item.created_at,
          finished_at: item.created_at
        },
        issues: [],
        comments: []
      };
      return fallbackDetail;
    }
  },

  async createContent(
    title: string,
    channel: string,
    body: string
  ): Promise<{ content: ContentItem; version: ContentVersion }> {
    try {
      return await fetchWithAuth<{ content: ContentItem; version: ContentVersion }>('/contents', {
        method: 'POST',
        body: JSON.stringify({ title, channel, body })
      });
    } catch {
      notifyFallbackState(true, 'Offline mode: draft saved locally');
      const newId = `draft-local-${Date.now()}`;
      const verId = `ver-local-${Date.now()}`;
      const newContent: ContentItem = {
        id: newId,
        title,
        channel,
        status: 'draft',
        latest_score: 85,
        current_version_id: verId,
        created_at: new Date().toISOString(),
        author_name: 'You (Offline)',
        author_email: 'user@acme.com',
        current_version_no: 1
      };
      const newVersion: ContentVersion = {
        id: verId,
        version_no: 1,
        body,
        created_at: new Date().toISOString(),
        created_by_name: 'You (Offline)'
      };

      localState.contents = [newContent, ...localState.contents];
      localState.contentDetails[newId] = {
        content: newContent,
        versions: [newVersion],
        latestReview: null,
        issues: [],
        comments: []
      };

      return { content: newContent, version: newVersion };
    }
  },

  async createNewVersion(contentId: string, body: string): Promise<{ version: ContentVersion }> {
    try {
      return await fetchWithAuth<{ version: ContentVersion }>(`/contents/${contentId}/versions`, {
        method: 'POST',
        body: JSON.stringify({ body })
      });
    } catch {
      notifyFallbackState(true, 'Offline mode: version updated locally');
      const details = localState.contentDetails[contentId];
      const nextVerNo = (details?.versions.length || 0) + 1;
      const verId = `ver-local-${Date.now()}`;
      const newVer: ContentVersion = {
        id: verId,
        version_no: nextVerNo,
        body,
        created_at: new Date().toISOString(),
        created_by_name: 'You (Offline)'
      };

      if (details) {
        details.versions.push(newVer);
        details.content.current_version_id = verId;
        details.content.current_version_no = nextVerNo;
      }
      return { version: newVer };
    }
  },

  async triggerReview(contentId: string): Promise<{ reviewId: string; status: string }> {
    try {
      return await fetchWithAuth<{ reviewId: string; status: string }>(`/contents/${contentId}/review`, {
        method: 'POST'
      });
    } catch {
      notifyFallbackState(true, 'Offline mode: local review simulation');
      return { reviewId: `rev-sim-${contentId}`, status: 'done' };
    }
  },

  async getReview(
    reviewId: string
  ): Promise<{
    review: { id: string; status: 'queued' | 'running' | 'done' | 'failed'; score: number; error_message?: string };
    issues: Issue[];
  }> {
    try {
      return await fetchWithAuth<{
        review: { id: string; status: 'queued' | 'running' | 'done' | 'failed'; score: number; error_message?: string };
        issues: Issue[];
      }>(`/reviews/${reviewId}`);
    } catch {
      notifyFallbackState(true, 'Offline mode: simulated review completed');
      return {
        review: {
          id: reviewId,
          status: 'done',
          score: 88
        },
        issues: []
      };
    }
  },

  async patchIssue(
    issueId: string,
    payload: { status: 'open' | 'accepted' | 'dismissed'; dismiss_reason?: string; suggestion?: string }
  ): Promise<{ issue: Issue; newScore: number }> {
    try {
      return await fetchWithAuth<{ issue: Issue; newScore: number }>(`/issues/${issueId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
    } catch {
      notifyFallbackState(true, 'Offline mode: issue status updated locally');
      let foundIssue: Issue | null = null;
      let targetDetails: ContentDetails | null = null;

      for (const details of Object.values(localState.contentDetails)) {
        const match = details.issues.find((i) => i.id === issueId);
        if (match) {
          foundIssue = match;
          targetDetails = details;
          break;
        }
      }

      if (foundIssue && targetDetails) {
        foundIssue.status = payload.status;
        if (payload.dismiss_reason) foundIssue.dismiss_reason = payload.dismiss_reason;
        if (payload.suggestion) foundIssue.suggestion = payload.suggestion;

        const openCount = targetDetails.issues.filter((i) => i.status === 'open').length;
        const newScore = Math.min(100, Math.max(40, 100 - openCount * 10));
        targetDetails.content.latest_score = newScore;
        return { issue: foundIssue, newScore };
      }

      return {
        issue: {
          id: issueId,
          type: 'banned_term',
          severity: 'medium',
          quote: 'term',
          start_idx: 0,
          end_idx: 4,
          explanation: 'Issue updated offline.',
          source_ref: 'Offline Brand Policy',
          suggestion: payload.suggestion || 'fixed',
          status: payload.status,
          dismiss_reason: payload.dismiss_reason
        },
        newScore: 92
      };
    }
  },

  async submitForApproval(contentId: string): Promise<{ status: string }> {
    try {
      return await fetchWithAuth<{ status: string }>(`/contents/${contentId}/submit`, {
        method: 'POST'
      });
    } catch {
      notifyFallbackState(true, 'Offline mode: draft submitted for approval locally');
      const details = localState.contentDetails[contentId];
      if (details) {
        details.content.status = 'submitted';
        const currentVer = details.versions.find((v) => v.id === details.content.current_version_id);
        localState.approvalQueue.unshift({
          id: details.content.id,
          title: details.content.title,
          channel: details.content.channel,
          author_name: details.content.author_name,
          created_at: new Date().toISOString(),
          latest_score: details.content.latest_score,
          current_body: currentVer?.body || ''
        });
      }
      return { status: 'submitted' };
    }
  },

  async submitDecision(
    contentId: string,
    decision: 'approved' | 'changes_requested' | 'rejected',
    note?: string
  ): Promise<{ status: string }> {
    try {
      return await fetchWithAuth<{ status: string }>(`/contents/${contentId}/decision`, {
        method: 'POST',
        body: JSON.stringify({ decision, note })
      });
    } catch {
      notifyFallbackState(true, 'Offline mode: decision recorded locally');
      const details = localState.contentDetails[contentId];
      if (details) {
        details.content.status = decision;
      }
      localState.approvalQueue = localState.approvalQueue.filter((q) => q.id !== contentId);
      localState.auditLogs.unshift({
        id: `aud-sim-${Date.now()}`,
        actor_name: 'You (Offline Reviewer)',
        action: decision,
        entity_type: 'content',
        metadata: { contentId, note: note || '' },
        created_at: new Date().toISOString()
      });
      return { status: decision };
    }
  },

  async publishContent(contentId: string): Promise<{ status: string }> {
    try {
      return await fetchWithAuth<{ status: string }>(`/contents/${contentId}/publish`, {
        method: 'POST'
      });
    } catch {
      notifyFallbackState(true, 'Offline mode: marked as published');
      const details = localState.contentDetails[contentId];
      if (details) {
        details.content.status = 'published';
      }
      localState.auditLogs.unshift({
        id: `aud-sim-${Date.now()}`,
        actor_name: 'You (Offline Admin)',
        action: 'published',
        entity_type: 'content',
        metadata: { contentId },
        created_at: new Date().toISOString()
      });
      return { status: 'published' };
    }
  },

  // Approvals Queue
  async getApprovalsQueue(): Promise<{ queue: ApprovalQueueItem[] }> {
    try {
      return await fetchWithAuth<{ queue: ApprovalQueueItem[] }>('/approvals/queue');
    } catch {
      notifyFallbackState(true, 'Offline fallback mode: serving approval queue');
      return { queue: [...localState.approvalQueue] };
    }
  },

  // Comments
  async addComment(
    contentId: string,
    versionId: string,
    body: string,
    start_idx?: number,
    end_idx?: number
  ): Promise<{ comment: CommentItem }> {
    try {
      return await fetchWithAuth<{ comment: CommentItem }>(`/contents/${contentId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ version_id: versionId, body, start_idx, end_idx })
      });
    } catch {
      notifyFallbackState(true, 'Offline mode: comment added locally');
      const newComment: CommentItem = {
        id: `com-sim-${Date.now()}`,
        body,
        start_idx,
        end_idx,
        version_id: versionId,
        created_at: new Date().toISOString(),
        author_name: 'You (Offline)',
        author_role: 'Author'
      };
      const details = localState.contentDetails[contentId];
      if (details) {
        details.comments.push(newComment);
      }
      return { comment: newComment };
    }
  },

  // Guidelines
  async getGuidelines(): Promise<{ guidelines: GuidelineItem[] }> {
    try {
      return await fetchWithAuth<{ guidelines: GuidelineItem[] }>('/guidelines');
    } catch {
      notifyFallbackState(true, 'Offline mode: serving cached brand voice guidelines');
      return { guidelines: [...localState.guidelines] };
    }
  },

  async uploadGuideline(
    title: string,
    kind: string,
    content: string
  ): Promise<{ guideline: GuidelineItem; chunk_count: number }> {
    try {
      return await fetchWithAuth('/guidelines', {
        method: 'POST',
        body: JSON.stringify({ title, kind, content })
      });
    } catch {
      notifyFallbackState(true, 'Offline mode: guideline stored locally');
      const item: GuidelineItem = {
        id: `g-sim-${Date.now()}`,
        title,
        kind,
        content,
        chunk_count: 4,
        created_at: new Date().toISOString()
      };
      localState.guidelines.push(item);
      return { guideline: item, chunk_count: 4 };
    }
  },

  // Facts
  async getFacts(): Promise<{ facts: BrandFactItem[] }> {
    try {
      return await fetchWithAuth<{ facts: BrandFactItem[] }>('/facts');
    } catch {
      notifyFallbackState(true, 'Offline mode: serving approved corporate facts');
      return { facts: [...localState.facts] };
    }
  },

  async uploadFact(
    title: string,
    content: string,
    effective_date?: string
  ): Promise<{ fact: BrandFactItem; chunk_count: number }> {
    try {
      return await fetchWithAuth('/facts', {
        method: 'POST',
        body: JSON.stringify({ title, content, effective_date })
      });
    } catch {
      notifyFallbackState(true, 'Offline mode: fact stored locally');
      const item: BrandFactItem = {
        id: `f-sim-${Date.now()}`,
        title,
        content,
        effective_date: effective_date || new Date().toISOString().split('T')[0],
        chunk_count: 3
      };
      localState.facts.push(item);
      return { fact: item, chunk_count: 3 };
    }
  },

  // Banned Terms
  async getBannedTerms(): Promise<{ bannedTerms: BannedTermItem[] }> {
    try {
      return await fetchWithAuth<{ bannedTerms: BannedTermItem[] }>('/banned-terms');
    } catch {
      notifyFallbackState(true, 'Offline mode: serving words to avoid list');
      return { bannedTerms: [...localState.bannedTerms] };
    }
  },

  async createBannedTerm(
    term: string,
    preferred_replacement: string,
    reason: string,
    severity: string
  ): Promise<{ bannedTerm: BannedTermItem }> {
    try {
      return await fetchWithAuth('/banned-terms', {
        method: 'POST',
        body: JSON.stringify({ term, preferred_replacement, reason, severity })
      });
    } catch (error) {
      if (error instanceof Error && 'status' in error) throw error;
      notifyFallbackState(true, 'Offline mode: word to avoid added locally');
      const item: BannedTermItem = {
        id: `b-sim-${Date.now()}`,
        term,
        preferred_replacement,
        reason,
        severity: (severity as 'high' | 'medium' | 'low') || 'medium'
      };
      localState.bannedTerms.push(item);
      return { bannedTerm: item };
    }
  },

  async createBannedTermsBulk(terms: Array<{ term: string; preferred_replacement: string; reason: string; severity: string }>): Promise<{ bannedTerms: BannedTermItem[]; importedCount: number; skippedCount: number }> {
    try {
      return await fetchWithAuth<{ bannedTerms: BannedTermItem[]; importedCount: number; skippedCount: number }>('/banned-terms/bulk', { method: 'POST', body: JSON.stringify({ terms }) });
    } catch (error) {
      if (error instanceof Error && 'status' in error) throw error;
      notifyFallbackState(true, 'Offline mode: avoid-list entries added locally');
      const seen = new Set(localState.bannedTerms.map((item) => item.term.trim().toLocaleLowerCase()));
      const created: BannedTermItem[] = [];
      for (const entry of terms) {
        const key = entry.term.trim().toLocaleLowerCase();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        const item: BannedTermItem = { id: `b-sim-${Date.now()}-${created.length}`, term: entry.term.trim(), preferred_replacement: entry.preferred_replacement, reason: entry.reason, severity: (entry.severity as BannedTermItem['severity']) || 'high' };
        localState.bannedTerms.push(item);
        created.push(item);
      }
      return { bannedTerms: created, importedCount: created.length, skippedCount: terms.length - created.length };
    }
  },

  async deleteBannedTerm(id: string): Promise<{ success: boolean }> {
    try {
      return await fetchWithAuth(`/banned-terms/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      if (error instanceof Error && 'status' in error) throw error;
      notifyFallbackState(true, 'Offline mode: word to avoid removed locally');
      localState.bannedTerms = localState.bannedTerms.filter((b) => b.id !== id);
      return { success: true };
    }
  },

  // Users
  async getUsers(): Promise<{ users: User[] }> {
    try {
      return await fetchWithAuth<{ users: User[] }>('/users');
    } catch {
      return { users: [FALLBACK_USER] };
    }
  },

  async inviteUser(email: string, name: string, role: string): Promise<{ success: boolean; user: User }> {
    try {
      return await fetchWithAuth('/users/invite', {
        method: 'POST',
        body: JSON.stringify({ email, name, role })
      });
    } catch {
      return {
        success: true,
        user: {
          id: `usr-sim-${Date.now()}`,
          email,
          name,
          role: (role as 'admin' | 'creator' | 'reviewer' | 'solo') || 'creator'
        }
      };
    }
  },

  // Analytics
  async getAnalytics(): Promise<AnalyticsData> {
    try {
      return await fetchWithAuth<AnalyticsData>('/analytics/summary');
    } catch {
      notifyFallbackState(true, 'Offline mode: serving compiled brand reports');
      return { ...localState.analytics };
    }
  },

  // Audit Logs
  async getAuditLogs(): Promise<{ logs: AuditLogEntry[] }> {
    try {
      return await fetchWithAuth<{ logs: AuditLogEntry[] }>('/audit-logs');
    } catch {
      notifyFallbackState(true, 'Offline mode: serving tamper-evident audit history');
      return { logs: [...localState.auditLogs] };
    }
  },

  // Accessibility
  async checkContrast(foreground: string, background: string): Promise<ContrastResult> {
    try {
      return await fetchWithAuth<ContrastResult>('/accessibility/contrast', {
        method: 'POST',
        body: JSON.stringify({ foreground, background })
      });
    } catch {
      // Deterministic client-side fallback calculation for WCAG AA/AAA
      function hexToRgb(hex: string) {
        const clean = hex.replace('#', '');
        const bigint = parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16);
        return {
          r: (bigint >> 16) & 255,
          g: (bigint >> 8) & 255,
          b: bigint & 255
        };
      }
      function getLuminance({ r, g, b }: { r: number; g: number; b: number }) {
        const a = [r, g, b].map((v) => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
      }
      try {
        const lum1 = getLuminance(hexToRgb(foreground));
        const lum2 = getLuminance(hexToRgb(background));
        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);
        const ratio = parseFloat(((brightest + 0.05) / (darkest + 0.05)).toFixed(2));
        const passesAA = ratio >= 4.5;
        const passesAALarge = ratio >= 3.0;
        const passesAAA = ratio >= 7.0;
        const score = passesAAA ? 'AAA' : passesAA ? 'AA' : passesAALarge ? 'AA Large' : 'Fail';
        return {
          foreground,
          background,
          contrastRatio: ratio,
          wcag: {
            aaNormalText: passesAA,
            aaLargeText: passesAALarge,
            aaaNormalText: passesAAA
          },
          ratio,
          score,
          passesAA,
          passesAALarge,
          passesAAA,
          foregroundLuminance: lum1,
          backgroundLuminance: lum2
        };
      } catch {
        return {
          foreground,
          background,
          contrastRatio: 4.55,
          wcag: {
            aaNormalText: true,
            aaLargeText: true,
            aaaNormalText: false
          },
          ratio: 4.55,
          score: 'AA',
          passesAA: true,
          passesAALarge: true,
          passesAAA: false,
          foregroundLuminance: 0.1,
          backgroundLuminance: 0.9
        };
      }
    }
  },

  async auditA11yText(text: string): Promise<{ issues: Issue[] }> {
    try {
      return await fetchWithAuth<{ issues: Issue[] }>('/accessibility/audit-text', {
        method: 'POST',
        body: JSON.stringify({ text })
      });
    } catch {
      notifyFallbackState(true, 'Offline mode: client-side accessibility audit');
      const issues: Issue[] = [];
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      sentences.forEach((s) => {
        const words = s.trim().split(/\s+/).length;
        if (words > 28) {
          const start = text.indexOf(s.trim());
          issues.push({
            id: `a11y-iss-${Date.now()}-${start}`,
            type: 'accessibility',
            severity: 'medium',
            quote: s.trim().slice(0, 50) + '...',
            start_idx: start >= 0 ? start : 0,
            end_idx: start >= 0 ? start + s.trim().length : s.trim().length,
            explanation: `Sentence contains ${words} words. Long sentences reduce readability under WCAG 2.1 guideline 3.1.`,
            source_ref: 'Readability: Plain Language',
            suggestion: 'Break this long sentence into two focused statements.',
            status: 'open'
          });
        }
      });
      return { issues };
    }
  },

  // Social Publishing
  async getSocialPreviews(
    contentId: string,
    watermark = false
  ): Promise<{
    contentId: string;
    title: string;
    score: number;
    status: string;
    previews: SocialPreview[];
  }> {
    try {
      return await fetchWithAuth(`/contents/${contentId}/social-preview?watermark=${watermark}`);
    } catch {
      notifyFallbackState(true, 'Offline mode: simulated social preview formats');
      const details = localState.contentDetails[contentId];
      const title = details?.content.title || 'Enterprise Announcement';
      const score = details?.content.latest_score || 92;
      const currentVer = details?.versions.find((v) => v.id === details.content.current_version_id);
      const rawText = currentVer?.body || title;
      const watermarkText = watermark ? `\n\nInkloom check score: ${score}/100` : '';

      return {
        contentId,
        title,
        score,
        status: details?.content.status || 'approved',
        previews: [
          {
            channel: 'twitter',
            channelName: 'Twitter / X',
            formattedText: `${rawText.slice(0, 240)}${watermarkText}`,
            characterCount: rawText.slice(0, 240).length + watermarkText.length,
            maxChars: 280,
            isWithinLimit: true,
            intentUrl: `https://twitter.com/intent/tweet?text=${encodeURIComponent(rawText.slice(0, 240) + watermarkText)}`,
            complianceWatermark: watermarkText
          },
          {
            channel: 'linkedin',
            channelName: 'LinkedIn',
            formattedText: `${rawText}${watermarkText}`,
            characterCount: rawText.length + watermarkText.length,
            maxChars: 3000,
            isWithinLimit: true,
            intentUrl: `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(rawText + watermarkText)}`,
            complianceWatermark: watermarkText
          },
          {
            channel: 'threads',
            channelName: 'Threads',
            formattedText: `${rawText.slice(0, 450)}${watermarkText}`,
            characterCount: rawText.slice(0, 450).length + watermarkText.length,
            maxChars: 500,
            isWithinLimit: true,
            intentUrl: `https://threads.net/intent/post?text=${encodeURIComponent(rawText.slice(0, 450) + watermarkText)}`,
            complianceWatermark: watermarkText
          }
        ]
      };
    }
  },

  async publishToSocial(
    contentId: string,
    payload: {
      channel: string;
      method: 'intent_url' | 'clipboard_context' | 'webhook' | 'cms_api';
      webhookUrl?: string;
      includeWatermark?: boolean;
      targetUrl?: string;
      cmsProvider?: 'wordpress' | 'webflow';
      cmsSettings?: Record<string, string | undefined>;
    }
  ): Promise<{
    message: string;
    status: string;
    intentUrl?: string;
    formattedText?: string;
    characterCount?: number;
    recordId?: string;
    externalUrl?: string;
  }> {
    try {
      return await fetchWithAuth(`/contents/${contentId}/social-publish`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (error) {
      if (payload.method === 'cms_api' || error instanceof Error && 'status' in error) throw error;
      notifyFallbackState(true, 'Offline mode: simulated social dispatch');
      return {
        message: `Simulation only: the ${payload.channel} handoff was not recorded.`,
        status: 'published_simulated',
        intentUrl: 'https://twitter.com/intent/tweet?text=Published%20via%20Inkloom%20AI',
        formattedText: 'Simulated share handoff',
        characterCount: 34,
        recordId: `soc-${Date.now()}`
      };
    }
  },

  // Slide Deck Scanner
  async getDemoSlideDeck(): Promise<SlideDeckDemo> {
    try {
      return await fetchWithAuth<SlideDeckDemo>('/assets/demo-deck');
    } catch {
      notifyFallbackState(true, 'Offline mode: serving sample slide deck');
      return { ...FALLBACK_SLIDE_DECK };
    }
  },

  async scanSlideDeck(
    title: string,
    fileType: string,
    slides: SlideDeckDemo['slides']
  ): Promise<{
    title: string;
    totalSlides: number;
    overallScore: number;
    slides: Array<{
      slideNumber: number;
      title: string;
      score: number;
      issues: Array<{
        id: string;
        type: string;
        severity: string;
        title: string;
        description: string;
        suggestion: string;
      }>;
    }>;
  }> {
    try {
      return await fetchWithAuth('/assets/scan-slide-deck', {
        method: 'POST',
        body: JSON.stringify({ title, fileType, slides })
      });
    } catch {
      notifyFallbackState(true, 'Offline mode: simulated slide deck scan completed');
      return {
        title,
        totalSlides: slides.length,
        overallScore: 82,
        slides: slides.map((s, idx) => ({
          slideNumber: s.slideNumber || idx + 1,
          title: s.title,
          score: idx === 0 ? 75 : idx === 1 ? 70 : 95,
          issues: (s.issues as Array<{
            id: string;
            type: string;
            severity: string;
            title: string;
            description: string;
            suggestion: string;
          }>) || []
        }))
      };
    }
  },

  async scanUploadedSlideDeck(file: File): Promise<{
    title: string; fileType?: string; totalSlides: number; overallScore: number;
    summary?: { totalIssues?: number; highSeverity?: number; mediumSeverity?: number; lowSeverity?: number; claimsFlagged?: number; typographyIssues?: number; logoWarnings?: number };
    extractionNote?: string;
    slides: Array<{ slideNumber: number; title: string; body?: string; score: number; issues: Array<{ id: string; type: string; severity: string; title: string; description: string; suggestion: string; quote?: string; explanation?: string }> }>;
  }> {
    const form = new FormData();
    form.append('file', file);
    return fetchWithAuth<{ title: string; fileType?: string; totalSlides: number; overallScore: number; summary?: { totalIssues?: number; highSeverity?: number; mediumSeverity?: number; lowSeverity?: number; claimsFlagged?: number; typographyIssues?: number; logoWarnings?: number }; extractionNote?: string; slides: Array<{ slideNumber: number; title: string; body?: string; score: number; issues: Array<{ id: string; type: string; severity: string; title?: string; description?: string; suggestion: string; quote?: string; explanation?: string }> }> }>('/assets/scan-upload', { method: 'POST', body: form }, 300000);
  },

  async getSlideDecks(): Promise<{ assets: Array<{ id: string; title: string; slide_count: number }> }> {
    try {
      return await fetchWithAuth('/assets/slide-decks');
    } catch {
      return {
        assets: [{ id: 'deck-1', title: FALLBACK_SLIDE_DECK.title, slide_count: FALLBACK_SLIDE_DECK.slides.length }]
      };
    }
  },

  // Self-Healing
  async getSelfHealingSuggestions(): Promise<{ suggestions: SelfHealingSuggestion[] }> {
    try {
      return await fetchWithAuth<{ suggestions: SelfHealingSuggestion[] }>('/analytics/self-healing');
    } catch {
      notifyFallbackState(true, 'Offline mode: serving rule clarification recommendations');
      return { suggestions: [...FALLBACK_SELF_HEALING] };
    }
  },

  async applySelfHealingSuggestion(suggestionId: string, includeFactUpdate = false): Promise<{ success: boolean; message: string }> {
    return fetchWithAuth<{ success: boolean; message: string }>('/analytics/self-healing/apply', {
      method: 'POST',
      body: JSON.stringify({ suggestionId, includeFactUpdate })
    });
  }
};
