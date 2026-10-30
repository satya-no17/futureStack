'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/authContext';
import { api, ContentItem, ContentDetails, Issue } from '../lib/api';
import { Header, ActiveTab } from '../components/Header';
import { ScoreBadge } from '../components/ScoreBadge';
import { HighlightedText } from '../components/HighlightedText';
import { IssueCard } from '../components/IssueCard';
import { DiffView } from '../components/DiffView';
import { CommentThread } from '../components/CommentThread';
import { ContrastCheckerModal } from '../components/ContrastCheckerModal';
import { MultiTenantDemo } from '../components/MultiTenantDemo';
import { LoginScreen } from '../components/LoginScreen';
import { LandingPage } from '../components/LandingPage';
import { SocialPublishModal } from '../components/SocialPublishModal';
import { SlideDeckScanner } from '../components/SlideDeckScanner';
import { SelfHealingCard } from '../components/SelfHealingCard';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { FallbackBanner } from '../components/FallbackBanner';
import { QuickStartModal } from '../components/QuickStartModal';
import { OnboardingWalkthrough } from '../components/OnboardingWalkthrough';
import { HelperTooltip } from '../components/HelperTooltip';
import {
  GuidelineItem,
  BrandFactItem,
  BannedTermItem,
  AnalyticsData,
  AuditLogEntry,
  ApprovalQueueItem
} from '../lib/fallbackData';
import {
  Sparkles,
  Plus,
  Send,
  CheckCircle,
  Trash2,
  Search,
  AlertTriangle,
  History,
  Share2,
  Loader2,
  Upload
} from 'lucide-react';

function parseAvoidList(source: string): Array<{ term: string; preferred_replacement: string; reason: string; severity: string }> {
  const lines = source.split(/\r?\n/).filter((line) => line.trim() && !line.trim().startsWith('#'));
  if (!lines.length) return [];
  const delimiter = lines.some((line) => line.includes('\t')) ? '\t' : ',';
  const cells = (line: string) => {
    const output: string[] = [];
    let value = ''; let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && line[i + 1] === '"' && quoted) { value += '"'; i++; }
      else if (char === '"') quoted = !quoted;
      else if (char === delimiter && !quoted) { output.push(value.trim()); value = ''; }
      else value += char;
    }
    output.push(value.trim());
    return output;
  };
  const first = cells(lines[0]).map((cell) => cell.toLowerCase().replace(/[ _-]/g, ''));
  const hasHeader = ['term', 'word', 'phrase', 'avoid'].includes(first[0]);
  const header = hasHeader ? first : ['term', 'replacement', 'reason', 'severity'];
  return lines.slice(hasHeader ? 1 : 0).map((line) => {
    const row = cells(line);
    const get = (...keys: string[]) => { const index = keys.map((key) => header.indexOf(key)).find((value) => value >= 0); return index === undefined ? '' : row[index] || ''; };
    const severity = get('severity').toLowerCase();
    return { term: get('term', 'word', 'phrase', 'avoid'), preferred_replacement: get('replacement', 'preferredreplacement', 'preferred'), reason: get('reason'), severity: ['high', 'medium', 'low'].includes(severity) ? severity : 'high' };
  }).filter((entry) => !!entry.term.trim());
}

export default function AppHome() {
  const { user, organization, loading: authLoading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  const isSolo = user?.role === 'solo' || organization?.type === 'solo';

  const [activeTab, setActiveTab] = useState<ActiveTab>('studio');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [contentDetails, setContentDetails] = useState<ContentDetails | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState<boolean>(false);
  const [isUpdatingIssue, setIsUpdatingIssue] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingContentId, setLoadingContentId] = useState<string | null>(null);
  const [loadingTab, setLoadingTab] = useState<ActiveTab | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const detailRequestRef = useRef(0);
  const tabRequestRef = useRef(0);
  const busyActionsRef = useRef(new Set<string>());

  useEffect(() => {
    setSidebarCollapsed(window.localStorage.getItem('inkloom-sidebar-collapsed') === 'true');
  }, []);

  function toggleSidebar() {
    setSidebarCollapsed((collapsed) => {
      const next = !collapsed;
      window.localStorage.setItem('inkloom-sidebar-collapsed', String(next));
      return next;
    });
  }

  useEffect(() => {
    if (!notice || notice.type !== 'success') return;
    const timeout = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  // Button loading states to prevent double-clicks and display immediate animations
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [isAddingTerm, setIsAddingTerm] = useState(false);
  const [deletingTermId, setDeletingTermId] = useState<string | null>(null);

  // Resilience & Fallback Banner State
  const [fallbackActive, setFallbackActive] = useState<boolean>(false);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(false);

  // Quick-Start Guide Modal state
  const [isQuickStartOpen, setIsQuickStartOpen] = useState(false);

  // New Draft Modal state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newChannel, setNewChannel] = useState('LinkedIn');
  const [newBody, setNewBody] = useState(
    'Our app is the #1 fastest tool, guaranteed! Trusted by millions with cheap rates.'
  );

  // Editable body in editor
  const [editorBody, setEditorBody] = useState('');

  // Queue state
  const [approvalQueue, setApprovalQueue] = useState<ApprovalQueueItem[]>([]);
  const [decisionModal, setDecisionModal] = useState<{ open: boolean; type: 'approved' | 'changes_requested' | 'rejected'; note: string }>({
    open: false,
    type: 'approved',
    note: ''
  });
  const [isSocialPublishOpen, setIsSocialPublishOpen] = useState(false);

  // Brand Rules & Facts state
  const [guidelines, setGuidelines] = useState<GuidelineItem[]>([]);
  const [facts, setFacts] = useState<BrandFactItem[]>([]);
  const [bannedTerms, setBannedTerms] = useState<BannedTermItem[]>([]);
  const [newBannedTerm, setNewBannedTerm] = useState({ term: '', rep: '', reason: '', severity: 'high' });
  const [quickAvoidTerm, setQuickAvoidTerm] = useState('');
  const [isAddingQuickAvoidTerm, setIsAddingQuickAvoidTerm] = useState(false);
  const [avoidListText, setAvoidListText] = useState('');
  const [isImportingTerms, setIsImportingTerms] = useState(false);

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [aiError, setAiError] = useState<string | null>(null);

  function beginAction(key: string) {
    if (busyActionsRef.current.has(key)) return false;
    busyActionsRef.current.add(key);
    return true;
  }

  function endAction(key: string) {
    busyActionsRef.current.delete(key);
  }

  async function loadContentDetails(id: string) {
    const requestId = ++detailRequestRef.current;
    setLoadingContentId(id);
    try {
      const details = await api.getContent(id);
      if (requestId !== detailRequestRef.current) return;
      setSelectedContentId(id);
      setContentDetails(details);
      if (details.latestReview?.status === 'failed' || details.latestReview?.error_message) {
        setAiError('Language and claim checks did not finish. Retry the check when the service is available.');
      } else {
        setAiError(null);
      }
      const currentVer = details.versions.find(v => v.id === details.content.current_version_id);
      setEditorBody(currentVer ? currentVer.body : '');
      if (details.issues.length > 0) {
        setSelectedIssueId(details.issues[0].id);
      }
    } catch {
      if (requestId === detailRequestRef.current) {
        setNotice({ type: 'error', text: 'Could not load this draft. Check your connection and try again.' });
      }
    } finally {
      if (requestId === detailRequestRef.current) setLoadingContentId(null);
    }
  }

  async function loadInitialData() {
    setIsLoading(true);
    setSelectedContentId(null);
    setContentDetails(null);
    setSelectedIssueId(null);
    setAiError(null);
    try {
      const contentsRes = await api.getContents();
      let queue: ApprovalQueueItem[] = [];
      if (user?.role === 'reviewer' || user?.role === 'admin') {
        const queueRes = await api.getApprovalsQueue();
        queue = queueRes.queue;
      }
      setContents(contentsRes.contents || []);
      setApprovalQueue(queue);

      if (contentsRes.contents && contentsRes.contents.length > 0) {
        const firstId = contentsRes.contents[0].id;
        await loadContentDetails(firstId);
      } else {
        setSelectedContentId(null);
        setContentDetails(null);
      }
    } catch (err) {
      setNotice({ type: 'error', text: 'Workspace data could not be loaded. Check your connection and try again.' });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const unsubscribe = api.subscribeToFallbackState((active) => {
      setFallbackActive(active);
      setIsSimulated(api.isSimulatedFailureActive());
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user && organization) {
      queueMicrotask(() => {
        loadInitialData();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, organization?.id]);

  useEffect(() => {
    if (isSolo && activeTab === 'approvals') {
      setActiveTab('studio');
    }
  }, [isSolo, activeTab]);

  // Global Escape key listener for open modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isNewModalOpen) setIsNewModalOpen(false);
        if (decisionModal.open) setDecisionModal({ open: false, type: 'approved', note: '' });
        if (isQuickStartOpen) setIsQuickStartOpen(false);
        if (isSocialPublishOpen) setIsSocialPublishOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNewModalOpen, decisionModal.open, isQuickStartOpen, isSocialPublishOpen]);

  // Trigger Review
  async function handleRunReview(bodyOverride?: string, versionAlreadySaved = false) {
    if (!selectedContentId || !contentDetails) return;
    if (!beginAction('review')) return;
    setIsReviewing(true);
    setAiError(null);

    try {
      // Save current editor body as a new version if modified
      const currentVer = contentDetails.versions.find(v => v.id === contentDetails.content.current_version_id);
      const reviewBody = bodyOverride ?? editorBody;
      if (!versionAlreadySaved && currentVer && currentVer.body.trim() !== reviewBody.trim()) {
        await api.createNewVersion(selectedContentId, reviewBody);
      }

      const { reviewId } = await api.triggerReview(selectedContentId);

      // Poll for review completion
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        try {
          const res = await api.getReview(reviewId);
          if (res.review.status === 'done' || res.review.status === 'failed' || attempts > 20) {
            clearInterval(interval);
            setIsReviewing(false);
            if (res.review.status === 'failed' || res.review.error_message) {
              setAiError('Language and claim checks did not finish. Retry the check when the service is available.');
              setNotice({ type: 'error', text: 'The review did not finish. Retry the check when the service is available.' });
            } else if (attempts > 20) {
              setAiError('The review is taking longer than expected.');
              setNotice({ type: 'error', text: 'The review is taking longer than expected. Your draft is saved; retry the check in a moment.' });
            } else {
              setNotice({ type: 'success', text: 'Review complete. Findings and score are up to date.' });
            }
            // Refresh content details
            await loadContentDetails(selectedContentId);
            // Refresh list
            const updated = await api.getContents();
            setContents(updated.contents);
            endAction('review');
          }
        } catch {
          clearInterval(interval);
          setIsReviewing(false);
          setAiError('The review status could not be loaded. Retry the check.');
          setNotice({ type: 'error', text: 'The review status could not be loaded. Your draft is safe; try the check again.' });
          endAction('review');
        }
      }, 600);
    } catch (err: unknown) {
      console.warn('Review failed:', err);
      setIsReviewing(false);
      setAiError('The review could not start. Your draft is still available; try again.');
      setNotice({ type: 'error', text: 'The review could not start. Your draft is still available; try again.' });
      endAction('review');
    }
  }

  // 1-Click Accept Fix
  async function handleAcceptIssue(issue: Issue, customSuggestion?: string) {
    if (!selectedContentId || !contentDetails) return;
    const replacement = customSuggestion || issue.suggestion;
    if (!replacement) return;
    const oldQuote = issue.quote;
    if (!editorBody.includes(oldQuote)) {
      setNotice({ type: 'error', text: 'This flagged text has changed. Refresh the draft before applying this fix.' });
      return;
    }
    if (!beginAction(`issue:${issue.id}`)) return;
    setIsUpdatingIssue(true);

    // Apply replacement to editor body
    const newBody = editorBody.replace(oldQuote, replacement);

    try {
      // Save the edited copy before marking the finding as resolved.
      await api.createNewVersion(selectedContentId, newBody);
      setEditorBody(newBody);
      await api.patchIssue(issue.id, { status: 'accepted', suggestion: replacement });

      // 3. Automatically trigger re-review to calculate updated score
      setEditorBody(newBody);
      setNotice({ type: 'success', text: 'Fix applied. Checking the updated draft now.' });
      await handleRunReview(newBody, true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Please try again.';
      setNotice({ type: 'error', text: `Could not apply this fix: ${message}` });
    } finally {
      setIsUpdatingIssue(false);
      endAction(`issue:${issue.id}`);
    }
  }

  // Dismiss / Skip Issue
  async function handleDismissIssue(issueId: string, reason: string) {
    if (!beginAction(`issue:${issueId}`)) return;
    setIsUpdatingIssue(true);
    try {
      const res = await api.patchIssue(issueId, { status: 'dismissed', dismiss_reason: reason });
      // Update local issue status and score
      if (contentDetails) {
        const updatedIssues = contentDetails.issues.map(i =>
          i.id === issueId ? { ...i, status: 'dismissed' as const, dismiss_reason: reason } : i
        );
        setContentDetails({
          ...contentDetails,
          issues: updatedIssues,
          content: { ...contentDetails.content, latest_score: res.newScore }
        });
      }
      setNotice({ type: 'success', text: 'Finding skipped and recorded for the review history.' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Please try again.';
      setNotice({ type: 'error', text: `Could not skip this finding: ${message}` });
    } finally {
      setIsUpdatingIssue(false);
      endAction(`issue:${issueId}`);
    }
  }

  // Submit Content for Approval
  async function handleSubmitForApproval() {
    if (!selectedContentId || isSubmittingApproval || !beginAction('approval')) return;
    setIsSubmittingApproval(true);
    try {
      await api.submitForApproval(selectedContentId);
      await loadContentDetails(selectedContentId);
      const list = await api.getContents();
      setContents(list.contents);
      setNotice({ type: 'success', text: 'Draft sent for review.' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setNotice({ type: 'error', text: `Could not send draft for review: ${msg}` });
    } finally {
      setIsSubmittingApproval(false);
      endAction('approval');
    }
  }

  // Reviewer Decision
  async function handleReviewerDecision() {
    if (!selectedContentId || isSubmittingDecision || !beginAction('decision')) return;
    setIsSubmittingDecision(true);
    try {
      await api.submitDecision(selectedContentId, decisionModal.type, decisionModal.note);
      setDecisionModal({ open: false, type: 'approved', note: '' });
      await loadContentDetails(selectedContentId);
      const [list, queue] = await Promise.all([api.getContents(), api.getApprovalsQueue()]);
      setContents(list.contents);
      setApprovalQueue(queue.queue);
      setNotice({ type: 'success', text: 'Review decision saved.' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setNotice({ type: 'error', text: `Could not save the review decision: ${msg}` });
    } finally {
      setIsSubmittingDecision(false);
      endAction('decision');
    }
  }

  // Save manual text edit without re-running full scan immediately
  async function handleSaveManualDraft() {
    if (!selectedContentId || !contentDetails || isSavingDraft || !beginAction('save')) return;
    setIsSavingDraft(true);
    try {
      await api.createNewVersion(selectedContentId, editorBody);
      await loadContentDetails(selectedContentId);
      setNotice({ type: 'success', text: 'Draft changes saved.' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Please try again.';
      setNotice({ type: 'error', text: `Could not save changes: ${message}` });
    } finally {
      setIsSavingDraft(false);
      endAction('save');
    }
  }

  // Add Comment
  async function handleAddComment(body: string) {
    if (!selectedContentId || !contentDetails) return;
    const currentVer = contentDetails.versions.find(v => v.id === contentDetails.content.current_version_id);
    if (!currentVer) return;

    try {
      await api.addComment(selectedContentId, currentVer.id, body);
      await loadContentDetails(selectedContentId);
      setNotice({ type: 'success', text: 'Comment added.' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Please try again.';
      setNotice({ type: 'error', text: `Could not add your comment: ${message}` });
      throw err;
    }
  }

  // Create New Content
  async function handleCreateNewContent(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim() || isCreatingDraft || !beginAction('create')) return;
    setIsCreatingDraft(true);

    try {
      const res = await api.createContent(newTitle.trim(), newChannel, newBody.trim());
      setIsNewModalOpen(false);
      setNewTitle('');
      setNewBody('');

      const updated = await api.getContents();
      setContents(updated.contents);
      await loadContentDetails(res.content.id);
      setActiveTab('studio');
      setNotice({ type: 'success', text: 'Draft created.' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setNotice({ type: 'error', text: `Could not create the draft: ${message}` });
    } finally {
      setIsCreatingDraft(false);
      endAction('create');
    }
  }

  // Safe Tab Load Handlers with Zero Unhandled Rejections
  async function handleTabChange(tab: ActiveTab) {
    const requestId = ++tabRequestRef.current;
    setActiveTab(tab);
    setLoadingTab(tab);
    try {
      if (tab === 'governance') {
        const [gRes, fRes, bRes] = await Promise.all([
          api.getGuidelines(),
          api.getFacts(),
          api.getBannedTerms()
        ]);
        if (requestId !== tabRequestRef.current) return;
        setGuidelines(gRes.guidelines || []);
        setFacts(fRes.facts || []);
        setBannedTerms(bRes.bannedTerms || []);
      } else if (tab === 'analytics') {
        const aRes = await api.getAnalytics();
        if (requestId !== tabRequestRef.current) return;
        setAnalyticsData(aRes);
      } else if (tab === 'audit') {
        const audRes = await api.getAuditLogs();
        if (requestId !== tabRequestRef.current) return;
        setAuditLogs(audRes.logs || []);
      } else if (tab === 'approvals') {
        const qRes = await api.getApprovalsQueue();
        if (requestId !== tabRequestRef.current) return;
        setApprovalQueue(qRes.queue || []);
      }
    } catch {
      if (requestId === tabRequestRef.current) setNotice({ type: 'error', text: `Could not load ${tab} data. Try switching back or retrying.` });
    } finally {
      if (requestId === tabRequestRef.current) setLoadingTab(null);
    }
  }

  // Handle retry from FallbackBanner
  async function handleRetryConnection(): Promise<boolean> {
    const connected = await api.testConnection();
    if (connected) {
      setIsBannerDismissed(false);
      await loadInitialData();
      await handleTabChange(activeTab);
    } else {
      await loadInitialData();
      await handleTabChange(activeTab);
      setNotice({ type: 'error', text: 'Still offline. Cached or sample data is shown where available; retry when your connection returns.' });
    }
    return connected;
  }

  const statusLabels: Record<string, string> = {
    draft: 'Draft',
    in_review: 'Checking...',
    submitted: isSolo ? 'Submitted' : 'Waiting for review',
    approved: 'Approved',
    changes_requested: 'Changes Needed',
    published: 'Published'
  };

  const filteredContents = contents.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChannel = channelFilter === 'ALL' || c.channel === channelFilter;
    return matchesSearch && matchesChannel;
  });

  const currentVersion = contentDetails?.versions.find(v => v.id === contentDetails.content.current_version_id);
  const getNewAvoidEntries = () => {
    const parsed = parseAvoidList(avoidListText);
    const seen = new Set(bannedTerms.map((item) => item.term.trim().toLocaleLowerCase()));
    return parsed.filter((item) => {
      const key = item.term.trim().toLocaleLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };
  const avoidEntriesToImport = getNewAvoidEntries();
  const parsedAvoidEntriesCount = parseAvoidList(avoidListText).length;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
          <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    if (showLogin) {
      return <LoginScreen onBack={() => setShowLogin(false)} />;
    }
    return <LandingPage onGetStarted={() => setShowLogin(true)} />;
  }

  return (
    <div className="app-dashboard min-h-screen bg-gray-50/50 text-gray-900 selection:bg-violet-200">
      {/* Universal Header with Navigation & Profile */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        pendingApprovalsCount={approvalQueue.length}
        onOpenQuickStart={() => setIsQuickStartOpen(true)}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={toggleSidebar}
      />

      {/* Visible Offline & Simulation Notice Banner */}
      {fallbackActive && !isBannerDismissed && (
        <div className={`transition-[margin] duration-200 ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
          <FallbackBanner
            isSimulated={isSimulated}
            onDismiss={() => setIsBannerDismissed(true)}
            onRetry={handleRetryConnection}
          />
        </div>
      )}

      {/* Main Content Area */}
      <main className={`min-w-0 w-full max-w-7xl px-4 py-6 transition-[margin,width] duration-200 sm:px-5 sm:py-8 md:px-8 ${sidebarCollapsed ? 'md:ml-20 md:w-[calc(100%-5rem)]' : 'md:ml-64 md:w-[calc(100%-16rem)]'}`}>
        {notice && (
          <div role={notice.type === 'error' ? 'alert' : 'status'} aria-live={notice.type === 'error' ? 'assertive' : 'polite'} className={`mb-6 flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-sm ${notice.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-900' : 'border-violet-200 bg-violet-50 text-violet-950'}`}>
            <span>{notice.text}</span>
            <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss message" className="shrink-0 font-medium opacity-70 hover:opacity-100">Dismiss</button>
          </div>
        )}
        {loadingTab && <div role="status" aria-live="polite" className="mb-4 flex items-center gap-2 text-sm text-gray-600"><Loader2 className="h-4 w-4 animate-spin text-violet-700" />Loading {loadingTab === 'governance' ? 'brand setup' : loadingTab}…</div>}
        <ErrorBoundary
          fallbackTitle="This section could not load"
          fallbackDescription="This section could not load. Try again or return to another workspace section."
          onReset={() => handleTabChange(activeTab)}
        >
        
        {/* ========================================================= */}
        {/* TAB 1: DRAFTS & SCANNER STUDIO                            */}
        {/* ========================================================= */}
        {activeTab === 'studio' && (
          <div className="space-y-8">
            {/* Plain-Language 3-Step Walkthrough Banner */}
            <OnboardingWalkthrough
              onOpenQuickStart={() => setIsQuickStartOpen(true)}
            />

            {/* Top Action Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search drafts by title..."
                    aria-label="Search drafts by title"
                    className="pl-9 pr-4 py-2 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-violet-500 shadow-sm"
                  />
                </div>

                <select
                  value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value)}
                  aria-label="Filter drafts by channel"
                  className="px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-violet-500 shadow-sm"
                >
                  <option value="ALL">All Places</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Twitter / X">Twitter / X</option>
                  <option value="Blog">Blog</option>
                  <option value="Press Release">Press Release</option>
                  <option value="Email Newsletter">Email Newsletter</option>
                </select>
              </div>

              <button
                onClick={() => setIsNewModalOpen(true)}
                aria-label="Create new draft"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                New Draft
              </button>
            </div>

            {/* Split Screen Layout: Left Sidebar Drafts List | Right Studio Editor */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Drafts Sidebar */}
              <div className="lg:col-span-4 space-y-3">
                <div className="flex items-center justify-between text-sm font-semibold text-gray-700 px-1">
                  <span>Drafts <span className="font-normal text-gray-500">({filteredContents.length})</span></span>
                </div>

                <div className="space-y-2.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                  {isLoading ? (
                    <div role="status" className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-600"><Loader2 className="mr-2 inline h-4 w-4 animate-spin text-violet-700" />Loading drafts…</div>
                  ) : filteredContents.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm leading-6 text-gray-600">
                      {contents.length === 0 ? 'No drafts yet. Create one to begin a review.' : 'No drafts match these filters. Try a different search or channel.'}
                    </div>
                  ) : filteredContents.map((c) => {
                    const isSelected = c.id === selectedContentId;
                    const selectionBlocked = Boolean(loadingContentId || isReviewing || isSavingDraft || isUpdatingIssue);
                    return (
                      <div
                        key={c.id}
                        tabIndex={selectionBlocked ? -1 : 0}
                        role="button"
                        aria-disabled={selectionBlocked}
                        aria-label={`Select draft: ${c.title}`}
                        onClick={() => { if (!selectionBlocked) void loadContentDetails(c.id); }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            if (!selectionBlocked) void loadContentDetails(c.id);
                          }
                        }}
                        className={`p-5 rounded-xl border transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 ${selectionBlocked ? 'cursor-wait opacity-70' : ''} ${
                          isSelected
                            ? 'bg-violet-50/50 border-violet-400 shadow-sm ring-1 ring-violet-400/20'
                            : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h4 className="font-semibold text-sm text-gray-900 line-clamp-1">{c.title}</h4>
                          {loadingContentId === c.id && <Loader2 aria-label="Loading draft" className="h-4 w-4 animate-spin text-violet-700" />}
                          {isSelected && (contentDetails?.latestReview?.status !== 'done' || Boolean(contentDetails?.latestReview?.error_message)) ? (
                            <span className="whitespace-nowrap text-[11px] font-medium text-gray-500">
                              {contentDetails?.latestReview ? 'Check incomplete' : 'Not checked'}
                            </span>
                          ) : <ScoreBadge score={c.latest_score} size="sm" showLabel={false} />}
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-gray-100 border border-gray-200 text-[10px] font-semibold text-gray-600">
                              {c.channel}
                            </span>
                            <span className="text-[11px] font-medium text-violet-700">
                              {statusLabels[c.status] || c.status}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-500">v{c.current_version_no || 1}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Main Studio Editor & AI Results Split */}
              <div className="lg:col-span-8 space-y-6">
                {loadingContentId ? (
                  <div role="status" aria-live="polite" className="flex min-h-48 items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-600">
                    <Loader2 className="h-5 w-5 animate-spin text-violet-700" /> Opening draft…
                  </div>
                ) : isLoading ? (
                  <div role="status" className="flex min-h-48 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-600"><Loader2 className="h-4 w-4 animate-spin text-violet-700" />Loading your workspace…</div>
                ) : contentDetails ? (
                  <div className="space-y-6">
                    {/* Header Panel */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                            <span className="px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100 text-[10px] font-bold">
                              {contentDetails.content.channel}
                            </span>
                            <span>•</span>
                            <span className="font-medium text-gray-700">
                              Status: {statusLabels[contentDetails.content.status] || contentDetails.content.status}
                            </span>
                            <span>•</span>
                            <span>Version {currentVersion?.version_no || 1}</span>
                          </div>
                          <h1 className="text-xl font-semibold tracking-tight text-gray-950">{contentDetails.content.title}</h1>
                        </div>

                        {/* Top Score Badge */}
                        {contentDetails.latestReview?.status === 'done' && !contentDetails.latestReview.error_message ? (
                          <ScoreBadge score={contentDetails.latestReview.score} size="lg" />
                        ) : (
                          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600">
                            {contentDetails.latestReview ? 'Check incomplete' : 'Not checked yet'}
                          </div>
                        )}
                      </div>

                      {/* Action Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={handleRunReview}
                            disabled={isReviewing}
                            aria-busy={isReviewing}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isReviewing ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Checking draft…</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4" />
                                <span>Check draft</span>
                              </>
                            )}
                          </button>

                          {(contentDetails.latestReview?.status === 'failed' || aiError) && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                              AI checks unavailable
                            </span>
                          )}

                          {/* Team / Enterprise Draft: Send for Review */}
                          {!isSolo && contentDetails.content.status !== 'published' && (
                            <button
                              type="button"
                              onClick={handleSubmitForApproval}
                              disabled={isSubmittingApproval}
                              aria-busy={isSubmittingApproval}
                              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isSubmittingApproval ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>Sending for Review...</span>
                                </>
                              ) : (
                                <>
                                  <Send className="w-4 h-4" />
                                  <span>Send for Review</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* External sharing is a handoff; the destination confirms the actual post. */}
                          {isSolo && contentDetails.content.status !== 'published' && (
                            <button type="button" onClick={() => setIsSocialPublishOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-800">
                              <Share2 className="h-4 w-4" /><span>Share this draft</span>
                            </button>
                          )}
                        </div>

                        {/* Reviewer / Admin Quick Actions (Strictly for Team/Enterprise Workspaces) */}
                        {!isSolo && (user?.role === 'reviewer' || user?.role === 'admin') && (
                          <div className="flex items-center gap-2">
                            {contentDetails.content.status === 'submitted' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setDecisionModal({ open: true, type: 'approved', note: '' })}
                                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDecisionModal({ open: true, type: 'changes_requested', note: '' })}
                                  className="px-4 py-2 rounded-xl bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-xs font-bold transition shadow-sm"
                                >
                                  Ask for Changes
                                </button>
                              </>
                            )}

                            {contentDetails.content.status === 'approved' && (
                              <button
                                type="button"
                                onClick={() => setIsSocialPublishOpen(true)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold transition shadow-sm shadow-violet-200"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                                Share or publish
                              </button>
                            )}
                          </div>
                        )}

                        {/* Published State: Re-share across social channels */}
                        {contentDetails.content.status === 'published' && (
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold inline-flex items-center gap-1.5">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Published
                            </span>
                            <button
                              type="button"
                              onClick={() => setIsSocialPublishOpen(true)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-xs font-bold transition shadow-sm"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              Share & Formats
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* AI Not Responded Alert Banner */}
                    {(contentDetails.latestReview?.status === 'failed' || aiError) && (
                      <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center flex-shrink-0 text-sm font-bold mt-0.5 sm:mt-0">
                            ⚠️
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold text-amber-950">Some checks are unavailable</h4>
                              <span className="px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-900 text-[10px] font-bold uppercase tracking-wide">
                                Rule checks only
                              </span>
                            </div>
                            <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                              The language and claim checks did not finish. The completed rule and readability checks remain available. Retry when the service is ready.
                            </p>
                            {aiError && (
                              <div className="mt-1 text-[11px] font-mono text-amber-900/80 bg-amber-100/60 px-2 py-0.5 rounded">
                                {aiError}
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleRunReview}
                          disabled={isReviewing}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-sm whitespace-nowrap self-end sm:self-center disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                        >
                          {isReviewing ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Checking...</span>
                            </>
                          ) : (
                            <span>Retry AI Check</span>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Split View: Left Highlighted Text / Right Issue Cards */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                      
                      {/* Left Side: Draft Editor & Visual Highlighted Copy */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs font-bold text-gray-600">
                          <span>Draft text</span>
                          <span className="text-[11px] text-gray-500 font-mono">
                            {editorBody.length} characters • {editorBody.split(/\s+/).filter(Boolean).length} words
                          </span>
                        </div>

                        {/* Interactive Highlight Component */}
                        <HighlightedText
                          body={editorBody}
                          issues={contentDetails.issues}
                          selectedIssueId={selectedIssueId}
                          onSelectIssue={(id) => setSelectedIssueId(id)}
                        />

                        {/* Editable Textarea for tweaking */}
                        {contentDetails.content.status !== 'published' && (
                          <div className="space-y-2 pt-2">
                            <div className="flex items-center justify-between">
                              <label className="block text-xs font-semibold text-gray-600">
                                Edit draft text
                              </label>
                              <button
                                type="button"
                                onClick={handleSaveManualDraft}
                                disabled={isSavingDraft}
                                aria-busy={isSavingDraft}
                                className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                              >
                                {isSavingDraft ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>Saving...</span>
                                  </>
                                ) : (
                                  <span>Save Edits</span>
                                )}
                              </button>
                            </div>
                            <textarea
                              rows={5}
                              value={editorBody}
                              onChange={(e) => setEditorBody(e.target.value)}
                              className="w-full p-4 rounded-2xl bg-white border border-gray-300 font-mono text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-violet-500 leading-relaxed shadow-sm"
                            />
                          </div>
                        )}

                        {/* Team Notes & Comments */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                          <CommentThread
                            comments={contentDetails.comments}
                            currentVersionId={currentVersion?.id || ''}
                            onAddComment={handleAddComment}
                          />
                        </div>
                      </div>

                      {/* Right Side: Issue Cards and Intent-Preserving Fixes */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs font-bold text-gray-600">
                          <span>What to Fix ({contentDetails.issues.filter(i => i.status === 'open').length} open)</span>
                          <span className="text-[11px] text-violet-600 font-medium">Click a fix to apply it directly</span>
                        </div>

                        {/* AI Not Responded Card in Issue Column */}
                        {(contentDetails.latestReview?.status === 'failed' || aiError) && (
                          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2 shadow-sm">
                            <div className="flex items-center justify-between">
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-bold">
                                AI Status
                              </span>
                              <span className="text-[11px] font-medium text-amber-700">Tone & claims skipped</span>
                            </div>
                            <h4 className="font-semibold text-xs text-amber-950">Some checks are unavailable</h4>
                            <p className="text-xs text-amber-800 leading-relaxed">
                              Language and claim checks did not finish. Completed rule and readability findings are still shown.
                            </p>
                          </div>
                        )}

                        {contentDetails.latestReview === null ? (
                          <div className="rounded-xl border border-gray-200 bg-white p-7 text-center">
                            <h3 className="text-base font-semibold text-gray-900">This draft has not been checked yet</h3>
                            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-600">Run a check to compare the draft with your brand rules, approved facts, and readability guidance.</p>
                            <button type="button" onClick={handleRunReview} disabled={isReviewing} className="mt-4 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50">Check draft</button>
                          </div>
                        ) : contentDetails.issues.length === 0 ? (
                          <div className="p-8 rounded-2xl bg-white border border-gray-200 text-center space-y-3 shadow-sm">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                              <CheckCircle className="w-6 h-6" />
                            </div>
                            <h3 className="font-semibold text-gray-900 text-base">{contentDetails.latestReview.status === 'failed' || contentDetails.latestReview.error_message ? 'No findings from completed checks' : 'No findings in this check'}</h3>
                            <p className="text-xs text-gray-500 max-w-sm mx-auto">
                              {contentDetails.latestReview.status === 'failed' || contentDetails.latestReview.error_message
                                ? 'Some checks did not finish. Review the check status and retry before sharing.'
                                : 'The completed checks did not find any issues. Final approval still depends on your review.'}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                            {contentDetails.issues.map((iss) => (
                              <IssueCard
                                key={iss.id}
                                issue={iss}
                                isSelected={iss.id === selectedIssueId}
                                isDisabled={isReviewing || isSavingDraft || isUpdatingIssue}
                                onSelect={() => setSelectedIssueId(iss.id)}
                                onAccept={(suggestion) => handleAcceptIssue(iss, suggestion)}
                                onDismiss={(reason) => handleDismissIssue(iss.id, reason)}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center text-gray-500 shadow-sm">
                    Select a draft from the left or create a new one to start checking.
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: MULTI-MODAL SLIDE DECK SCANNER                       */}
        {/* ========================================================= */}
        {activeTab === 'slides' && (
          <SlideDeckScanner
            onImportToDraft={(title, body) => {
              setNewTitle(title);
              setNewBody(body);
              setIsNewModalOpen(true);
              setActiveTab('studio');
            }}
          />
        )}

        {/* ========================================================= */}
        {/* TAB 2: REVIEW QUEUE & VERSION DIFF                        */}
        {/* ========================================================= */}
        {activeTab === 'approvals' && (
          isSolo ? (
            <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center shadow-sm max-w-xl mx-auto space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg">No approval queue for this workspace</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                As a Solo Creator, you work independently without approval bottlenecks or review queues. You can scan, fix, and publish your content directly from the Drafts &amp; Scanner studio.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('studio')}
                className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition shadow-sm"
              >
                Go to Drafts &amp; Scanner
              </button>
            </div>
          ) : (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-gray-900">Drafts Waiting for Review</h2>
                <p className="text-xs text-gray-500">
                  Review submitted drafts from your team and give feedback or sign off before publishing.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-bold border border-violet-100">
                {approvalQueue.length} Drafts waiting
              </span>
            </div>

            {approvalQueue.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center space-y-3 shadow-sm">
                <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="text-base font-bold text-gray-900">All caught up!</h3>
                <p className="text-xs text-gray-500">All submitted drafts have been reviewed and approved.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {approvalQueue.map((item) => (
                  <div key={item.id} className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                          <span className="font-semibold text-gray-800">{item.author_name}</span>
                          <span>•</span>
                          <span>{item.channel}</span>
                          <span>•</span>
                          <span>Submitted {new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                      </div>

                      <ScoreBadge score={item.latest_score} />
                    </div>

                    {/* Diff against previous version */}
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        See What Changed:
                      </div>
                      <DiffView
                        oldText="Our app is the #1 fastest tool, guaranteed! Trusted by millions of businesses."
                        newText={item.current_body || ''}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => {
                          setSelectedContentId(item.id);
                          setDecisionModal({ open: true, type: 'changes_requested', note: '' });
                        }}
                        className="px-4 py-2 rounded-xl bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-xs font-bold transition shadow-sm"
                      >
                        Ask for Changes
                      </button>
                      <button
                        onClick={() => {
                          setSelectedContentId(item.id);
                          setDecisionModal({ open: true, type: 'approved', note: '' });
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
                      >
                        Approve Draft
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          )
        )}

        {/* ========================================================= */}
        {/* TAB 3: BRAND RULES & APPROVED FACTS                       */}
        {/* ========================================================= */}
        {activeTab === 'governance' && (
          <div className="space-y-8 max-w-6xl mx-auto">
            {/* 1. Words to Avoid Manager */}
            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-gray-900">Words to Avoid</h3>
                  <HelperTooltip
                    term="Words to Avoid"
                    text="Prohibited vocabulary or high-risk claims (e.g. 'cheap' or 'guaranteed') that harm brand reputation or violate advertising standards."
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Words or phrases that should never appear in your marketing copy.
                </p>
              </div>

              {user?.role === 'admin' && <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-gray-900">Add one phrase</h4>
                  <p className="mt-1 text-xs text-gray-600">Add just the restricted word or phrase. You can add a replacement and reason later.</p>
                </div>
                <form className="flex flex-col gap-2 sm:flex-row" onSubmit={async (event) => {
                  event.preventDefault();
                  const term = quickAvoidTerm.trim();
                  if (!term || isAddingQuickAvoidTerm || isAddingTerm) return;
                  if (bannedTerms.some((item) => item.term.trim().toLocaleLowerCase() === term.toLocaleLowerCase())) {
                    setNotice({ type: 'error', text: `“${term}” is already on the avoid list.` });
                    return;
                  }
                  setIsAddingQuickAvoidTerm(true);
                  try {
                    await api.createBannedTerm(term, '', '', 'high');
                    const refreshed = await api.getBannedTerms();
                    setBannedTerms(refreshed.bannedTerms);
                    setQuickAvoidTerm('');
                    setNotice({ type: 'success', text: `“${term}” added to the avoid list.` });
                  } catch (err) {
                    setNotice({ type: 'error', text: `Could not add this phrase: ${err instanceof Error ? err.message : 'Please try again.'}` });
                  } finally {
                    setIsAddingQuickAvoidTerm(false);
                  }
                }}>
                  <input type="text" value={quickAvoidTerm} onChange={(event) => setQuickAvoidTerm(event.target.value)} placeholder="Enter one word or phrase" aria-label="Single phrase to avoid" maxLength={255} disabled={isAddingQuickAvoidTerm || isAddingTerm} className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 disabled:opacity-60" />
                  <button type="submit" disabled={isAddingQuickAvoidTerm || isAddingTerm || !quickAvoidTerm.trim()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50">
                    {isAddingQuickAvoidTerm ? <><Loader2 className="h-4 w-4 animate-spin" />Adding…</> : 'Add phrase'}
                  </button>
                </form>
              </div>}

              {/* Add Term Form */}
              {user?.role === 'admin' && <div className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
                <input
                  type="text"
                  placeholder="Word to avoid (e.g. cheap)"
                  value={newBannedTerm.term}
                  onChange={(e) => setNewBannedTerm({ ...newBannedTerm, term: e.target.value })}
                  className="px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 shadow-sm"
                />
                <input
                  type="text"
                  placeholder="Better word to use"
                  value={newBannedTerm.rep}
                  onChange={(e) => setNewBannedTerm({ ...newBannedTerm, rep: e.target.value })}
                  className="px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 shadow-sm"
                />
                <input
                  type="text"
                  placeholder="Why (e.g. sounds low quality)"
                  value={newBannedTerm.reason}
                  onChange={(e) => setNewBannedTerm({ ...newBannedTerm, reason: e.target.value })}
                  className="px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 shadow-sm md:col-span-2"
                />
                <button
                  type="button"
                  disabled={isAddingTerm || !newBannedTerm.term.trim()}
                  onClick={async () => {
                    if (!newBannedTerm.term || isAddingTerm) return;
                    setIsAddingTerm(true);
                    try {
                      await api.createBannedTerm(newBannedTerm.term, newBannedTerm.rep, newBannedTerm.reason, newBannedTerm.severity);
                      setNewBannedTerm({ term: '', rep: '', reason: '', severity: 'high' });
                      const res = await api.getBannedTerms();
                      setBannedTerms(res.bannedTerms);
                      setNotice({ type: 'success', text: 'Brand term added.' });
                    } catch (err) {
                      const message = err instanceof Error ? err.message : 'Please try again.';
                      setNotice({ type: 'error', text: `Could not add this brand term: ${message}` });
                    } finally {
                      setIsAddingTerm(false);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5"
                >
                  {isAddingTerm ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <span>Add to Avoid List</span>
                  )}
                </button>
              </div>}

              <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5" aria-labelledby="bulk-avoid-title">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div><h4 id="bulk-avoid-title" className="text-sm font-semibold text-gray-900">Add many at once</h4><p className="mt-1 max-w-2xl text-xs leading-5 text-gray-600">Paste one phrase per line, or paste CSV/TSV columns: term, replacement, reason, severity.</p></div>
                  <label className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                    <Upload className="h-3.5 w-3.5" /> Choose text file
                    <input type="file" accept=".txt,.csv,.tsv,text/plain,text/csv,text/tab-separated-values" className="sr-only" onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      try { setAvoidListText(await file.text()); setNotice({ type: 'success', text: `Loaded ${file.name}. Review the entries before importing.` }); }
                      catch { setNotice({ type: 'error', text: `Could not read ${file.name}. Try a plain text, CSV, or TSV file.` }); }
                      event.target.value = '';
                    }} />
                  </label>
                </div>
                {user?.role === 'admin' ? <>
                  <textarea value={avoidListText} onChange={(event) => setAvoidListText(event.target.value)} rows={5} placeholder={'guaranteed\ncheap\nterm,replacement,reason,severity\nworld’s best,leading,Needs approved evidence,high'} className="mt-4 w-full resize-y rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 font-mono text-xs leading-5 text-gray-800 placeholder:text-gray-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100" />
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-gray-500" aria-live="polite">{avoidEntriesToImport.length} ready to add{parsedAvoidEntriesCount > avoidEntriesToImport.length ? ` · ${parsedAvoidEntriesCount - avoidEntriesToImport.length} duplicates will be skipped` : ''}.</p>
                    <button type="button" disabled={isImportingTerms || avoidEntriesToImport.length === 0 || parsedAvoidEntriesCount > 1000} onClick={async () => {
                      if (isImportingTerms) return;
                      const entries = getNewAvoidEntries();
                      const clientSkipped = parsedAvoidEntriesCount - entries.length;
                      setIsImportingTerms(true);
                      try {
                        const result = await api.createBannedTermsBulk(entries);
                        const refreshed = await api.getBannedTerms();
                        setBannedTerms(refreshed.bannedTerms);
                        setAvoidListText('');
                        const skipped = clientSkipped + result.skippedCount;
                        setNotice({ type: 'success', text: `${result.importedCount} phrase${result.importedCount === 1 ? '' : 's'} added${skipped ? `; ${skipped} duplicate${skipped === 1 ? '' : 's'} skipped` : ''}.` });
                      } catch (err) {
                        setNotice({ type: 'error', text: `Could not import the avoid list: ${err instanceof Error ? err.message : 'Please check the file and try again.'}` });
                      } finally { setIsImportingTerms(false); }
                    }} className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50">
                      {isImportingTerms ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Importing…</> : parsedAvoidEntriesCount > 1000 ? 'Limit is 1,000 entries' : 'Import avoid list'}
                    </button>
                  </div>
                </> : <p className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">Ask a Brand Lead to add or import avoid-list phrases.</p>}
              </section>

              {/* List */}
              <div className="divide-y divide-gray-100">
                {bannedTerms.length === 0 ? (
                  <div className="py-6 text-center text-xs text-gray-500">
                    No words to avoid added yet. Add your first restricted word above.
                  </div>
                ) : (
                  bannedTerms.map((b) => (
                    <div key={b.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-bold text-red-600">&ldquo;{b.term}&rdquo;</span>
                        {b.preferred_replacement && <><span className="text-gray-500 mx-2">→</span><span className="font-semibold text-emerald-700">&ldquo;{b.preferred_replacement}&rdquo;</span></>}
                        {b.reason && <span className="text-gray-500 ml-3">({b.reason})</span>}
                      </div>
                      <button
                        type="button"
                        disabled={deletingTermId === b.id}
                        onClick={async () => {
                          setDeletingTermId(b.id);
                          try {
                            await api.deleteBannedTerm(b.id);
                            const res = await api.getBannedTerms();
                            setBannedTerms(res.bannedTerms);
                            setNotice({ type: 'success', text: 'Brand term removed.' });
                          } catch (err) {
                            const message = err instanceof Error ? err.message : 'Please try again.';
                            setNotice({ type: 'error', text: `Could not remove this brand term: ${message}` });
                          } finally {
                            setDeletingTermId(null);
                          }
                        }}
                        aria-label={`Remove restricted term: ${b.term}`}
                        className="text-gray-500 hover:text-red-600 transition disabled:opacity-50"
                        title="Remove from list"
                      >
                        {deletingTermId === b.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 2. Guidelines & Facts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Guidelines */}
              <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900">Brand Voice Guidelines</h3>
                    <HelperTooltip
                      term="Brand Voice Guidelines"
                      text="Official tone, formality, and vocabulary principles indexed into knowledge sections for real-time comparison."
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Style guides the AI uses to keep all drafts on-brand.
                  </p>
                </div>
                <div className="space-y-3">
                  {guidelines.length === 0 ? (
                    <div className="p-6 rounded-xl bg-gray-50 text-center text-xs text-gray-500">
                      No brand guidelines loaded yet.
                    </div>
                  ) : (
                    guidelines.map((g) => (
                      <div key={g.id} className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-gray-900">{g.title}</span>
                          <span className="text-violet-700 font-semibold">{g.chunk_count} rules loaded</span>
                        </div>
                        <div className="text-[11px] text-gray-500">Category: {g.kind}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Facts */}
              <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900">Approved Facts & Numbers</h3>
                    <HelperTooltip
                      term="Approved Brand Facts"
                      text="Verified technical specs, benchmark statistics, and client metrics cross-checked to eliminate false superlatives."
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Verified technical numbers and stats to prevent false or unproven claims.
                  </p>
                </div>
                <div className="space-y-3">
                  {facts.length === 0 ? (
                    <div className="p-6 rounded-xl bg-gray-50 text-center text-xs text-gray-500">
                      No approved facts loaded yet.
                    </div>
                  ) : (
                    facts.map((f) => (
                      <div key={f.id} className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-gray-900">{f.title}</span>
                          <span className="text-emerald-700 font-semibold">{f.chunk_count} facts verified</span>
                        </div>
                        <div className="text-[11px] text-gray-500">Last updated: {f.effective_date}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: SCORE & REPORTS                                    */}
        {/* ========================================================= */}
        {activeTab === 'analytics' && (
          !analyticsData ? (
            <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center shadow-sm max-w-xl mx-auto space-y-3">
              <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <h3 className="font-bold text-gray-900 text-base">Loading Reports...</h3>
              <p className="text-xs text-gray-500">Compiling brand health scores, mistake counts, and rule patterns.</p>
            </div>
          ) : (
            <div className="space-y-8 max-w-6xl mx-auto">
              {/* Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
                  <div className="text-xs text-gray-500 font-semibold mb-1">Drafts Checked</div>
                  <div className="text-2xl font-black text-gray-900">{analyticsData.stats.total_drafts || 0}</div>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
                  <div className="text-xs text-gray-500 font-semibold mb-1">Approved & Live</div>
                  <div className="text-2xl font-black text-emerald-600">{analyticsData.stats.approved_count || 0}</div>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
                  <div className="text-xs text-gray-500 font-semibold mb-1">Team Average Score</div>
                  <div className="text-2xl font-black text-violet-600">{analyticsData.stats.org_avg_score || 0}%</div>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
                  <div className="text-xs text-gray-500 font-semibold mb-1">Issues Needing Fix</div>
                  <div className="text-2xl font-black text-amber-600">{analyticsData.stats.open_issues_count || 0}</div>
                </div>
              </div>

              {/* Brand Rule Auto-Sync: Self-Healing Rules Engine */}
              <SelfHealingCard canApply={user?.role === 'admin'} />

              {/* Top Violations & Ambiguous Rules */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Violations */}
                <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Most Common Mistakes</h3>
                    <p className="text-xs text-gray-500">
                      Phrases that get flagged most often across all drafts.
                    </p>
                  </div>
                  <div className="space-y-2.5">
                    {(!analyticsData.topViolations || analyticsData.topViolations.length === 0) ? (
                      <div className="p-6 rounded-xl bg-gray-50 text-center text-xs text-gray-500">
                        No flagged mistakes recorded yet.
                      </div>
                    ) : (
                      analyticsData.topViolations.map((v, idx: number) => (
                        <div key={idx} className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-mono font-bold text-red-700">&ldquo;{v.quote}&rdquo;</span>
                            <div className="text-[10px] text-gray-500 mt-0.5">{v.source_ref}</div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 font-bold">
                            {v.count} times
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Ambiguous Rules Alert */}
                <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <h3 className="text-base font-bold text-gray-900">Confusing Rules Helper</h3>
                  </div>
                  <p className="text-xs text-gray-500">
                    Rules broken by multiple different team members. Clarifying these rules can prevent repeated mistakes.
                  </p>

                  <div className="space-y-3">
                    {(!analyticsData.ambiguousRules || analyticsData.ambiguousRules.length === 0) ? (
                      <div className="p-6 rounded-xl bg-gray-50 text-xs text-gray-500 text-center">
                        All rules seem clear! No confusing rule flags found.
                      </div>
                    ) : (
                      analyticsData.ambiguousRules.map((r, idx: number) => (
                        <div key={idx} className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
                          <div className="text-xs font-bold text-amber-900">{r.source_ref}</div>
                          <div className="text-[11px] text-amber-800">
                            Broken by {r.distinct_violators} different team members across {r.total_occurrences} drafts.
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        )}

        {/* ========================================================= */}
        {/* TAB 5: ACTIVITY HISTORY (AUDIT TRAIL)                     */}
        {/* ========================================================= */}
        {activeTab === 'audit' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div>
              <h2 className="text-xl font-black text-gray-900">Activity History</h2>
              <p className="text-xs text-gray-500">
                A clear record of every check, edit, approval, and publication.
              </p>
            </div>

            {auditLogs.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center shadow-sm max-w-xl mx-auto space-y-3">
                <History className="w-8 h-8 text-gray-500 mx-auto" />
                <h3 className="font-bold text-gray-900 text-base">No activity recorded yet</h3>
                <p className="text-xs text-gray-500">Actions such as draft edits, approvals, and reviews will appear here.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-4 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <History className="w-4 h-4 text-violet-600 flex-shrink-0" />
                      <div>
                        <div className="font-bold text-gray-900">
                          <span className="text-violet-700">{log.actor_name}</span> performed{' '}
                          <span className="font-semibold text-emerald-700">{log.action}</span> on{' '}
                          <span className="text-gray-700">{log.entity_type}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                          {JSON.stringify(log.metadata)}
                        </div>
                      </div>
                    </div>
                    <span className="text-gray-500 text-[11px] whitespace-nowrap ml-4">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: ACCESSIBILITY & READABILITY                        */}
        {/* ========================================================= */}
        {activeTab === 'a11y' && <ContrastCheckerModal />}

        {/* ========================================================= */}
        {/* TAB 7: COMPARE TWO BRANDS                                 */}
        {/* ========================================================= */}
        {activeTab === 'multitenant' && <MultiTenantDemo />}

        </ErrorBoundary>
      </main>

      {/* ========================================================= */}
      {/* MODAL: CREATE NEW DRAFT                                   */}
      {/* ========================================================= */}
      {isNewModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-draft-modal-title"
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsNewModalOpen(false);
          }}
        >
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xl max-w-lg w-full space-y-4">
            <h3 id="new-draft-modal-title" className="text-lg font-bold text-gray-900">Start a New Draft</h3>
            
            <form onSubmit={handleCreateNewContent} className="space-y-4">
              <div>
                <label htmlFor="new-draft-title-input" className="block text-xs font-semibold text-gray-700 mb-1">Draft Title</label>
                <input
                  id="new-draft-title-input"
                  type="text"
                  required
                  placeholder="e.g. Q4 Launch Announcement"
                  aria-label="Draft Title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>

              <div>
                <label htmlFor="new-channel-select" className="block text-xs font-semibold text-gray-700 mb-1">Where will this be published?</label>
                <select
                  id="new-channel-select"
                  aria-label="Publishing channel destination"
                  value={newChannel}
                  onChange={(e) => setNewChannel(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                >
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Twitter / X">Twitter / X</option>
                  <option value="Blog">Blog</option>
                  <option value="Press Release">Press Release</option>
                  <option value="Email Newsletter">Email Newsletter</option>
                </select>
              </div>

              <div>
                <label htmlFor="new-body-textarea" className="block text-xs font-semibold text-gray-700 mb-1">Draft Text</label>
                <textarea
                  id="new-body-textarea"
                  rows={4}
                  required
                  aria-label="Draft text body"
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 font-mono shadow-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isCreatingDraft}
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-xs font-medium transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingDraft || !newTitle.trim() || !newBody.trim()}
                  className="px-5 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                >
                  {isCreatingDraft ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Draft...</span>
                    </>
                  ) : (
                    <span>Save Draft</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: REVIEWER DECISION                                  */}
      {/* ========================================================= */}
      {decisionModal.open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="decision-modal-title"
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDecisionModal({ open: false, type: 'approved', note: '' });
          }}
        >
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xl max-w-md w-full space-y-4">
            <h3 id="decision-modal-title" className="text-base font-bold text-gray-900 capitalize">
              {decisionModal.type === 'approved' ? 'Confirm Approval' : 'Send Feedback to Writer'}
            </h3>

            {(decisionModal.type === 'changes_requested' || decisionModal.type === 'rejected') && (
              <div>
                <label htmlFor="decision-feedback-note" className="block text-xs font-semibold text-gray-700 mb-1">
                  What should the author change?
                </label>
                <textarea
                  id="decision-feedback-note"
                  rows={3}
                  required
                  aria-label="What should the author change?"
                  value={decisionModal.note}
                  onChange={(e) => setDecisionModal({ ...decisionModal, note: e.target.value })}
                  placeholder="Explain what needs to be revised before approval..."
                  className="w-full p-3 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isSubmittingDecision}
                onClick={() => setDecisionModal({ open: false, type: 'approved', note: '' })}
                className="px-4 py-2 rounded-xl bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-xs font-medium transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingDecision}
                onClick={handleReviewerDecision}
                className="px-5 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
              >
                {isSubmittingDecision ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>{decisionModal.type === 'approved' ? 'Approve Draft' : 'Send Feedback'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ZERO-API SOCIAL PUBLISHING                         */}
      {/* ========================================================= */}
      {contentDetails && (
        <SocialPublishModal
          contentId={contentDetails.content.id}
          contentTitle={contentDetails.content.title}
          score={contentDetails.content.latest_score}
          isOpen={isSocialPublishOpen}
          onClose={() => setIsSocialPublishOpen(false)}
          onPublished={async () => {
            if (selectedContentId) {
              await loadContentDetails(selectedContentId);
              const list = await api.getContents();
              setContents(list.contents);
              setNotice({ type: 'success', text: 'Share activity recorded. Check Activity History for the method and destination.' });
            }
          }}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL: QUICK-START GUIDE                                  */}
      {/* ========================================================= */}
      <QuickStartModal
        isOpen={isQuickStartOpen}
        onClose={() => setIsQuickStartOpen(false)}
        onNavigateTab={handleTabChange}
      />
    </div>
  );
}
