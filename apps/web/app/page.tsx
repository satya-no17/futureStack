'use client';

import React, { useState, useEffect } from 'react';
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
  Loader2
} from 'lucide-react';

export default function AppHome() {
  const { user, organization, loading: authLoading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  const isSolo = user?.role === 'solo' || organization?.type === 'solo';

  const [activeTab, setActiveTab] = useState<ActiveTab>('studio');
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [contentDetails, setContentDetails] = useState<ContentDetails | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState<boolean>(false);
  const [, setLoading] = useState<boolean>(true);

  // Button loading states to prevent double-clicks and display immediate animations
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [isAddingTerm, setIsAddingTerm] = useState(false);
  const [deletingTermId, setDeletingTermId] = useState<string | null>(null);

  // Resilience & Fallback Banner State
  const [fallbackActive, setFallbackActive] = useState<boolean>(false);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
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

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [aiError, setAiError] = useState<string | null>(null);

  async function loadContentDetails(id: string) {
    try {
      const details = await api.getContent(id);
      setSelectedContentId(id);
      setContentDetails(details);
      if (details.latestReview?.status === 'failed' || details.latestReview?.error_message) {
        setAiError(details.latestReview.error_message || 'AI not responded');
      } else {
        setAiError(null);
      }
      const currentVer = details.versions.find(v => v.id === details.content.current_version_id);
      setEditorBody(currentVer ? currentVer.body : '');
      if (details.issues.length > 0) {
        setSelectedIssueId(details.issues[0].id);
      }
    } catch {
      // Handled gracefully without console error
    }
  }

  async function loadInitialData() {
    setLoading(true);
    setSelectedContentId(null);
    setContentDetails(null);
    setSelectedIssueId(null);
    setAiError(null);
    try {
      const contentsRes = await api.getContents().catch(() => ({ contents: [] }));
      let queue: ApprovalQueueItem[] = [];
      if (user?.role === 'reviewer' || user?.role === 'admin') {
        const queueRes = await api.getApprovalsQueue().catch(() => ({ queue: [] }));
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
    } catch {
      // Gracefully handled by API fallback layer
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const unsubscribe = api.subscribeToFallbackState((active, reason) => {
      setFallbackActive(active);
      setFallbackReason(reason);
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
  async function handleRunReview() {
    if (!selectedContentId || !contentDetails) return;
    setIsReviewing(true);
    setAiError(null);

    try {
      // Save current editor body as a new version if modified
      const currentVer = contentDetails.versions.find(v => v.id === contentDetails.content.current_version_id);
      if (currentVer && currentVer.body.trim() !== editorBody.trim()) {
        await api.createNewVersion(selectedContentId, editorBody);
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
              setAiError(res.review.error_message || 'AI not responded');
            }
            // Refresh content details
            await loadContentDetails(selectedContentId);
            // Refresh list
            const updated = await api.getContents();
            setContents(updated.contents);
          }
        } catch {
          clearInterval(interval);
          setIsReviewing(false);
          setAiError('AI not responded');
        }
      }, 600);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'AI not responded';
      console.warn('Review failed:', err);
      setIsReviewing(false);
      setAiError(msg);
    }
  }

  // 1-Click Accept Fix
  async function handleAcceptIssue(issue: Issue, customSuggestion?: string) {
    if (!selectedContentId || !contentDetails) return;
    const replacement = customSuggestion || issue.suggestion;
    if (!replacement) return;

    // Apply replacement to editor body
    const oldQuote = issue.quote;
    const newBody = editorBody.replace(oldQuote, replacement);
    setEditorBody(newBody);

    try {
      // 1. Mark issue as accepted
      await api.patchIssue(issue.id, { status: 'accepted', suggestion: replacement });

      // 2. Save new version with replaced text
      await api.createNewVersion(selectedContentId, newBody);

      // 3. Automatically trigger re-review to calculate updated score
      await handleRunReview();
    } catch (err) {
      console.error('Failed to accept fix:', err);
    }
  }

  // Dismiss / Skip Issue
  async function handleDismissIssue(issueId: string, reason: string) {
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
    } catch (err) {
      console.error('Failed to dismiss issue:', err);
    }
  }

  // Submit Content for Approval
  async function handleSubmitForApproval() {
    if (!selectedContentId || isSubmittingApproval) return;
    setIsSubmittingApproval(true);
    try {
      await api.submitForApproval(selectedContentId);
      await loadContentDetails(selectedContentId);
      const list = await api.getContents();
      setContents(list.contents);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.warn(`Could not send draft: ${msg}`);
    } finally {
      setIsSubmittingApproval(false);
    }
  }

  // Reviewer Decision
  async function handleReviewerDecision() {
    if (!selectedContentId || isSubmittingDecision) return;
    setIsSubmittingDecision(true);
    try {
      await api.submitDecision(selectedContentId, decisionModal.type, decisionModal.note);
      setDecisionModal({ open: false, type: 'approved', note: '' });
      await loadContentDetails(selectedContentId);
      const [list, queue] = await Promise.all([api.getContents(), api.getApprovalsQueue()]);
      setContents(list.contents);
      setApprovalQueue(queue.queue);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.warn(`Could not save feedback: ${msg}`);
    } finally {
      setIsSubmittingDecision(false);
    }
  }

  // Mark as Published
  async function handlePublish() {
    if (!selectedContentId || isPublishing) return;
    setIsPublishing(true);
    try {
      await api.publishContent(selectedContentId);
      await loadContentDetails(selectedContentId);
      const list = await api.getContents();
      setContents(list.contents);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.warn(`Could not publish: ${msg}`);
    } finally {
      setIsPublishing(false);
    }
  }

  // Save manual text edit without re-running full scan immediately
  async function handleSaveManualDraft() {
    if (!selectedContentId || !contentDetails || isSavingDraft) return;
    setIsSavingDraft(true);
    try {
      await api.createNewVersion(selectedContentId, editorBody);
      await loadContentDetails(selectedContentId);
    } catch (err: unknown) {
      console.warn('Could not save draft version:', err);
    } finally {
      setIsSavingDraft(false);
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
    } catch {
      // Handled gracefully
    }
  }

  // Create New Content
  async function handleCreateNewContent(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim() || isCreatingDraft) return;
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.warn(`Could not create draft: ${message}`);
    } finally {
      setIsCreatingDraft(false);
    }
  }

  // Safe Tab Load Handlers with Zero Unhandled Rejections
  async function handleTabChange(tab: ActiveTab) {
    setActiveTab(tab);
    try {
      if (tab === 'governance') {
        const [gRes, fRes, bRes] = await Promise.all([
          api.getGuidelines().catch(() => ({ guidelines: [] })),
          api.getFacts().catch(() => ({ facts: [] })),
          api.getBannedTerms().catch(() => ({ bannedTerms: [] }))
        ]);
        setGuidelines(gRes.guidelines || []);
        setFacts(fRes.facts || []);
        setBannedTerms(bRes.bannedTerms || []);
      } else if (tab === 'analytics') {
        const aRes = await api.getAnalytics().catch(() => null);
        if (aRes) {
          setAnalyticsData(aRes);
        }
      } else if (tab === 'audit') {
        const audRes = await api.getAuditLogs().catch(() => ({ logs: [] }));
        setAuditLogs(audRes.logs || []);
      } else if (tab === 'approvals') {
        const qRes = await api.getApprovalsQueue().catch(() => ({ queue: [] }));
        setApprovalQueue(qRes.queue || []);
      }
    } catch {
      // Safe tab transition without uncaught promise rejection
    }
  }

  // Handle retry from FallbackBanner
  async function handleRetryConnection() {
    const connected = await api.testConnection();
    if (connected) {
      setIsBannerDismissed(false);
      await loadInitialData();
      await handleTabChange(activeTab);
    } else {
      await loadInitialData();
      await handleTabChange(activeTab);
    }
  }

  const statusLabels: Record<string, string> = {
    draft: isSolo ? 'Draft (Ready to Publish)' : 'Draft',
    in_review: 'Checking...',
    submitted: isSolo ? 'Ready to Publish' : 'Waiting for Review',
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
    <div className="app-dashboard min-h-screen flex flex-col bg-gray-50/50 text-gray-900 selection:bg-violet-200">
      {/* Universal Header with Navigation & Profile */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        pendingApprovalsCount={approvalQueue.length}
        onOpenQuickStart={() => setIsQuickStartOpen(true)}
      />

      {/* Visible Offline & Simulation Notice Banner */}
      {fallbackActive && !isBannerDismissed && (
        <FallbackBanner
          isSimulated={isSimulated}
          reason={fallbackReason}
          onDismiss={() => setIsBannerDismissed(true)}
          onRetry={handleRetryConnection}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        <ErrorBoundary
          fallbackTitle="Workspace Section Error"
          fallbackDescription="Inkloom AI isolated the error in this workspace. Your drafts and governance rules remain secure."
          onReset={() => handleTabChange(activeTab)}
        >
        
        {/* ========================================================= */}
        {/* TAB 1: DRAFTS & SCANNER STUDIO                            */}
        {/* ========================================================= */}
        {activeTab === 'studio' && (
          <div className="space-y-6">
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
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-500 px-1">
                  <span>Your Drafts ({filteredContents.length})</span>
                </div>

                <div className="space-y-2.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                  {filteredContents.map((c) => {
                    const isSelected = c.id === selectedContentId;
                    return (
                      <div
                        key={c.id}
                        tabIndex={0}
                        role="button"
                        aria-label={`Select draft: ${c.title}`}
                        onClick={() => loadContentDetails(c.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            loadContentDetails(c.id);
                          }
                        }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 ${
                          isSelected
                            ? 'bg-violet-50/50 border-violet-400 shadow-sm ring-1 ring-violet-400/20'
                            : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h4 className="font-bold text-sm text-gray-900 line-clamp-1">{c.title}</h4>
                          <ScoreBadge score={c.latest_score} size="sm" showLabel={false} />
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
                {contentDetails ? (
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
                          <h1 className="text-xl font-extrabold text-gray-900">{contentDetails.content.title}</h1>
                        </div>

                        {/* Top Score Badge */}
                        <ScoreBadge score={contentDetails.content.latest_score} size="lg" />
                      </div>

                      {/* Action Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={handleRunReview}
                            disabled={isReviewing}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isReviewing ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Checking words...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4" />
                                <span>Check My Words</span>
                              </>
                            )}
                          </button>

                          {(contentDetails.latestReview?.status === 'failed' || aiError) && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                              AI not responded
                            </span>
                          )}

                          {/* Team / Enterprise Draft: Send for Review */}
                          {!isSolo && contentDetails.content.status !== 'published' && (
                            <button
                              type="button"
                              onClick={handleSubmitForApproval}
                              disabled={isSubmittingApproval}
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

                          {/* Solo Creator: Direct Publish and Zero-API Share (No approval bottlenecks!) */}
                          {isSolo && contentDetails.content.status !== 'published' && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setIsSocialPublishOpen(true)}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold transition shadow-sm shadow-violet-200"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                                <span>Zero-API Publish</span>
                              </button>
                              <button
                                type="button"
                                onClick={handlePublish}
                                disabled={isPublishing}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isPublishing ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Publishing...</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    <span>Direct Publish</span>
                                  </>
                                )}
                              </button>
                            </div>
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
                                Zero-API Publish
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
                              <h4 className="text-sm font-bold text-amber-950">AI not responded</h4>
                              <span className="px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-900 text-[10px] font-bold uppercase tracking-wide">
                                Rule checks only
                              </span>
                            </div>
                            <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                              The AI review model did not respond or is not configured. Rule-based checks (words to avoid, readability grade) were completed and are shown below.
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
                          <span>Draft Text (with highlighted items):</span>
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
                                Edit your text directly here:
                              </label>
                              <button
                                type="button"
                                onClick={handleSaveManualDraft}
                                disabled={isSavingDraft}
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
                            <h4 className="font-bold text-xs text-amber-950">AI not responded</h4>
                            <p className="text-xs text-amber-800 leading-relaxed">
                              The AI review service did not return a response. Rule-based checks (words to avoid, readability grade) are displayed below.
                            </p>
                          </div>
                        )}

                        {contentDetails.issues.length === 0 ? (
                          <div className="p-8 rounded-2xl bg-white border border-gray-200 text-center space-y-3 shadow-sm">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                              <CheckCircle className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-gray-900 text-base">All clear! No issues found</h3>
                            <p className="text-xs text-gray-500 max-w-sm mx-auto">
                              This draft follows all brand voice rules, approved facts, and readability guidelines.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                            {contentDetails.issues.map((iss) => (
                              <IssueCard
                                key={iss.id}
                                issue={iss}
                                isSelected={iss.id === selectedIssueId}
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
              <h3 className="font-extrabold text-gray-900 text-lg">Autonomous Solo Creator Mode</h3>
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

              {/* Add Term Form */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
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
              </div>

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
                        <span className="text-gray-500 mx-2">→</span>
                        <span className="font-semibold text-emerald-700">&ldquo;{b.preferred_replacement}&rdquo;</span>
                        <span className="text-gray-500 ml-3">({b.reason})</span>
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
              <SelfHealingCard />

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
          isOpen={isSocialPublishOpen}
          onClose={() => setIsSocialPublishOpen(false)}
          onPublished={async () => {
            if (selectedContentId) {
              await handlePublish();
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
