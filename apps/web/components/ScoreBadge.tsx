'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, Info, ChevronDown } from 'lucide-react';

export interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  issuesCount?: {
    high?: number;
    medium?: number;
    low?: number;
  };
}

export function ScoreBadge({
  score,
  size = 'md',
  showLabel = true,
  issuesCount
}: ScoreBadgeProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverId = useId();

  let color = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  let badgeColor = 'text-emerald-600';
  let Icon = ShieldCheck;
  let statusText = 'Ready to share (85-100)';
  let helperText = 'No critical brand issues found. Ready for review or publish.';

  if (score < 60) {
    color = 'text-rose-700 bg-rose-50 border-rose-200';
    badgeColor = 'text-rose-600';
    Icon = AlertOctagon;
    statusText = 'Needs attention (<60)';
    helperText = 'Fix flagged high-severity items before publishing.';
  } else if (score < 85) {
    color = 'text-amber-700 bg-amber-50 border-amber-200';
    badgeColor = 'text-amber-600';
    Icon = AlertTriangle;
    statusText = 'Needs a few tweaks (60-84)';
    helperText = 'Review suggested fixes to reach the 85+ passing threshold.';
  }

  // Close breakdown on Escape or outside click
  useEffect(() => {
    if (!showBreakdown) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowBreakdown(false);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowBreakdown(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBreakdown]);

  // Plain-English breakdown popover content
  const renderBreakdownCard = () => (
    <div
      id={popoverId}
      role="region"
      aria-label="Score calculation breakdown"
      className="absolute top-full left-0 mt-2 z-50 w-80 p-4 bg-white rounded-2xl shadow-xl border border-gray-200 text-left text-xs space-y-3 animate-in fade-in-0 zoom-in-95"
    >
      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
        <span className="font-extrabold text-gray-900 text-sm">Brand Score Formula</span>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
          Base: 100 pts
        </span>
      </div>

      <p className="text-gray-600 leading-relaxed text-[11px]">
        Every draft starts with 100 points. Points are deducted based on rule violation severity:
      </p>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50 border border-rose-100">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="font-bold text-rose-800">Must Fix (High)</span>
          </div>
          <div className="text-rose-700 font-semibold">
            {issuesCount?.high !== undefined ? `${issuesCount.high} × -15 pts` : '-15 points each'}
          </div>
        </div>

        <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 border border-amber-100">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="font-bold text-amber-800">Should Fix (Medium)</span>
          </div>
          <div className="text-amber-700 font-semibold">
            {issuesCount?.medium !== undefined ? `${issuesCount.medium} × -7 pts` : '-7 points each'}
          </div>
        </div>

        <div className="flex items-center justify-between p-2 rounded-lg bg-sky-50 border border-sky-100">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            <span className="font-bold text-sky-800">Tip (Low)</span>
          </div>
          <div className="text-sky-700 font-semibold">
            {issuesCount?.low !== undefined ? `${issuesCount.low} × -3 pts` : '-3 points each'}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-2 space-y-1">
        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
          Approval Status Thresholds
        </div>
        <ul className="space-y-0.5 text-[11px] text-gray-600">
          <li className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span><strong className="text-emerald-700">85–100:</strong> Ready to share</span>
          </li>
          <li className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span><strong className="text-amber-700">60–84:</strong> Needs a few tweaks</span>
          </li>
          <li className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span><strong className="text-rose-700">&lt;60:</strong> Needs attention</span>
          </li>
        </ul>
      </div>

      <div className="text-[10px] text-gray-400 text-center pt-1">
        Press Esc or click outside to close
      </div>
    </div>
  );

  if (size === 'sm') {
    return (
      <div ref={containerRef} className="relative inline-flex items-center">
        <button
          type="button"
          tabIndex={0}
          aria-haspopup="dialog"
          aria-expanded={showBreakdown}
          aria-label={`Brand Score ${score}/100, ${statusText}. Click to view score calculation formula.`}
          onClick={() => setShowBreakdown((prev) => !prev)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setShowBreakdown((prev) => !prev);
            }
          }}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition cursor-pointer hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${color}`}
        >
          <Icon className="w-3.5 h-3.5" />
          <span>{score}/100</span>
        </button>
        {showBreakdown && renderBreakdownCard()}
      </div>
    );
  }

  if (size === 'lg') {
    return (
      <div ref={containerRef} className="relative inline-block">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 px-5 py-3.5 rounded-2xl border border-gray-200 bg-white shadow-sm">
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
          <button
            type="button"
            tabIndex={0}
            aria-expanded={showBreakdown}
            aria-label="View brand score formula breakdown"
            onClick={() => setShowBreakdown((prev) => !prev)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setShowBreakdown((prev) => !prev);
              }
            }}
            className="sm:ml-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            <Info className="w-3.5 h-3.5 text-gray-500" />
            <span>Formula</span>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showBreakdown ? 'rotate-180' : ''}`} />
          </button>
        </div>
        {showBreakdown && renderBreakdownCard()}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative inline-flex items-center">
      <button
        type="button"
        tabIndex={0}
        aria-haspopup="dialog"
        aria-expanded={showBreakdown}
        aria-label={`Brand Score ${score}/100, ${statusText}. Click to view formula.`}
        onClick={() => setShowBreakdown((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setShowBreakdown((prev) => !prev);
          }
        }}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${color}`}
      >
        <Icon className="w-3.5 h-3.5" />
        <span>{score}/100</span>
        {showLabel && <span className="opacity-80 font-normal">({statusText})</span>}
        <Info className="w-3 h-3 opacity-60 ml-0.5" />
      </button>
      {showBreakdown && renderBreakdownCard()}
    </div>
  );
}

export default ScoreBadge;
