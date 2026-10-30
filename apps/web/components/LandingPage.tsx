'use client';

import React from 'react';
import { ShieldCheck, ArrowRight, Check, FileSearch, MessageSquareText, ClipboardCheck } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const steps = [
  { number: '01', title: 'Write', text: 'Start with a draft or bring in a presentation.' },
  { number: '02', title: 'Check', text: 'See what needs attention and why, with the rule or fact behind each finding.' },
  { number: '03', title: 'Review', text: 'Apply or edit suggested changes, then send the draft for approval.' },
];

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="landing-page min-h-screen bg-white text-gray-900 selection:bg-violet-200">
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="#top" className="flex items-center gap-3" aria-label="Inkloom home">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900 text-white">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">Inkloom</span>
          </a>
          <div className="hidden items-center gap-8 text-sm text-gray-600 md:flex">
            <a href="#workflow" className="hover:text-gray-950">How it works</a>
            <a href="#principles" className="hover:text-gray-950">What we check</a>
          </div>
          <button onClick={onGetStarted} className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2">
            Open the demo <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </nav>

      <main id="top">
        <section className="relative isolate overflow-hidden bg-gradient-to-br from-violet-100 via-violet-50 to-indigo-100">
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-violet-300/35 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-indigo-300/25 blur-3xl" />
          <div className="relative mx-auto grid max-w-6xl gap-14 px-6 py-16 md:grid-cols-[1.05fr_.95fr] md:items-center md:py-24">
          <div className="max-w-xl space-y-7">
            <p className="text-sm font-semibold text-violet-700">Brand review before publishing</p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-gray-950 sm:text-5xl">
              Keep every draft true to your brand.
            </h1>
            <p className="max-w-lg text-lg leading-8 text-gray-600">
              Check copy against your approved language and facts. Understand each finding, make the call, and keep a clear review history.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <button onClick={onGetStarted} className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2">
                Try the demo <ArrowRight className="h-4 w-4" />
              </button>
              <a href="#workflow" className="text-sm font-semibold text-gray-700 underline decoration-gray-300 underline-offset-4 hover:text-violet-700">See the workflow</a>
            </div>
            <p className="text-sm text-gray-500">Demo workspace · Sample brand data · Human approval stays in control</p>
          </div>

          <div className="rounded-2xl border border-violet-200 bg-white p-5 shadow-xl shadow-violet-950/10 sm:p-7">
            <div className="mb-5 flex items-start justify-between gap-4 border-b border-gray-200 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Example review</p>
                <h2 className="mt-1 text-base font-semibold text-gray-900">Product launch copy</h2>
              </div>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">2 findings</span>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-sm leading-7 text-gray-700">Our app is the <span className="rounded bg-rose-100 px-1 text-rose-900">#1 fastest tool</span> for growing teams.</p>
                <div className="mt-4 flex items-start gap-3 border-t border-gray-100 pt-4">
                  <FileSearch className="mt-0.5 h-4 w-4 shrink-0 text-violet-700" />
                  <div><p className="text-sm font-semibold text-gray-900">Unverified ranking</p><p className="mt-1 text-sm leading-6 text-gray-600">No approved source supports “#1 fastest”. Remove the ranking or add evidence.</p></div>
                </div>
              </div>
              <div className="rounded-xl border border-violet-300 bg-gradient-to-br from-violet-100 to-indigo-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-800">Suggested edit · review before applying</p>
                <p className="mt-2 text-sm leading-6 text-gray-800">“A faster way for growing teams to get work done.”</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-600"><MessageSquareText className="h-3.5 w-3.5" /> You stay in control of the wording.</div>
              </div>
              <div className="flex items-center gap-2 border-t border-gray-200 pt-4 text-sm text-gray-600">
                <ClipboardCheck className="h-4 w-4 text-violet-700" /> Findings include the reason and a path to resolve them.
              </div>
            </div>
          </div>
          </div>
        </section>

        <section id="workflow" className="border-y border-gray-200 bg-gray-50/70">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-violet-700">A clear path from draft to approval</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-gray-950">Review the work. Keep the decision human.</h2>
            </div>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {steps.map((step) => <article key={step.number} className="border-t-2 border-violet-300 pt-5">
                <p className="text-xs font-bold tracking-widest text-violet-700">{step.number}</p>
                <h3 className="mt-3 text-lg font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-gray-600">{step.text}</p>
              </article>)}
            </div>
          </div>
        </section>

        <section id="principles" className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <div className="grid gap-10 md:grid-cols-[.8fr_1.2fr]">
            <div>
              <p className="text-sm font-semibold text-violet-700">What Inkloom checks</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-gray-950">Useful checks, with the reason attached.</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {[
                ['Brand language', 'Flag terms and tone that conflict with your guidelines.'],
                ['Claims and facts', 'Compare statements with the facts your team has approved.'],
                ['Accessibility', 'Surface readability and contrast issues that can block understanding.'],
                ['Review history', 'Keep decisions, edits, comments, and approvals together.'],
              ].map(([title, text]) => <div key={title} className="border-t border-gray-200 pt-4">
                <div className="flex items-start gap-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-700" /><div><h3 className="text-sm font-semibold text-gray-900">{title}</h3><p className="mt-1 text-sm leading-6 text-gray-600">{text}</p></div></div>
              </div>)}
            </div>
          </div>
        </section>

        <section className="border-y border-gray-200 bg-gray-50/70">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-[.75fr_1.25fr] md:py-20">
            <div><p className="text-sm font-semibold text-violet-700">Built for accountable reviews</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-gray-950">Clear reasons. Visible decisions.</h2></div>
            <div className="grid gap-8 sm:grid-cols-2">
              <div className="border-t border-gray-200 pt-4"><h3 className="text-sm font-semibold text-gray-900">Evidence beside every flag</h3><p className="mt-2 text-sm leading-6 text-gray-600">Reviewers can see the phrase, the rule behind it, and a practical next step before making a change.</p></div>
              <div className="border-t border-gray-200 pt-4"><h3 className="text-sm font-semibold text-gray-900">Your team makes the call</h3><p className="mt-2 text-sm leading-6 text-gray-600">Suggestions stay suggestions. Your people review edits and approve what gets shared.</p></div>
              <div className="border-t border-gray-200 pt-4"><h3 className="text-sm font-semibold text-gray-900">One shared standard</h3><p className="mt-2 text-sm leading-6 text-gray-600">Keep approved facts, preferred language, and words to avoid in one workspace.</p></div>
              <div className="border-t border-gray-200 pt-4"><h3 className="text-sm font-semibold text-gray-900">A record you can follow</h3><p className="mt-2 text-sm leading-6 text-gray-600">Track reviews and approvals so teams can understand what changed and who decided.</p></div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <div className="rounded-2xl border border-violet-100 bg-violet-50/60 px-6 py-10 text-center sm:px-12 sm:py-14">
            <p className="text-sm font-semibold text-violet-700">Take a closer look</p>
            <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-gray-950">See how your review process can feel.</h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-gray-600">Explore the sample workspace with example brand rules and review findings. No setup is needed.</p>
            <button onClick={onGetStarted} className="mt-7 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2">Open the demo <ArrowRight className="h-4 w-4" /></button>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-semibold text-gray-800">Inkloom</span>
          <span>Brand review that keeps people in control.</span>
        </div>
      </footer>
    </div>
  );
}
