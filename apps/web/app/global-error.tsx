'use client';

import React from 'react';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-gray-900 font-sans">
        <div
          role="alert"
          aria-live="assertive"
          className="max-w-md w-full bg-white rounded-3xl border border-gray-200 shadow-2xl p-8 space-y-6 text-center"
        >
          <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert className="w-8 h-8" aria-hidden="true" />
          </div>

          <div className="space-y-1.5">
              <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
              Page error
            </span>
            <h1 className="text-xl font-semibold text-gray-950">Inkloom could not load</h1>
            <p className="text-xs text-gray-600">
              Reload the app. If the problem continues, contact your workspace administrator.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => reset()}
              type="button"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              Reset & Try Again
            </button>

            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.reload();
                }
              }}
              type="button"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-xs font-semibold transition"
            >
              <Home className="w-3.5 h-3.5" aria-hidden="true" />
              Reload Application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
