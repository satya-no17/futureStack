'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  FileText,
  Sparkles,
  CheckCircle,
  Compass,
  X
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

  if (isCurrentlyDismissed) {
    return (
      <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-violet-200 bg-violet-50 px-5 py-4 text-sm text-violet-950 ${className}`}>
        <span><strong className="font-semibold">Need a refresher?</strong> Follow the draft review steps.</span>
        <div className="flex items-center gap-3">
          <button type="button" onClick={handleRestore} className="font-semibold text-violet-800 underline underline-offset-4">Show steps</button>
          <button type="button" onClick={handleOpenGuide} className="rounded-lg bg-violet-700 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-800">Open guide</button>
        </div>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Draft review steps"
      className={`rounded-xl border border-violet-300 bg-gradient-to-br from-violet-100 via-white to-indigo-100 p-6 shadow-sm shadow-violet-950/5 md:p-7 ${className}`}
    >
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-200 text-violet-800"><ShieldCheck className="h-5 w-5" /></div>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-gray-950">Review a draft in three steps</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">Check the copy, inspect each finding, then decide what to change or send for approval.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button type="button" onClick={handleOpenGuide} className="inline-flex items-center gap-2 rounded-lg bg-violet-700 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-800"><Compass className="h-4 w-4" />Open guide</button>
          <button type="button" onClick={handleDismiss} aria-label="Dismiss review steps" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"><X className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="grid gap-6 pt-5 md:grid-cols-3 md:gap-8">
        {[
          { number: '01', title: 'Choose a draft', text: 'Open an existing draft or create a new one.', Icon: FileText },
          { number: '02', title: 'Check the copy', text: 'Review flagged words, claims, tone, and readability.', Icon: Sparkles },
          { number: '03', title: 'Make a decision', text: 'Apply or edit a suggestion, then request approval when needed.', Icon: CheckCircle },
        ].map(({ number, title, text, Icon }) => <article key={number} className="rounded-r-xl border-l-4 border-violet-500 bg-white/80 py-3 pl-4 pr-3 shadow-sm shadow-violet-950/5">
          <div className="flex items-center gap-2 text-xs font-bold text-violet-800"><span>{number}</span><Icon className="h-4 w-4" /></div>
          <h3 className="mt-2 text-sm font-semibold text-gray-900">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-gray-600">{text}</p>
        </article>)}
      </div>
    </div>
  );
}

export default OnboardingWalkthrough;
