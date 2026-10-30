'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  FileText,
  Sparkles,
  CheckCircle,
  Compass,
  X,
  ArrowRight,
  Eye
} from 'lucide-react';

export interface OnboardingWalkthroughProps {
  onOpenQuickStart?: () => void;
  onStartTour?: () => void;
  onDismiss?: () => void;
  isDismissed?: boolean;
  className?: string;
}

function safeGetLocalStorage(key: string): string | null {
  try {
    if (typeof window !== 'undefined') {
      const storage: Storage | undefined = typeof localStorage !== 'undefined' ? localStorage : window.localStorage;
      if (storage) return storage.getItem(key);
    }
  } catch {
    // Gracefully handle SecurityError in sandboxed iframes or restricted storage
  }
  return null;
}

function safeSetLocalStorage(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined') {
      const storage: Storage | undefined = typeof localStorage !== 'undefined' ? localStorage : window.localStorage;
      if (storage) storage.setItem(key, value);
    }
  } catch {
    // Gracefully ignore write failures in restricted environments
  }
}

export function OnboardingWalkthrough({
  onOpenQuickStart,
  onStartTour,
  onDismiss,
  isDismissed: controlledDismissed,
  className = ''
}: OnboardingWalkthroughProps) {
  const [dismissed, setDismissed] = useState(() => {
    return safeGetLocalStorage('inkloom_onboarding_dismissed') === 'true';
  });

  const isCurrentlyDismissed = controlledDismissed !== undefined ? controlledDismissed : dismissed;

  const handleDismiss = () => {
    setDismissed(true);
    safeSetLocalStorage('inkloom_onboarding_dismissed', 'true');
    onDismiss?.();
  };

  const handleRestore = () => {
    setDismissed(false);
    safeSetLocalStorage('inkloom_onboarding_dismissed', 'false');
  };

  const handleOpenGuide = () => {
    if (onOpenQuickStart) {
      onOpenQuickStart();
    } else if (onStartTour) {
      onStartTour();
    }
  };

  // Minimized state bar
  if (isCurrentlyDismissed) {
    return (
      <div className={`flex items-center justify-between px-4 py-2.5 rounded-2xl bg-violet-50/80 border border-violet-100 text-xs text-violet-900 ${className}`}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-600" />
          <span className="font-semibold">First time here?</span>
          <span className="text-violet-700 hidden sm:inline">Learn how Inkloom AI protects your brand in 3 simple steps.</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRestore}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-white hover:bg-violet-100 text-violet-800 border border-violet-200 font-bold text-xs transition shadow-2xs"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Show Tour</span>
          </button>
          <button
            type="button"
            onClick={handleOpenGuide}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs transition shadow-2xs"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Quick-Start Guide</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Inkloom Onboarding Walkthrough"
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-950 via-slate-900 to-indigo-950 text-white p-6 shadow-xl border border-violet-800/40 ${className}`}
    >
      {/* Decorative gradient glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header Row */}
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/10">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-500/20 text-violet-300 border border-violet-400/30 flex items-center justify-center shrink-0 shadow-inner">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                How Inkloom AI Works: Step 1 → Step 2 → Step 3
              </h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                New User Guide
              </span>
            </div>
            <p className="text-xs text-violet-200/90 mt-0.5 max-w-2xl leading-relaxed">
              Your brand guardian that checks content against tone guidelines, verified facts, and banned words before you hit publish.
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
          <button
            type="button"
            onClick={handleOpenGuide}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-bold text-xs transition shadow-lg shadow-violet-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Open Quick-Start Guide</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss onboarding walkthrough banner"
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-violet-200 hover:text-white font-medium text-xs transition border border-white/10"
          >
            <X className="w-3.5 h-3.5" />
            <span>Dismiss</span>
          </button>
        </div>
      </div>

      {/* 3 Visually Distinct Step Cards */}
      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-4 pt-5">
        {/* Step 1 */}
        <div className="relative p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-violet-400/50 transition backdrop-blur-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-400/20">
              Step 1
            </span>
            <FileText className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Select or Create a Draft</h3>
            <p className="text-xs text-gray-300 mt-1 leading-relaxed">
              Choose from existing sample drafts in the left sidebar or click <strong>New Draft</strong>. Select your channel (LinkedIn, Twitter/X, Blog, or Press Release).
            </p>
          </div>
          <div className="text-[11px] text-violet-300/80 font-medium pt-1 flex items-center gap-1">
            <span>Tip: Try loading a seeded sample draft to test</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Step 2 */}
        <div className="relative p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-violet-400/50 transition backdrop-blur-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/20">
              Step 2
            </span>
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Instant Brand Health Scan</h3>
            <p className="text-xs text-gray-300 mt-1 leading-relaxed">
              Click <strong>&ldquo;Check My Words&rdquo;</strong> to run real-time AI scanning. Inkloom highlights prohibited vocabulary, unverified claims, and tone drift.
            </p>
          </div>
          <div className="text-[11px] text-indigo-300/80 font-medium pt-1 flex items-center gap-1">
            <span>Color marks: Red (Must Fix), Amber (Should Fix)</span>
          </div>
        </div>

        {/* Step 3 */}
        <div className="relative p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-violet-400/50 transition backdrop-blur-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/20">
              Step 3
            </span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Apply 1-Click Fixes & Publish</h3>
            <p className="text-xs text-gray-300 mt-1 leading-relaxed">
              Click <strong>&ldquo;Use This Fix&rdquo;</strong> on issues to instantly replace copy and elevate your score to 85+. Then submit for team review or Zero-API publish.
            </p>
          </div>
          <div className="text-[11px] text-emerald-300/80 font-medium pt-1 flex items-center gap-1">
            <span>Formula: Base 100 - (15H + 7M + 3L)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnboardingWalkthrough;
