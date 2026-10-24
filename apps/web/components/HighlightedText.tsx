'use client';

import React from 'react';
import { Issue } from '../lib/api';

interface HighlightedTextProps {
  body: string;
  issues: Issue[];
  selectedIssueId: string | null;
  onSelectIssue: (issueId: string) => void;
}

export function HighlightedText({
  body,
  issues,
  selectedIssueId,
  onSelectIssue
}: HighlightedTextProps) {
  // Only highlight open issues
  const activeIssues = issues.filter(i => i.status === 'open');

  if (activeIssues.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-white border border-gray-200 font-sans leading-relaxed text-gray-700 whitespace-pre-wrap text-base shadow-sm">
        {body}
      </div>
    );
  }

  // Sort active issues by start_idx ascending
  const sorted = [...activeIssues].sort((a, b) => a.start_idx - b.start_idx);

  const elements: React.ReactNode[] = [];
  let currentIndex = 0;

  for (let i = 0; i < sorted.length; i++) {
    const issue = sorted[i];

    // If start_idx is before current index (overlapping span), skip to prevent double rendering
    if (issue.start_idx < currentIndex) {
      continue;
    }

    // Text before the issue
    if (issue.start_idx > currentIndex) {
      elements.push(
        <span key={`text-${currentIndex}`}>
          {body.substring(currentIndex, issue.start_idx)}
        </span>
      );
    }

    // The highlighted segment
    const isSelected = issue.id === selectedIssueId;
    let highlightClass = 'highlight-medium';
    if (issue.severity === 'high') highlightClass = 'highlight-high';
    if (issue.severity === 'low') highlightClass = 'highlight-low';

    elements.push(
      <mark
        key={`issue-${issue.id}`}
        onClick={() => onSelectIssue(issue.id)}
        className={`${highlightClass} relative inline-block transition-all duration-200 ${
          isSelected ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-white font-bold scale-[1.02]' : ''
        }`}
        title={`${issue.severity.toUpperCase()}: ${issue.explanation}`}
      >
        {body.substring(issue.start_idx, issue.end_idx)}
        <span className="sr-only">({issue.type})</span>
      </mark>
    );

    currentIndex = issue.end_idx;
  }

  // Trailing text
  if (currentIndex < body.length) {
    elements.push(
      <span key={`text-${currentIndex}`}>
        {body.substring(currentIndex)}
      </span>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-white border border-gray-200 font-sans leading-relaxed text-gray-800 whitespace-pre-wrap text-base shadow-sm selection:bg-violet-200">
      {elements}
    </div>
  );
}
