'use client';

import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ScoreBadge({ score, size = 'md', showLabel = true }: ScoreBadgeProps) {
  let color = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  let badgeColor = 'text-emerald-600';
  let Icon = ShieldCheck;
  let statusText = 'Ready to share';
  let helperText = 'No big issues found. Ready for review or publish.';

  if (score < 60) {
    color = 'text-rose-700 bg-rose-50 border-rose-200';
    badgeColor = 'text-rose-600';
    Icon = AlertOctagon;
    statusText = 'Needs attention';
    helperText = 'Fix the flagged items before publishing.';
  } else if (score < 85) {
    color = 'text-amber-700 bg-amber-50 border-amber-200';
    badgeColor = 'text-amber-600';
    Icon = AlertTriangle;
    statusText = 'Needs a few tweaks';
    helperText = 'Review the suggested fixes below.';
  }

  if (size === 'sm') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${color}`}>
        <Icon className="w-3.5 h-3.5" />
        <span>{score}/100</span>
      </span>
    );
  }

  if (size === 'lg') {
    return (
      <div className="flex items-center gap-4 px-5 py-3.5 rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className={`relative flex items-center justify-center w-14 h-14 rounded-xl font-black text-2xl border ${color}`}>
          {score}
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <Icon className="w-3.5 h-3.5 text-gray-400" />
            Brand Score
          </div>
          <div className={`text-base font-bold ${badgeColor} mt-0.5`}>
            {statusText} <span className="text-xs text-gray-400 font-normal">({score}/100)</span>
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {helperText}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${color}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{score}/100</span>
      {showLabel && <span className="opacity-80 font-normal">({statusText})</span>}
    </div>
  );
}
