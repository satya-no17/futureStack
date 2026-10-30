'use client';

import React, { useState } from 'react';
import { Issue } from '../lib/api';
import { Check, Edit3, BookOpen, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';

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
  const [dismissReason, setDismissReason] = useState('Approved by team lead for this campaign');
  const [isEditingSuggestion, setIsEditingSuggestion] = useState(false);
  const [customSuggestion, setCustomSuggestion] = useState(issue.suggestion);
  const [isApplying, setIsApplying] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  let severityBadge = 'bg-red-50 text-red-700 border-red-200';
  let severityLabel = 'Must Fix';
  if (issue.severity === 'medium') {
    severityBadge = 'bg-amber-50 text-amber-700 border-amber-200';
    severityLabel = 'Should Fix';
  }
  if (issue.severity === 'low') {
    severityBadge = 'bg-sky-50 text-sky-700 border-sky-200';
    severityLabel = 'Tip';
  }

  const typeLabels: Record<string, string> = {
    banned_term: 'Word to avoid',
    outdated_term: 'Old term',
    contradicted_claim: 'Incorrect fact',
    unverified_claim: 'Unproven claim',
    tone: 'Tone mismatch',
    accessibility: 'Hard to read',
    visual: 'Visual style'
  };

  const isResolved = issue.status !== 'open';

  return (
    <div
      tabIndex={0}
      role="button"
      aria-label={issue.explanation || 'Select issue'}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`p-5 rounded-2xl transition-all duration-200 border cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 ${
        isSelected
          ? 'bg-violet-50/30 border-violet-400 shadow-md ring-1 ring-violet-400/20'
          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
      } ${isResolved ? 'opacity-60 bg-gray-50/70' : ''}`}
    >
      {/* Header tags */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${severityBadge}`}>
            {severityLabel}
          </span>
          <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full border border-gray-200">
            {typeLabels[issue.type] || issue.type}
          </span>
        </div>

        {issue.status === 'accepted' && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Fix applied
          </span>
        )}
        {issue.status === 'dismissed' && (
          <span className="inline-flex items-center gap-1 text-xs text-gray-500 font-medium italic">
            Skipped ({issue.dismiss_reason || 'Manual override'})
          </span>
        )}
      </div>

      {/* Flagged problem text */}
      <div className="mb-3">
        <div className="text-xs text-gray-500 font-semibold mb-1">
          Problem words:
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-red-50/80 border border-red-200/80 font-mono text-xs text-red-800 font-medium inline-block">
          &ldquo;{issue.quote}&rdquo;
        </div>
      </div>

      {/* Explanation */}
      <p className="text-xs text-gray-700 mb-3 leading-relaxed">
        {issue.explanation}
      </p>

      {/* Source citation */}
      {issue.source_ref && (
        <div className="flex items-center gap-1.5 text-xs text-violet-700 bg-violet-50/70 px-3 py-1.5 rounded-lg border border-violet-100 mb-4">
          <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="font-semibold text-violet-800">Rule citation:</span>
          <span className="truncate">{issue.source_ref}</span>
        </div>
      )}

      {/* Suggestion box & Actions */}
      {issue.status === 'open' && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
              <Sparkles className="w-3.5 h-3.5" />
              Suggested fix:
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingSuggestion(!isEditingSuggestion);
              }}
              onKeyDown={(e) => e.stopPropagation()}
              className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 transition"
            >
              <Edit3 className="w-3 h-3" />
              {isEditingSuggestion ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {isEditingSuggestion ? (
            <div className="mb-3" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={customSuggestion}
                onChange={(e) => setCustomSuggestion(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-emerald-400 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
              />
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-medium mb-3">
              &ldquo;{issue.suggestion || 'Review manually'}&rdquo;
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <button
              disabled={isApplying}
              onClick={async () => {
                if (isApplying) return;
                setIsApplying(true);
                try {
                  await onAccept(isEditingSuggestion ? customSuggestion : issue.suggestion);
                } finally {
                  setIsApplying(false);
                }
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isApplying ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Applying Fix...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Use This Fix
                </>
              )}
            </button>

            <button
              disabled={isApplying}
              onClick={() => setIsDismissing(!isDismissing)}
              className="px-3 py-2 rounded-xl bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 text-xs font-medium border border-gray-200 transition shadow-sm disabled:opacity-50"
            >
              Skip
            </button>
          </div>

          {/* Dismiss reason drawer */}
          {isDismissing && (
            <div className="mt-3 p-3.5 rounded-xl bg-gray-50 border border-gray-200" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Why are you skipping this?
              </label>
              <input
                type="text"
                disabled={isSkipping}
                value={dismissReason}
                onChange={(e) => setDismissReason(e.target.value)}
                placeholder="e.g. Approved exception by team lead"
                className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-gray-300 text-xs text-gray-900 mb-2 focus:outline-none focus:border-violet-500 shadow-sm disabled:bg-gray-100"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  disabled={isSkipping}
                  onClick={() => setIsDismissing(false)}
                  className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-900 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSkipping}
                  onClick={async () => {
                    if (isSkipping) return;
                    setIsSkipping(true);
                    try {
                      await onDismiss(dismissReason);
                      setIsDismissing(false);
                    } finally {
                      setIsSkipping(false);
                    }
                  }}
                  className="px-3 py-1 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                >
                  {isSkipping ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Skipping...
                    </>
                  ) : (
                    'Confirm Skip'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
