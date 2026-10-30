'use client';

import React, { useState } from 'react';
import { WifiOff, RefreshCw, X, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { setSimulatedFailure } from '../lib/api';

export interface FallbackBannerProps {
  isSimulated?: boolean;
  onDismiss?: () => void;
  onRetry?: () => Promise<boolean | void> | boolean | void;
}

export const FallbackBanner: React.FC<FallbackBannerProps> = ({
  isSimulated = false,
  onDismiss,
  onRetry
}) => {
  const [retrying, setRetrying] = useState(false);
  const [retryResult, setRetryResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleRetry = async () => {
    setRetrying(true);
    setRetryResult(null);
    try {
      if (onRetry) {
        const connected = await onRetry();
        setRetryResult(connected === false
          ? { type: 'error', text: 'Still offline. Cached data remains available.' }
          : { type: 'success', text: 'Connection restored. Workspace data refreshed.' });
      }
    } catch {
      setRetryResult({ type: 'error', text: 'Could not reconnect. Please try again in a moment.' });
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
    if (onRetry) void handleRetry();
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
                {isSimulated ? 'Demo data active' : 'Connection unavailable'}
              </span>
              <span
                className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isSimulated
                    ? 'bg-violet-100 text-violet-800 border border-violet-200'
                    : 'bg-amber-200/70 text-amber-900 border border-amber-300'
                }`}
              >
                {isSimulated ? 'Sample workspace' : 'Cached or sample data'}
              </span>
            </div>

            <p className="text-xs text-gray-700 leading-snug">
              {isSimulated
                ? 'This demo is using sample workspace data. Changes may not sync to a live workspace.'
                : 'The service is unavailable. Cached or sample data may be shown; check before relying on or sharing changes.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
          {retryResult && (
            <span className={`text-xs font-semibold flex items-center gap-1 ${retryResult.type === 'success' ? 'text-emerald-800' : 'text-amber-900'}`}>
              {retryResult.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-700" />}
              {retryResult.text}
            </span>
          )}

          {isSimulated ? (
            <button
              onClick={handleExitSimulation}
              type="button"
              disabled={retrying}
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
