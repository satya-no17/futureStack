'use client';

import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ScoreBadge({ score, size = 'md', showLabel = true }: ScoreBadgeProps) {
  let color = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  let Icon = ShieldCheck;
  let statusText = 'Approved / Brand Safe';

  if (score < 60) {
    color = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    Icon = AlertOctagon;
    statusText = 'Critical Brand Violations';
  } else if (score < 85) {
    color = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    Icon = AlertTriangle;
    statusText = 'Needs Revisions';
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
      <div className={`flex items-center gap-4 px-5 py-3 rounded-2xl border ${color} glass-panel`}>
        <div className="relative flex items-center justify-center w-14 h-14 rounded-xl bg-white/5 border border-white/10 font-black text-2xl">
          {score}
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider opacity-80">
            <Icon className="w-4 h-4" />
            Brand Governance Score
          </div>
          <div className="text-base font-bold text-white mt-0.5">
            {statusText}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {score >= 85 ? 'Eligible for pre-publication sign-off' : 'Resolve high & medium issues before publishing'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-semibold ${color}`}>
      <Icon className="w-4 h-4" />
      <span>{score}/100</span>
      {showLabel && <span className="text-xs opacity-75 font-normal">({statusText})</span>}
    </div>
  );
}
