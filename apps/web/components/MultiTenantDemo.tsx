'use client';

import React, { useState } from 'react';
import { Building2, Sparkles, Check, AlertCircle } from 'lucide-react';

export function MultiTenantDemo() {
  const [demoDraft, setDemoDraft] = useState(
    'Our app is the #1 fastest tool, guaranteed! Trusted by millions.'
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Intro banner */}
      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Compare How Two Different Brands Check the Same Copy</h2>
            <p className="text-xs text-gray-500">
              Type any sentence below to see how Brand A (Strict & Formal) and Brand B (Casual & Friendly) give totally different feedback.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Test Sentence (tested against both brands):
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={demoDraft}
              onChange={(e) => setDemoDraft(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-gray-300 text-sm text-gray-900 font-mono focus:outline-none focus:ring-1 focus:ring-violet-500 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Side-by-side Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company A: Acme Enterprise Solutions */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase font-bold tracking-wider text-gray-400">Brand A • Strict Business</div>
              <h3 className="text-base font-extrabold text-gray-900">Acme Enterprise</h3>
            </div>
            <div className="px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs">
              Score: 40/100 (Needs fixes)
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 font-mono text-xs text-gray-800">
            &ldquo;{demoDraft}&rdquo;
          </div>

          <div className="space-y-2.5">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Feedback from Acme&apos;s Strict Rules:
            </div>

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-rose-800">Flagged: &ldquo;our app&rdquo;</span>
                <span className="text-[10px] uppercase font-bold text-amber-700">Tone mismatch</span>
              </div>
              <p className="text-xs text-gray-700">
                Too casual for enterprise. Must use &ldquo;our platform&rdquo; or &ldquo;our enterprise solution&rdquo;.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-rose-800">Flagged: &ldquo;#1 fastest tool&rdquo;</span>
                <span className="text-[10px] uppercase font-bold text-rose-700">Unproven claim</span>
              </div>
              <p className="text-xs text-gray-700">
                No tested benchmark supports a #1 ranking. Suggestion: &ldquo;sub-50ms latency platform&rdquo;.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-rose-800">Flagged: &ldquo;guaranteed&rdquo;</span>
                <span className="text-[10px] uppercase font-bold text-rose-700">Word to avoid</span>
              </div>
              <p className="text-xs text-gray-700">
                Legal rules forbid promises without proof. Replace with &ldquo;backed by our 99.95% SLA&rdquo;.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-rose-800">Flagged: &ldquo;millions&rdquo;</span>
                <span className="text-[10px] uppercase font-bold text-rose-700">Incorrect fact</span>
              </div>
              <p className="text-xs text-gray-700">
                Acme verified specs state 500+ enterprise clients, not millions of consumers.
              </p>
            </div>
          </div>
        </div>

        {/* Company B: Zest Social App */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase font-bold tracking-wider text-violet-600">Brand B • Friendly Mobile</div>
              <h3 className="text-base font-extrabold text-gray-900">Zest Social</h3>
            </div>
            <div className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs">
              Score: 78/100 (Mostly good)
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 font-mono text-xs text-gray-800">
            &ldquo;{demoDraft}&rdquo;
          </div>

          <div className="space-y-2.5">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Feedback from Zest&apos;s Friendly Rules:
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-800">&ldquo;our app&rdquo; Approved ✓</span>
                <span className="text-[10px] uppercase font-bold text-emerald-700">Fits Brand</span>
              </div>
              <p className="text-xs text-gray-700">
                &ldquo;Our app&rdquo; fits Zest&apos;s friendly, conversational style perfectly!
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-800">Flagged: &ldquo;#1 fastest tool&rdquo;</span>
                <span className="text-[10px] uppercase font-bold text-amber-700">Unproven claim</span>
              </div>
              <p className="text-xs text-gray-700">
                Better to highlight the 4.8 star App Store rating rather than an unverified #1 claim.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-rose-800">Flagged: &ldquo;millions&rdquo;</span>
                <span className="text-[10px] uppercase font-bold text-rose-700">Incorrect fact</span>
              </div>
              <p className="text-xs text-gray-700">
                Zest facts confirm 500,000 active community members, not millions yet.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
