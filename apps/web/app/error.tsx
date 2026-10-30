'use client';

import React, { useEffect } from 'react';
import { ShieldAlert, RefreshCw, AlertTriangle, ArrowRight, Home } from 'lucide-react';
import { setSimulatedFailure } from '../lib/api';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundaryPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log non-intrusively for diagnostics
    console.warn('Caught by Next.js app error boundary:', error.message);
  }, [error]);

  const handleSwitchToFallback = () => {
    setSimulatedFailure(true);
    reset();
  };

  const handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-gray-900"
    >
      <div className="max-w-xl w-full bg-white rounded-3xl border border-gray-200 shadow-xl p-8 space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 shadow-sm flex-shrink-0">
            <ShieldAlert className="w-8 h-8" aria-hidden="true" />
          </div>
          <div>
            <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 mb-1">
              Page error
            </span>
            <h1 className="text-xl font-semibold text-gray-950">This page could not load</h1>
            <p className="text-xs text-gray-600 mt-0.5">
              This page could not be loaded. Try again or return to the workspace.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
            <AlertTriangle className="w-4 h-4 text-amber-500" aria-hidden="true" />
            <span>What you can do</span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">Reload the page. If the problem continues, contact your workspace administrator.</p>
          {error?.digest && (
            <p className="text-[10px] text-gray-500 font-mono">Error ID: {error.digest}</p>
          )}
        </div>

        <div className="space-y-3">
          <div className="text-xs font-semibold text-gray-900">Try one of these actions</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => reset()}
              type="button"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              Try Again
            </button>

            <button
              onClick={handleSwitchToFallback}
              type="button"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
            >
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
              Open sample workspace
            </button>
          </div>

          <button
            onClick={handleReload}
            type="button"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
          >
            <Home className="w-3.5 h-3.5" aria-hidden="true" />
            Return to Dashboard Home
          </button>
        </div>
      </div>
    </div>
  );
}
