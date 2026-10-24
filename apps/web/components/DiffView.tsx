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
  oldVersionLabel = 'Earlier draft',
  newVersionLabel = 'Revised draft'
}: DiffViewProps) {
  const differences = diffWordsWithSpace(oldText || '', newText || '');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-gray-500 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span className="line-through text-rose-700 font-medium">Removed</span> from {oldVersionLabel}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span className="text-emerald-700 font-medium">Added</span> in {newVersionLabel}
          </span>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-white border border-gray-200 font-sans text-base leading-relaxed whitespace-pre-wrap shadow-sm text-gray-800">
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
          return <span key={index} className="text-gray-700">{part.value}</span>;
        })}
      </div>
    </div>
  );
}
