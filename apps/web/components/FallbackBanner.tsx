'use client';

import React, { useState } from 'react';
import { WifiOff, RefreshCw, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { setSimulatedFailure } from '../lib/api';

export interface FallbackBannerProps {
  isSimulated?: boolean;
  reason?: string | null;
  onDismiss?: () => void;
  onRetry?: () => void;
}

export const FallbackBanner: React.FC<FallbackBannerProps> = ({
  isSimulated = false,
  reason,
  onDismiss,
  onRetry
}) => {
  const [retrying, setRetrying] = useState(false);
  const [retryResult, setRetryResult] = useState<string | null>(null);

  const handleRetry = async () => {
    setRetrying(true);
    setRetryResult(null);
    try {
      if (onRetry) {
        await onRetry();
      }
    } finally {
      setRetrying(false);
    }
  };

  const handleExitSimulation = () => {
    setSimulatedFailure(false);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.has('simulate_failure')) {
        url.searchParams.delete('simulate_failure');
        window.history.replaceState({}, '', url.toString());
      }
    }
    if (onRetry) {
      onRetry();
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full bg-gradient-to-r from-amber-50 via-amber-100/70 to-violet-50 border-b border-amber-200/80 px-4 py-3 text-gray-900 shadow-sm transition-all"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-700 border border-amber-300/60 flex-shrink-0">
            {isSimulated ? (
              <Sparkles className="w-4 h-4 text-violet-700" aria-hidden="true" />
            ) : (
              <WifiOff className="w-4 h-4 text-amber-700" aria-hidden="true" />
            )}
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black tracking-tight text-gray-900">
                {isSimulated ? 'Simulation Sandbox Active' : 'Offline Fallback Mode'}
              </span>
              <span
                className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isSimulated
                    ? 'bg-violet-100 text-violet-800 border border-violet-200'
                    : 'bg-amber-200/70 text-amber-900 border border-amber-300'
                }`}
              >
                {isSimulated ? 'Simulated Outage (?simulate_failure=true)' : 'Backend Unreachable'}
              </span>
            </div>

            <p className="text-xs text-gray-700 leading-snug">
              Operating in offline fallback mode with simulated brand governance data. All scanning and inspection features remain interactive.
              {reason && !isSimulated && (
                <span className="text-gray-500 ml-1 font-mono text-[11px]">({reason})</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
          {retryResult && (
            <span className="text-xs text-emerald-800 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {retryResult}
            </span>
          )}

          {isSimulated ? (
            <button
              onClick={handleExitSimulation}
              type="button"
              className="px-3 py-1.5 rounded-xl bg-violet-700 hover:bg-violet-800 text-white text-xs font-bold transition shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-700"
            >
              Exit Simulation
            </button>
          ) : (
            <button
              onClick={handleRetry}
              disabled={retrying}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-50 border border-amber-300 text-gray-800 text-xs font-bold transition shadow-sm disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-gray-700 ${retrying ? 'animate-spin' : ''}`} />
              <span>{retrying ? 'Connecting...' : 'Retry Connection'}</span>
            </button>
          )}

          {onDismiss && (
            <button
              onClick={onDismiss}
              type="button"
              aria-label="Dismiss fallback mode banner"
              className="p-1.5 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-amber-200/50 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
