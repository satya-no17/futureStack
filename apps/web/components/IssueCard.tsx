'use client';

import React, { useState } from 'react';
import { Issue } from '../lib/api';
import { AlertCircle, Check, X, Edit3, BookOpen, Sparkles, CheckCircle2 } from 'lucide-react';

interface IssueCardProps {
  issue: Issue;
  isSelected: boolean;
  onSelect: () => void;
  onAccept: (suggestion: string) => void;
  onDismiss: (reason: string) => void;
}

export function IssueCard({
  issue,
  isSelected,
  onSelect,
  onAccept,
  onDismiss
}: IssueCardProps) {
  const [isDismissing, setIsDismissing] = useState(false);
  const [dismissReason, setDismissReason] = useState('Approved by legal team for this campaign');
  const [isEditingSuggestion, setIsEditingSuggestion] = useState(false);
  const [customSuggestion, setCustomSuggestion] = useState(issue.suggestion);

  let severityBadge = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
  if (issue.severity === 'medium') severityBadge = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
  if (issue.severity === 'low') severityBadge = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';

  const typeLabels: Record<string, string> = {
    banned_term: 'Banned Term',
    outdated_term: 'Outdated Term',
    contradicted_claim: 'Contradicted Claim',
    unverified_claim: 'Unverified Claim',
    tone: 'Brand Tone Mismatch',
    accessibility: 'Accessibility & Readability',
    visual: 'Visual Governance'
  };

  const isResolved = issue.status !== 'open';

  return (
    <div
      onClick={onSelect}
      className={`p-5 rounded-2xl transition-all duration-200 border cursor-pointer ${
        isSelected
          ? 'bg-stone-850 border-amber-500/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
          : 'bg-stone-900/80 border-stone-800 hover:border-stone-700 hover:bg-stone-850'
      } ${isResolved ? 'opacity-50 grayscale-[50%]' : ''}`}
    >
      {/* Header tags */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${severityBadge}`}>
            {issue.severity}
          </span>
          <span className="text-xs font-medium text-stone-300 bg-stone-800 px-2.5 py-0.5 rounded-full border border-stone-700/60">
            {typeLabels[issue.type] || issue.type}
          </span>
        </div>

        {issue.status === 'accepted' && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> Accepted
          </span>
        )}
        {issue.status === 'dismissed' && (
          <span className="inline-flex items-center gap-1 text-xs text-stone-400 font-medium italic">
            Dismissed ({issue.dismiss_reason || 'Manual override'})
          </span>
        )}
      </div>

      {/* Quoted problem text */}
      <div className="mb-3">
        <div className="text-xs text-stone-400 uppercase tracking-wider font-semibold mb-1">
          Flagged Text:
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-black/50 border border-stone-800 font-mono text-xs text-rose-300 font-medium inline-block">
          &ldquo;{issue.quote}&rdquo;
        </div>
      </div>

      {/* Explanation */}
      <p className="text-xs text-stone-200 mb-3 leading-relaxed">
        {issue.explanation}
      </p>

      {/* Source citation */}
      {issue.source_ref && (
        <div className="flex items-center gap-1.5 text-xs text-amber-300/90 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 mb-4">
          <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="font-semibold text-amber-200">Rule Citation:</span>
          <span className="truncate">{issue.source_ref}</span>
        </div>
      )}

      {/* Suggestion box & Actions */}
      {issue.status === 'open' && (
        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              Intent-Preserving Rewrite:
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingSuggestion(!isEditingSuggestion);
              }}
              className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition"
            >
              <Edit3 className="w-3 h-3" />
              {isEditingSuggestion ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {isEditingSuggestion ? (
            <div className="mb-3" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={customSuggestion}
                onChange={(e) => setCustomSuggestion(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-emerald-500/50 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-200 text-sm font-medium mb-3">
              &ldquo;{issue.suggestion || 'Review manually'}&rdquo;
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onAccept(isEditingSuggestion ? customSuggestion : issue.suggestion)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              Accept Fix
            </button>

            <button
              onClick={() => setIsDismissing(!isDismissing)}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium border border-white/10 transition"
            >
              Dismiss
            </button>
          </div>

          {/* Dismiss reason drawer */}
          {isDismissing && (
            <div className="mt-3 p-3 rounded-xl bg-black/40 border border-white/10" onClick={(e) => e.stopPropagation()}>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Reason for Dismissal:
              </label>
              <input
                type="text"
                value={dismissReason}
                onChange={(e) => setDismissReason(e.target.value)}
                placeholder="e.g. Approved exception by VP of Marketing"
                className="w-full px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-xs text-white mb-2 focus:outline-none focus:border-amber-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsDismissing(false)}
                  className="px-2 py-1 text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDismiss(dismissReason);
                    setIsDismissing(false);
                  }}
                  className="px-3 py-1 rounded-lg bg-rose-600/80 hover:bg-rose-500 text-white text-xs font-semibold"
                >
                  Confirm Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
