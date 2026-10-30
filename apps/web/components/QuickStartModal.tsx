'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Shield,
  FileText,
  Sparkles,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Users,
  Compass,
  Zap,
  HelpCircle
} from 'lucide-react';
import type { ActiveTab } from './Header';

export interface QuickStartModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStep?: number;
  onNavigateTab?: (tab: ActiveTab) => void | Promise<void>;
}

export function QuickStartModal({
  isOpen,
  onClose,
  initialStep = 0,
  onNavigateTab
}: QuickStartModalProps) {
  const clampStep = (val: number) => Math.max(0, Math.min(3, typeof val === 'number' && !isNaN(val) ? val : 0));
  const [activeStepIndex, setActiveStepIndex] = useState(() => clampStep(initialStep));
  const [activeTab, setActiveTab] = useState<'walkthrough' | 'roles' | 'scoring'>('walkthrough');
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Sync initialStep when modal opens
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setActiveStepIndex(clampStep(initialStep));
      setActiveTab('walkthrough');
    }
  }

  // Trap focus and handle Escape
  useEffect(() => {
    if (!isOpen) return;

    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const steps = [
    {
      step: 1,
      title: 'Connect Your Brand Rules',
      subtitle: 'Guidelines, approved facts, and words to avoid',
      icon: Shield,
      badge: 'Step 1 of 4',
      description:
        'Add the language and facts you want reviewers to check against.',
      highlights: [
        {
          label: 'Words to Avoid',
          text: 'List terms and claims your team wants to avoid, with a preferred alternative where useful.'
        },
        {
          label: 'Brand Voice Guidelines',
          text: 'Add the voice and writing rules your team wants reviewers to apply.'
        },
        {
          label: 'Approved Facts & Numbers',
          text: 'Add approved metrics and product facts as sources for claim checks.'
        }
      ],
      tip: 'Checks can miss context. Review the evidence and decide whether each finding applies.'
    },
    {
      step: 2,
      title: 'Write or Paste Drafts',
      subtitle: 'Draft copy and sample presentations',
      icon: FileText,
      badge: 'Step 2 of 4',
      description:
        'Choose a channel for your copy or open the sample presentation scanner.',
      highlights: [
        {
          label: 'Choose a channel',
          text: 'Set where the copy will be used so reviewers have the right context.'
        },
        {
          label: 'Instant Brand Scan',
          text: 'Choose "Check draft" to compare the current copy with your configured rules and facts.'
        },
        {
          label: 'Visual Slide Deck Scanner',
          text: 'Try the sample presentation scan for typography, layout, and claim findings.'
        }
      ],
      tip: 'Problem spans are highlighted directly in your text with color-coded marks so you can spot issues in seconds.'
    },
    {
      step: 3,
      title: 'Review findings and suggested changes',
      subtitle: 'Understand each score and recommendation',
      icon: Sparkles,
      badge: 'Step 3 of 4',
      description:
        'See which findings affect the score, inspect the reason, and choose whether to apply each suggestion.',
      highlights: [
        {
          label: 'Base 100 Scoring Formula',
          text: 'Every draft begins at 100 points. Deductions: -15 (Must Fix), -7 (Should Fix), -3 (Tip).'
        },
        {
          label: 'Score guide',
          text: 'Scores summarize detected findings; they do not replace reviewer approval or your judgment.'
        },
        {
          label: '1-Click Replacements',
          text: 'Choose "Apply suggestion" to save a new version and run the checks again.'
        }
      ],
      tip: 'Applying fixes generates a fresh draft version and immediately recalculates your brand health score.'
    },
    {
      step: 4,
      title: 'Review, approve, and share',
      subtitle: 'Team approval and external sharing',
      icon: CheckCircle,
      badge: 'Step 4 of 4',
      description:
        'Send a draft for human review, then share it through a connected workflow or platform composer.',
      highlights: [
        {
          label: 'Review Queue & Word Diffs',
          text: 'Reviewers inspect side-by-side word diffs, view changes, and provide constructive revision feedback.'
        },
        {
          label: 'Share handoff',
          text: 'Open a platform composer or copy formatted text. Complete and confirm the post on that platform.'
        },
        {
          label: 'Offline & Outage Resilience',
          text: 'When fallback data is in use, Inkloom shows a banner so you can tell sample data from live workspace data.'
        }
      ],
      tip: 'Review history records Inkloom actions. External platforms do not confirm post completion to this demo.'
    }
  ];

  const currentStep = Math.max(0, Math.min(steps.length - 1, typeof activeStepIndex === 'number' && !isNaN(activeStepIndex) ? activeStepIndex : 0));
  const currentStepData = steps[currentStep] || steps[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quickstart-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100 bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-violet-300 border border-white/10 shadow-inner">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="quickstart-title" className="text-lg font-black tracking-tight text-white">
                  Inkloom guide
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/30 text-violet-200 border border-violet-400/30">
                  Interactive Tour
                </span>
              </div>
              <p className="text-xs text-violet-200 mt-0.5">
                Brand governance and AI compliance made simple for any content creator
              </p>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close Quick-Start Guide"
            className="p-2 rounded-xl text-violet-200 hover:text-white hover:bg-white/10 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-gray-100 bg-gray-50/70 text-xs">
          <button
            onClick={() => setActiveTab('walkthrough')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeTab === 'walkthrough'
                ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-violet-600" />
            <span>4-Step Guided Tour</span>
          </button>

          <button
            onClick={() => setActiveTab('roles')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeTab === 'roles'
                ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            <span>Role Cheat Sheets</span>
          </button>

          <button
            onClick={() => setActiveTab('scoring')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeTab === 'scoring'
                ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Brand Score Mechanics</span>
          </button>
        </div>

        {/* Main Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'walkthrough' && (
            <>
              {/* Step indicator pills */}
              <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-4">
                {steps.map((s, idx) => {
                  const isCurrent = idx === currentStep;
                  const isPast = idx < currentStep;
                  return (
                    <button
                      key={s.step}
                      onClick={() => setActiveStepIndex(idx)}
                      className={`flex-1 flex items-center gap-2 p-2 rounded-xl text-left transition border ${
                        isCurrent
                          ? 'bg-violet-50 border-violet-300 text-violet-900 ring-1 ring-violet-300'
                          : isPast
                          ? 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                          : 'bg-white border-transparent text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                          isCurrent
                            ? 'bg-violet-600 text-white'
                            : isPast
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {isPast ? '✓' : s.step}
                      </span>
                      <span className="hidden sm:inline text-xs font-semibold truncate">
                        {s.title}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Current Step Card */}
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-violet-100 text-violet-700 border border-violet-200 shrink-0">
                    <currentStepData.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">
                        {currentStepData.badge}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mt-1">
                      {currentStepData.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5 font-medium">
                      {currentStepData.subtitle}
                    </p>
                    <p className="text-xs text-gray-700 mt-2 leading-relaxed">
                      {currentStepData.description}
                    </p>
                  </div>
                </div>

                {/* Highlights List */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  {currentStepData.highlights.map((h, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 hover:border-violet-200 transition space-y-1"
                    >
                      <div className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{h.label}</span>
                      </div>
                      <p className="text-[11px] text-gray-600 leading-relaxed">
                        {h.text}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Plain-English Pro Tip */}
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-start gap-3">
                  <HelpCircle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                  <div className="text-xs text-amber-900 leading-relaxed">
                    <strong className="font-bold">Plain-Language Tip: </strong>
                    {currentStepData.tip}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'roles' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-black text-gray-900">
                  Roles and responsibilities
                </h3>
                <p className="text-xs text-gray-500">
                  Each role has a different part in the review workflow:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-4 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="font-bold text-xs text-gray-900 uppercase tracking-wide">
                      Writer / Content Creator
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Draft copy, choose Check draft, review the findings, and send the version for approval.
                  </p>
                  <div className="text-[11px] text-blue-700 font-medium bg-blue-50 p-2 rounded-xl">
                    Focus: Clear findings and an accurate draft.
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="font-bold text-xs text-gray-900 uppercase tracking-wide">
                      Reviewer / Approver
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Access the &ldquo;Needs Review&rdquo; queue, inspect word-level diffs comparing original and revised copy, and sign off or request edits with mandatory revision notes.
                  </p>
                  <div className="text-[11px] text-emerald-700 font-medium bg-emerald-50 p-2 rounded-xl">
                    Focus: Quality control and formal sign-off.
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <span className="font-bold text-xs text-gray-900 uppercase tracking-wide">
                      Brand Lead / Admin
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Manage words to avoid, approved fact sheets, and brand voice guidelines. Use Brand Rule Auto-Sync to clarify rules that repeatedly confuse authors.
                  </p>
                  <div className="text-[11px] text-purple-700 font-medium bg-purple-50 p-2 rounded-xl">
                    Focus: Brand knowledge curation and team health analytics.
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="font-bold text-xs text-gray-900 uppercase tracking-wide">
                      Solo Creator
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Draft and check copy, then open a platform composer or copy the formatted text. Complete the post on that platform.
                  </p>
                  <div className="text-[11px] text-amber-700 font-medium bg-amber-50 p-2 rounded-xl">
                    Focus: Check the copy and keep control of the final post.
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scoring' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-black text-gray-900">
                  How Brand Scores Are Calculated
                </h3>
                <p className="text-xs text-gray-500">
                  Inkloom shows how findings affect the score:
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-900 text-white space-y-3">
                <div className="text-xs font-mono text-violet-300">
                  Formula: Final Score = 100 - (15 × Must Fix) - (7 × Should Fix) - (3 × Tip)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="p-3 rounded-xl bg-gray-800 border border-gray-700">
                    <div className="font-bold text-rose-400">Must Fix (-15 pts)</div>
                    <div className="text-[11px] text-gray-300 mt-1">
                      Prohibited vocabulary, contradicted specs, or legal liabilities.
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-800 border border-gray-700">
                    <div className="font-bold text-amber-400">Should Fix (-7 pts)</div>
                    <div className="text-[11px] text-gray-300 mt-1">
                      Outdated branding, unverified superlatives, or tone drift.
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-800 border border-gray-700">
                    <div className="font-bold text-sky-400">Tip (-3 pts)</div>
                    <div className="text-[11px] text-gray-300 mt-1">
                      Readability enhancements, sentence length, and minor polish.
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Score guide
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="font-bold text-emerald-900">85–100: Few findings</div>
                    <div className="text-emerald-700">Still review the copy and approval status</div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="font-bold text-amber-900">60–84: Review findings</div>
                    <div className="text-amber-700">Inspect suggestions and decide what to change</div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50 border border-rose-200">
                    <div className="font-bold text-rose-900">&lt;60: High-priority findings</div>
                    <div className="text-rose-700">Review the higher-severity items first</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="flex items-center justify-between p-4 px-6 border-t border-gray-100 bg-gray-50/80">
          {activeTab === 'walkthrough' ? (
            <>
              <button
                type="button"
                onClick={() => setActiveStepIndex(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Previous Step
              </button>

              <div className="flex items-center gap-2">
                {currentStep < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setActiveStepIndex(Math.min(steps.length - 1, currentStep + 1))}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition shadow-sm"
                  >
                    Next Step
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateTab?.('studio');
                    }}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold transition shadow-sm"
                  >
                    Start Scanning Now
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="w-full flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveTab('walkthrough')}
                className="text-xs font-semibold text-violet-700 hover:underline"
              >
                ← Return to Walkthrough
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition shadow-sm"
              >
                Got It, Close Guide
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default QuickStartModal;
