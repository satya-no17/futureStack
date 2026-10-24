'use client';

import React, { useState } from 'react';
import { Building2, ArrowRight, ShieldAlert, Sparkles, Check } from 'lucide-react';

export function MultiTenantDemo() {
  const [demoDraft, setDemoDraft] = useState(
    'Our app is the #1 fastest tool, guaranteed! Trusted by millions.'
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Intro banner */}
      <div className="p-6 rounded-3xl glass-panel border border-stone-800 space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Multi-Tenant Governance Isolation Demonstration</h2>
            <p className="text-xs text-stone-400">
              See how the exact same copy produces completely different audit findings depending on the company&apos;s brand guidelines and verified facts.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-300 mb-1.5">
            Test Copy Across Both Organizations:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={demoDraft}
              onChange={(e) => setDemoDraft(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-700 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Side-by-side Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company A: Acme Enterprise Solutions */}
        <div className="p-6 rounded-3xl glass-panel border border-stone-700 space-y-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-stone-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase font-bold tracking-wider text-amber-400">Tenant A: Enterprise B2B</div>
              <h3 className="text-base font-extrabold text-white">Acme Enterprise Solutions</h3>
            </div>
            <div className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-xs">
              Score: 40/100 (Failed)
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 font-mono text-xs text-gray-300">
            &ldquo;{demoDraft}&rdquo;
          </div>

          <div className="space-y-2.5">
            <div className="text-xs font-bold text-gray-300 uppercase tracking-wider">
              Governance Findings (Strict Formal Rules):
            </div>

            <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-rose-400">Flagged: &ldquo;our app&rdquo;</span>
                <span className="text-[10px] uppercase font-bold text-amber-400">Tone Rule</span>
              </div>
              <p className="text-xs text-gray-300">
                Colloquial term prohibited. Must use &ldquo;our platform&rdquo; or &ldquo;our enterprise solution&rdquo;.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-rose-400">Flagged: &ldquo;#1 fastest tool&rdquo;</span>
                <span className="text-[10px] uppercase font-bold text-rose-400">Unverified Superlative</span>
              </div>
              <p className="text-xs text-gray-300">
                No approved benchmark supports a #1 ranking. Suggestion: &ldquo;sub-50ms latency platform&rdquo;.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-rose-400">Flagged: &ldquo;guaranteed&rdquo;</span>
                <span className="text-[10px] uppercase font-bold text-rose-400">Banned Term</span>
              </div>
              <p className="text-xs text-gray-300">
                Legal compliance forbids unqualified guarantees. Replace with &ldquo;backed by our 99.95% SLA&rdquo;.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-rose-400">Flagged: &ldquo;millions&rdquo;</span>
                <span className="text-[10px] uppercase font-bold text-rose-400">Contradicted Fact</span>
              </div>
              <p className="text-xs text-gray-300">
                Acme verified specs state 500+ enterprise clients, not millions of consumers.
              </p>
            </div>
          </div>
        </div>

        {/* Company B: Zest Social App */}
        <div className="p-6 rounded-3xl glass-panel border border-amber-500/30 space-y-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase font-bold tracking-wider text-amber-400">Tenant B: Consumer Mobile</div>
              <h3 className="text-base font-extrabold text-white">Zest Social App</h3>
            </div>
            <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs">
              Score: 78/100 (Moderate)
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 font-mono text-xs text-gray-300">
            &ldquo;{demoDraft}&rdquo;
          </div>

          <div className="space-y-2.5">
            <div className="text-xs font-bold text-gray-300 uppercase tracking-wider">
              Governance Findings (Playful Consumer Rules):
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400">&ldquo;our app&rdquo; APPROVED</span>
                <span className="text-[10px] uppercase font-bold text-emerald-400">Brand Safe</span>
              </div>
              <p className="text-xs text-gray-300">
                &ldquo;Our app&rdquo; fits Zest&apos;s conversational and friendly mobile identity perfectly!
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-400">Flagged: &ldquo;#1 fastest tool&rdquo;</span>
                <span className="text-[10px] uppercase font-bold text-amber-400">Informal Superlative</span>
              </div>
              <p className="text-xs text-gray-300">
                Better to highlight the 4.8 star App Store rating rather than an unverified #1 claim.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-rose-400">Flagged: &ldquo;millions&rdquo;</span>
                <span className="text-[10px] uppercase font-bold text-rose-400">Contradicted Fact</span>
              </div>
              <p className="text-xs text-gray-300">
                Zest verified facts confirm 500,000 active community members, not millions yet.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
