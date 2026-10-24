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
import {
  Sparkles,
  Plus,
  Send,
  CheckCircle,
  XCircle,
  RotateCcw,
  ShieldAlert,
  FileText,
  Clock,
  ArrowRight,
  Upload,
  Trash2,
  Lock,
  Search,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  History,
  Check
} from 'lucide-react';

export default function AppHome() {
  const { user, organization, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('studio');
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [contentDetails, setContentDetails] = useState<ContentDetails | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

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
  const [approvalQueue, setApprovalQueue] = useState<any[]>([]);
  const [decisionModal, setDecisionModal] = useState<{ open: boolean; type: 'approved' | 'changes_requested' | 'rejected'; note: string }>({
    open: false,
    type: 'approved',
    note: ''
  });

  // Governance state
  const [guidelines, setGuidelines] = useState<any[]>([]);
  const [facts, setFacts] = useState<any[]>([]);
  const [bannedTerms, setBannedTerms] = useState<any[]>([]);
  const [newBannedTerm, setNewBannedTerm] = useState({ term: '', rep: '', reason: '', severity: 'high' });
  const [newFactTitle, setNewFactTitle] = useState('');
  const [newFactContent, setNewFactContent] = useState('');
  const [newGuideTitle, setNewGuideTitle] = useState('');
  const [newGuideContent, setNewGuideContent] = useState('');

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState('ALL');

  useEffect(() => {
    if (user && organization) {
      loadInitialData();
    }
  }, [user, organization]);

  async function loadInitialData() {
    setLoading(true);
    try {
      const [contentsRes, queueRes] = await Promise.all([
        api.getContents(),
        user?.role === 'reviewer' || user?.role === 'admin'
          ? api.getApprovalsQueue().catch(() => ({ queue: [] }))
          : Promise.resolve({ queue: [] })
      ]);
      setContents(contentsRes.contents);
      setApprovalQueue(queueRes.queue);

      // Default to selecting the first content if none selected
      if (contentsRes.contents.length > 0 && !selectedContentId) {
        loadContentDetails(contentsRes.contents[0].id);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadContentDetails(id: string) {
    try {
      const details = await api.getContent(id);
      setSelectedContentId(id);
      setContentDetails(details);
      const currentVer = details.versions.find(v => v.id === details.content.current_version_id);
      setEditorBody(currentVer ? currentVer.body : '');
      if (details.issues.length > 0) {
        setSelectedIssueId(details.issues[0].id);
      }
    } catch (err) {
      console.error('Failed to load content details:', err);
    }
  }

  // Trigger Review
  async function handleRunReview() {
    if (!selectedContentId || !contentDetails) return;
    setIsReviewing(true);

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
            // Refresh content details
            loadContentDetails(selectedContentId);
            // Refresh list
            const updated = await api.getContents();
            setContents(updated.contents);
          }
        } catch {
          clearInterval(interval);
          setIsReviewing(false);
        }
      }, 600);
    } catch (err) {
      console.error('Review failed:', err);
      setIsReviewing(false);
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

  // Dismiss Issue
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
    if (!selectedContentId) return;
    try {
      await api.submitForApproval(selectedContentId);
      await loadContentDetails(selectedContentId);
      const list = await api.getContents();
      setContents(list.contents);
      alert('Content submitted for reviewer sign-off!');
    } catch (err: any) {
      alert(`Error submitting: ${err.message}`);
    }
  }

  // Reviewer Decision
  async function handleReviewerDecision() {
    if (!selectedContentId) return;
    try {
      await api.submitDecision(selectedContentId, decisionModal.type, decisionModal.note);
      setDecisionModal({ open: false, type: 'approved', note: '' });
      await loadContentDetails(selectedContentId);
      const [list, queue] = await Promise.all([api.getContents(), api.getApprovalsQueue()]);
      setContents(list.contents);
      setApprovalQueue(queue.queue);
    } catch (err: any) {
      alert(`Error recording decision: ${err.message}`);
    }
  }

  // Mark as Published
  async function handlePublish() {
    if (!selectedContentId) return;
    try {
      await api.publishContent(selectedContentId);
      await loadContentDetails(selectedContentId);
      const list = await api.getContents();
      setContents(list.contents);
    } catch (err: any) {
      alert(`Error publishing: ${err.message}`);
    }
  }

  // Add Comment
  async function handleAddComment(body: string) {
    if (!selectedContentId || !contentDetails) return;
    const currentVer = contentDetails.versions.find(v => v.id === contentDetails.content.current_version_id);
    if (!currentVer) return;

    await api.addComment(selectedContentId, currentVer.id, body);
    await loadContentDetails(selectedContentId);
  }

  // Create New Content
  async function handleCreateNewContent(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) return;

    try {
      const res = await api.createContent(newTitle.trim(), newChannel, newBody.trim());
      setIsNewModalOpen(false);
      setNewTitle('');
      setNewBody('');

      const updated = await api.getContents();
      setContents(updated.contents);
      await loadContentDetails(res.content.id);
      setActiveTab('studio');
    } catch (err: any) {
      alert(`Failed to create draft: ${err.message}`);
    }
  }

  // Tab Load Handlers
  async function handleTabChange(tab: ActiveTab) {
    setActiveTab(tab);
    if (tab === 'governance') {
      const [gRes, fRes, bRes] = await Promise.all([
        api.getGuidelines(),
        api.getFacts(),
        api.getBannedTerms()
      ]);
      setGuidelines(gRes.guidelines);
      setFacts(fRes.facts);
      setBannedTerms(bRes.bannedTerms);
    } else if (tab === 'analytics') {
      const aRes = await api.getAnalytics();
      setAnalyticsData(aRes);
    } else if (tab === 'audit') {
      const audRes = await api.getAuditLogs();
      setAuditLogs(audRes.logs);
    } else if (tab === 'approvals') {
      const qRes = await api.getApprovalsQueue().catch(() => ({ queue: [] }));
      setApprovalQueue(qRes.queue);
    }
  }

  const filteredContents = contents.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChannel = channelFilter === 'ALL' || c.channel === channelFilter;
    return matchesSearch && matchesChannel;
  });

  const currentVersion = contentDetails?.versions.find(v => v.id === contentDetails.content.current_version_id);
  const previousVersion = contentDetails?.versions.length && contentDetails.versions.length > 1
    ? contentDetails.versions[contentDetails.versions.length - 2]
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#090D16] text-gray-100 selection:bg-indigo-500/30">
      {/* Universal Header with Navigation & 1-Click Persona Switcher */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        pendingApprovalsCount={approvalQueue.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        
        {/* ========================================================= */}
        {/* TAB 1: DRAFTS & AI REVIEW STUDIO                          */}
        {/* ========================================================= */}
        {activeTab === 'studio' && (
          <div className="space-y-6">
            {/* Top Action Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-white/10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search drafts by title..."
                    className="pl-9 pr-4 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <select
                  value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-gray-300 focus:outline-none"
                >
                  <option value="ALL">All Channels</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Twitter / X">Twitter / X</option>
                  <option value="Blog">Blog</option>
                  <option value="Press Release">Press Release</option>
                  <option value="Email Newsletter">Email Newsletter</option>
                </select>
              </div>

              <button
                onClick={() => setIsNewModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/30"
              >
                <Plus className="w-4 h-4" />
                New Content Draft
              </button>
            </div>

            {/* Split Screen Layout: Left Sidebar Drafts List | Right Studio Editor */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Drafts Sidebar */}
              <div className="lg:col-span-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-400 px-1">
                  <span>Organization Drafts ({filteredContents.length})</span>
                </div>

                <div className="space-y-2.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                  {filteredContents.map((c) => {
                    const isSelected = c.id === selectedContentId;
                    return (
                      <div
                        key={c.id}
                        onClick={() => loadContentDetails(c.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-500/10'
                            : 'glass-panel hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h4 className="font-bold text-sm text-white line-clamp-1">{c.title}</h4>
                          <ScoreBadge score={c.latest_score} size="sm" showLabel={false} />
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[10px] font-semibold text-gray-300">
                              {c.channel}
                            </span>
                            <span className="capitalize text-[11px] font-medium text-indigo-300">
                              {c.status.replace('_', ' ')}
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
                    <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2.5 text-xs text-gray-400 mb-1">
                            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                              {contentDetails.content.channel}
                            </span>
                            <span>•</span>
                            <span className="capitalize font-semibold text-gray-300">
                              Status: {contentDetails.content.status.replace('_', ' ')}
                            </span>
                            <span>•</span>
                            <span>Version {currentVersion?.version_no || 1}</span>
                          </div>
                          <h1 className="text-xl font-black text-white">{contentDetails.content.title}</h1>
                        </div>

                        {/* Top Score Badge */}
                        <ScoreBadge score={contentDetails.content.latest_score} size="lg" />
                      </div>

                      {/* Action Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleRunReview}
                            disabled={isReviewing}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                          >
                            <Sparkles className={`w-4 h-4 ${isReviewing ? 'animate-spin' : ''}`} />
                            {isReviewing ? 'Scanning Brand Rules...' : 'Run AI Review'}
                          </button>

                          {contentDetails.content.status !== 'published' && (
                            <button
                              onClick={handleSubmitForApproval}
                              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/20"
                            >
                              <Send className="w-4 h-4" />
                              Submit for Sign-off
                            </button>
                          )}
                        </div>

                        {/* Reviewer / Admin Quick Actions */}
                        {(user?.role === 'reviewer' || user?.role === 'admin' || user?.role === 'solo') && (
                          <div className="flex items-center gap-2">
                            {contentDetails.content.status === 'submitted' && (
                              <>
                                <button
                                  onClick={() => setDecisionModal({ open: true, type: 'approved', note: '' })}
                                  className="px-3.5 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold hover:bg-emerald-500/30 transition"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => setDecisionModal({ open: true, type: 'changes_requested', note: '' })}
                                  className="px-3.5 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500/30 transition"
                                >
                                  Request Changes
                                </button>
                              </>
                            )}

                            {contentDetails.content.status === 'approved' && user.role === 'admin' && (
                              <button
                                onClick={handlePublish}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                Mark as Published
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Split View: Left Highlighted Text / Right Issue Cards */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                      
                      {/* Left Side: Draft Editor & Visual Highlighted Copy */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs font-bold text-gray-400">
                          <span>Audited Content Text (with Highlights):</span>
                          <span className="text-[11px] text-gray-500 font-mono">
                            {editorBody.length} chars • {editorBody.split(/\s+/).filter(Boolean).length} words
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
                            <label className="block text-xs font-semibold text-gray-400">
                              Direct Copy Editor (make custom edits, then re-run review):
                            </label>
                            <textarea
                              rows={5}
                              value={editorBody}
                              onChange={(e) => setEditorBody(e.target.value)}
                              className="w-full p-4 rounded-2xl bg-black/50 border border-white/10 font-mono text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
                            />
                          </div>
                        )}

                        {/* Anchored Comments Component */}
                        <div className="glass-panel p-5 rounded-2xl border border-white/10">
                          <CommentThread
                            comments={contentDetails.comments}
                            currentVersionId={currentVersion?.id || ''}
                            onAddComment={handleAddComment}
                          />
                        </div>
                      </div>

                      {/* Right Side: Issue Cards and Intent-Preserving Fixes */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs font-bold text-gray-400">
                          <span>Brand Findings & Suggestions ({contentDetails.issues.filter(i => i.status === 'open').length} Open)</span>
                          <span className="text-[11px] text-indigo-400">1-Click Accept Fix</span>
                        </div>

                        {contentDetails.issues.length === 0 ? (
                          <div className="p-8 rounded-3xl glass-panel text-center space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                              <CheckCircle className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-white text-base">Zero Brand Violations Found</h3>
                            <p className="text-xs text-gray-400 max-w-sm mx-auto">
                              This copy conforms with all brand tone guidelines, approved technical facts, and accessibility requirements.
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
                  <div className="glass-panel p-12 rounded-3xl text-center text-gray-400">
                    Select a content draft from the left or create a new one to start auditing.
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: APPROVAL QUEUE & VERSION DIFF                      */}
        {/* ========================================================= */}
        {activeTab === 'approvals' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white">Reviewer Approval Queue</h2>
                <p className="text-xs text-gray-400">
                  Pre-publication governance sign-off for marketing copy, announcements, and claims.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                {approvalQueue.length} Items Pending Review
              </span>
            </div>

            {approvalQueue.length === 0 ? (
              <div className="glass-panel p-12 rounded-3xl text-center space-y-3">
                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                <h3 className="text-base font-bold text-white">Queue is Clear!</h3>
                <p className="text-xs text-gray-400">All submitted drafts have been reviewed and approved.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {approvalQueue.map((item) => (
                  <div key={item.id} className="p-6 rounded-3xl glass-panel border border-white/10 space-y-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                          <span className="font-semibold text-gray-300">{item.author_name}</span>
                          <span>•</span>
                          <span>{item.channel}</span>
                          <span>•</span>
                          <span>Submitted {new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                        <h3 className="text-lg font-bold text-white">{item.title}</h3>
                      </div>

                      <ScoreBadge score={item.latest_score} />
                    </div>

                    {/* Diff against previous version */}
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                        Revision Inspection & Diff Viewer:
                      </div>
                      <DiffView
                        oldText="Our app is the #1 fastest tool, guaranteed! Trusted by millions of businesses."
                        newText={item.current_body || ''}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                      <button
                        onClick={() => {
                          setSelectedContentId(item.id);
                          setDecisionModal({ open: true, type: 'changes_requested', note: '' });
                        }}
                        className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500/30 transition"
                      >
                        Request Changes
                      </button>
                      <button
                        onClick={() => {
                          setSelectedContentId(item.id);
                          setDecisionModal({ open: true, type: 'approved', note: '' });
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/20"
                      >
                        Approve Publication
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: BRAND GUIDELINES & APPROVED FACTS                   */}
        {/* ========================================================= */}
        {activeTab === 'governance' && (
          <div className="space-y-8 max-w-6xl mx-auto">
            {/* 1. Banned Terms Manager */}
            <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Banned Vocabulary & Outdated Terms</h3>
                  <p className="text-xs text-gray-400">
                    Prohibited terms are matched instantaneously without relying solely on LLMs.
                  </p>
                </div>
              </div>

              {/* Add Term Form */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 rounded-2xl bg-black/40 border border-white/5">
                <input
                  type="text"
                  placeholder="Prohibited term (e.g. cheap)"
                  value={newBannedTerm.term}
                  onChange={(e) => setNewBannedTerm({ ...newBannedTerm, term: e.target.value })}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Preferred replacement"
                  value={newBannedTerm.rep}
                  onChange={(e) => setNewBannedTerm({ ...newBannedTerm, rep: e.target.value })}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Policy reason"
                  value={newBannedTerm.reason}
                  onChange={(e) => setNewBannedTerm({ ...newBannedTerm, reason: e.target.value })}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white md:col-span-2"
                />
                <button
                  onClick={async () => {
                    if (!newBannedTerm.term) return;
                    await api.createBannedTerm(newBannedTerm.term, newBannedTerm.rep, newBannedTerm.reason, newBannedTerm.severity);
                    setNewBannedTerm({ term: '', rep: '', reason: '', severity: 'high' });
                    const res = await api.getBannedTerms();
                    setBannedTerms(res.bannedTerms);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                >
                  Add Term
                </button>
              </div>

              {/* List */}
              <div className="divide-y divide-white/5">
                {bannedTerms.map((b) => (
                  <div key={b.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-rose-400">&ldquo;{b.term}&rdquo;</span>
                      <span className="text-gray-400 mx-2">→</span>
                      <span className="font-semibold text-emerald-400">&ldquo;{b.preferred_replacement}&rdquo;</span>
                      <span className="text-gray-500 ml-3">({b.reason})</span>
                    </div>
                    <button
                      onClick={async () => {
                        await api.deleteBannedTerm(b.id);
                        const res = await api.getBannedTerms();
                        setBannedTerms(res.bannedTerms);
                      }}
                      className="text-gray-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Guidelines & Facts Ingestion */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Guidelines */}
              <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-4">
                <h3 className="text-base font-bold text-white">Brand Voice Guidelines</h3>
                <div className="space-y-3">
                  {guidelines.map((g) => (
                    <div key={g.id} className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white">{g.title}</span>
                        <span className="text-indigo-400">{g.chunk_count} Vector Chunks</span>
                      </div>
                      <div className="text-[11px] text-gray-400">Kind: {g.kind} • Embedded in pgvector</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Facts */}
              <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-4">
                <h3 className="text-base font-bold text-white">Approved Fact Documents</h3>
                <div className="space-y-3">
                  {facts.map((f) => (
                    <div key={f.id} className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white">{f.title}</span>
                        <span className="text-emerald-400">{f.chunk_count} Vector Chunks</span>
                      </div>
                      <div className="text-[11px] text-gray-400">Effective Date: {f.effective_date}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: GOVERNANCE ANALYTICS & INSIGHTS                    */}
        {/* ========================================================= */}
        {activeTab === 'analytics' && analyticsData && (
          <div className="space-y-8 max-w-6xl mx-auto">
            {/* Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl glass-panel border border-white/10">
                <div className="text-xs text-gray-400 font-semibold mb-1">Total Drafts Audited</div>
                <div className="text-2xl font-black text-white">{analyticsData.stats.total_drafts || 0}</div>
              </div>
              <div className="p-5 rounded-2xl glass-panel border border-white/10">
                <div className="text-xs text-gray-400 font-semibold mb-1">Approved & Published</div>
                <div className="text-2xl font-black text-emerald-400">{analyticsData.stats.approved_count || 0}</div>
              </div>
              <div className="p-5 rounded-2xl glass-panel border border-white/10">
                <div className="text-xs text-gray-400 font-semibold mb-1">Org Average Score</div>
                <div className="text-2xl font-black text-indigo-400">{analyticsData.stats.org_avg_score || 0}%</div>
              </div>
              <div className="p-5 rounded-2xl glass-panel border border-white/10">
                <div className="text-xs text-gray-400 font-semibold mb-1">Active Violations</div>
                <div className="text-2xl font-black text-rose-400">{analyticsData.stats.open_issues_count || 0}</div>
              </div>
            </div>

            {/* Top Violations & Ambiguous Rules */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Violations */}
              <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-4">
                <h3 className="text-base font-bold text-white">Most Frequent Violations</h3>
                <div className="space-y-2.5">
                  {analyticsData.topViolations?.map((v: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-bold text-rose-300">&ldquo;{v.quote}&rdquo;</span>
                        <div className="text-[10px] text-gray-400 mt-0.5">{v.source_ref}</div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 font-bold">
                        {v.count} times
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ambiguous Rules Alert */}
              <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white">Ambiguous Brand Rules Detector</h3>
                </div>
                <p className="text-xs text-gray-400">
                  Rules that have been violated by 2 or more distinct team members, indicating the guideline wording needs clarification.
                </p>

                <div className="space-y-3">
                  {analyticsData.ambiguousRules?.length === 0 ? (
                    <div className="p-4 rounded-xl bg-black/20 text-xs text-gray-500 text-center">
                      No ambiguity flags detected yet.
                    </div>
                  ) : (
                    analyticsData.ambiguousRules?.map((r: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                        <div className="text-xs font-bold text-amber-300">{r.source_ref}</div>
                        <div className="text-[11px] text-gray-300">
                          Violated by {r.distinct_violators} different team members across {r.total_occurrences} drafts.
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: AUDIT TRAIL                                        */}
        {/* ========================================================= */}
        {activeTab === 'audit' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div>
              <h2 className="text-xl font-black text-white">Immutable Governance Audit Trail</h2>
              <p className="text-xs text-gray-400">
                Cryptographic timeline of every upload, scan, issue dismissal, sign-off, and publication.
              </p>
            </div>

            <div className="glass-panel rounded-3xl border border-white/10 divide-y divide-white/5">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-4 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <History className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-white">
                        <span className="text-indigo-300">{log.actor_name}</span> performed{' '}
                        <span className="font-mono text-emerald-300">{log.action}</span> on{' '}
                        <span className="text-gray-300">{log.entity_type}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono">
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
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: ACCESSIBILITY TOOLS                                */}
        {/* ========================================================= */}
        {activeTab === 'a11y' && <ContrastCheckerModal />}

        {/* ========================================================= */}
        {/* TAB 7: MULTI-TENANCY COMPARISON DEMO                      */}
        {/* ========================================================= */}
        {activeTab === 'multitenant' && <MultiTenantDemo />}

      </main>

      {/* ========================================================= */}
      {/* MODAL: CREATE NEW DRAFT                                   */}
      {/* ========================================================= */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 rounded-3xl border border-white/10 max-w-lg w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Create New Content Draft</h3>
            
            <form onSubmit={handleCreateNewContent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Product Launch Social Post"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Target Channel</label>
                <select
                  value={newChannel}
                  onChange={(e) => setNewChannel(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white"
                >
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Twitter / X">Twitter / X</option>
                  <option value="Blog">Blog</option>
                  <option value="Press Release">Press Release</option>
                  <option value="Email Newsletter">Email Newsletter</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Draft Text Copy</label>
                <textarea
                  rows={4}
                  required
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-gray-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                >
                  Create Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: REVIEWER DECISION                                   */}
      {/* ========================================================= */}
      {decisionModal.open && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 rounded-3xl border border-white/10 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white capitalize">
              Confirm Decision: {decisionModal.type.replace('_', ' ')}
            </h3>

            {(decisionModal.type === 'changes_requested' || decisionModal.type === 'rejected') && (
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Required Reason / Change Instructions:
                </label>
                <textarea
                  rows={3}
                  required
                  value={decisionModal.note}
                  onChange={(e) => setDecisionModal({ ...decisionModal, note: e.target.value })}
                  placeholder="Explain what needs to be revised before approval..."
                  className="w-full p-3 rounded-xl bg-slate-900 border border-white/10 text-xs text-white"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDecisionModal({ open: false, type: 'approved', note: '' })}
                className="px-4 py-2 rounded-xl bg-white/5 text-gray-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleReviewerDecision}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
              >
                Submit Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
