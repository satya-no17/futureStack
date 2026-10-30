'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertOctagon,
  BookOpen,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { api } from '../lib/api';

interface HealingSuggestion {
  id: string;
  sourceRef?: string;
  creatorCount?: number;
  distinctAuthorsConfused?: number;
  distinctViolators?: number;
  violationCount?: number;
  originalRuleText?: string;
  originalGuideline?: string;
  identifiedAmbiguity?: string;
  suggestedRevision?: string;
  dosAndDonts?: Array<{ do?: string; dont?: string }>;
  suggestedFactUpdate?: string;
  status?: string;
}

export const SelfHealingCard: React.FC = () => {
  const [suggestions, setSuggestions] = useState<HealingSuggestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSuggestions();
  }, []);

  async function loadSuggestions() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getSelfHealingSuggestions();
      setSuggestions(data.suggestions || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch self-healing suggestions');
    } finally {
      setLoading(false);
    }
  }

  async function handleApply(id: string) {
    if (!id) return;
    setApplyingId(id);
    try {
      const res = await api.applySelfHealingSuggestion(id);
      setAppliedIds(prev => [...prev, id]);
      alert(res.message);
    } catch (err: unknown) {
      alert(`Could not apply clarification: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setApplyingId(null);
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-pink-500 text-white shadow-md shadow-amber-200">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-gray-900">Self-Healing Brand Rules & Ambiguity Clarifier</h3>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100">
                Brand Rule Auto-Sync
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Discovers guidelines that repeatedly confuse multiple authors, automatically drafts clarifying revisions, and synchronizes brand knowledge across guidelines and fact sheets with 1 click.
            </p>
          </div>
        </div>

        <button
          onClick={loadSuggestions}
          disabled={loading}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
          title="Refresh Analysis"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-gray-400 animate-pulse">
          Analyzing repeated rule violation clusters and generating AI clarifications...
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
          {error}
        </div>
      ) : suggestions.length === 0 ? (
        <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 text-center space-y-1">
          <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
          <p className="text-xs font-bold text-gray-800">All Brand Rules Are Crystal Clear!</p>
          <p className="text-[11px] text-gray-400">
            No guidelines currently exceed the multi-author confusion threshold.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {suggestions.map((s) => {
            const isApplied = appliedIds.includes(s.id) || s.status === 'accepted';
            const isApplying = applyingId === s.id;

            return (
              <div
                key={s.id || s.sourceRef}
                className="p-5 rounded-2xl bg-gradient-to-br from-gray-50/70 to-violet-50/20 border border-gray-200 space-y-3 transition hover:border-violet-300"
              >
                {/* Rule Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-rose-100 text-rose-700">
                      <AlertOctagon className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-black text-gray-900">
                      High-Friction Rule: &ldquo;{s.sourceRef}&rdquo;
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                      {s.violationCount} Violations
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      {s.distinctViolators} Distinct Authors Confused
                    </span>
                  </div>
                </div>

                {/* Original vs Clarification Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-white border border-gray-200 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-gray-400">Current Vague Guideline</span>
                    <p className="text-gray-700 leading-relaxed font-mono text-[11px]">
                      {s.originalGuideline}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-emerald-700 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      AI-Clarified Rule Suggestion
                    </span>
                    <p className="text-emerald-950 leading-relaxed font-medium">
                      {s.suggestedRevision}
                    </p>
                  </div>
                </div>

                {/* Concrete Do's and Don'ts */}
                {s.dosAndDonts && s.dosAndDonts.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {s.dosAndDonts.map((d, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-white border border-gray-100 flex items-start gap-2">
                        <span className="p-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold shrink-0 mt-0.5">
                          DO
                        </span>
                        <span className="text-[11px] text-gray-700">{d.do}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggested Fact Update */}
                {s.suggestedFactUpdate && (
                  <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-900 flex items-start gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-indigo-700">Fact Sheet Synchronized Update: </span>
                      {s.suggestedFactUpdate}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => handleApply(s.id)}
                    disabled={isApplied || isApplying}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                      isApplied
                        ? 'bg-emerald-100 text-emerald-800 cursor-default'
                        : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-violet-200'
                    }`}
                  >
                    {isApplied ? (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Clarification Applied to Guidelines</span>
                      </>
                    ) : isApplying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Updating Brand Knowledge & Guidelines...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Apply AI Clarification to Brand Rules</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
