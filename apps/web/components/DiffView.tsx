'use client';

import React from 'react';
import { diffWordsWithSpace } from 'diff';

interface DiffViewProps {
  oldText: string;
  newText: string;
  oldVersionLabel?: string;
  newVersionLabel?: string;
}

export function DiffView({
  oldText,
  newText,
  oldVersionLabel = 'Previous Version',
  newVersionLabel = 'Current Revised Version'
}: DiffViewProps) {
  const differences = diffWordsWithSpace(oldText || '', newText || '');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-gray-400 pb-2 border-b border-white/10">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="line-through text-rose-300">Removed</span> from {oldVersionLabel}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
            <span className="text-emerald-300">Added</span> in {newVersionLabel}
          </span>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-black/40 border border-white/10 font-sans text-base leading-relaxed whitespace-pre-wrap">
        {differences.map((part, index) => {
          if (part.added) {
            return (
              <span key={index} className="diff-added font-semibold">
                {part.value}
              </span>
            );
          }
          if (part.removed) {
            return (
              <span key={index} className="diff-removed">
                {part.value}
              </span>
            );
          }
          return <span key={index} className="text-gray-300">{part.value}</span>;
        })}
      </div>
    </div>
  );
}
