'use client';

import React from 'react';
import {
  ShieldCheck,
  ArrowRight,
  Sparkles,
  FileSearch,
  Building2,
  CheckCircle,
  BarChart3,
  Lock,
  Eye,
  Zap,
  Users,
  Globe,
  ChevronRight,
  Star,
  Award,
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="landing-page min-h-screen bg-white text-gray-900 selection:bg-violet-200">
      {/* ─── Navbar ─── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <ShieldCheck className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900">Inkloom</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm text-gray-500">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How It Works</a>
            <a href="#about" className="hover:text-gray-900 transition-colors">About</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onGetStarted}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors hidden sm:inline"
            >
              Sign In
            </button>
            <button
              onClick={onGetStarted}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Get Started
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-xs font-medium text-gray-600">
              <Sparkles className="w-3.5 h-3.5 text-violet-500" />
              AI-Powered Brand Governance
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 leading-[1.1]">
              Pre-publish with
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600">
                confidence.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed font-light">
              Inkloom automatically scans every draft against your brand guidelines, verified facts, and compliance rules — before anything goes live.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={onGetStarted}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-all shadow-sm hover:shadow-md"
              >
                Start Free Demo
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-1.5 px-5 py-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                See How It Works
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Hero visual – abstract card preview */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="relative rounded-2xl border border-gray-200 bg-gray-50/50 p-8 shadow-sm overflow-hidden">
              {/* Top bar */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-gray-200" />
                  <div className="w-3 h-3 rounded-full bg-gray-200" />
                  <div className="w-3 h-3 rounded-full bg-gray-200" />
                </div>
                <div className="flex-1 h-6 rounded-md bg-gray-100 max-w-xs" />
              </div>

              {/* Mock content */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-3">
                  <div className="h-4 rounded bg-gray-200 w-3/4" />
                  <div className="h-4 rounded bg-gray-200 w-full" />
                  <div className="h-4 rounded bg-gray-200 w-5/6" />
                  <div className="mt-4 space-y-2">
                    <div className="inline-block px-2 py-1 rounded bg-red-50 border border-red-200">
                      <span className="text-[11px] font-semibold text-red-600">⚠ Unverified claim detected</span>
                    </div>
                    <div className="h-4 rounded bg-gray-200 w-full" />
                    <div className="inline-block px-2 py-1 rounded bg-amber-50 border border-amber-200">
                      <span className="text-[11px] font-semibold text-amber-600">⚡ Tone adjustment suggested</span>
                    </div>
                    <div className="h-4 rounded bg-gray-200 w-2/3" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-white border border-gray-200 space-y-2">
                    <div className="text-xs font-bold text-gray-700">Brand Score</div>
                    <div className="text-3xl font-black text-emerald-600">92<span className="text-base text-gray-400 font-normal">/100</span></div>
                    <div className="text-[11px] text-emerald-600 font-medium">✓ Ready to publish</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-gray-200 space-y-2">
                    <div className="text-xs font-bold text-gray-700">Issues Found</div>
                    <div className="flex gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded bg-red-50 text-red-600 font-semibold">1 High</span>
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-600 font-semibold">2 Medium</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-b from-violet-50 to-transparent opacity-60 blur-3xl pointer-events-none -z-10" />
      </section>

      {/* ─── Trusted By / Social Proof ─── */}
      <section className="border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <p className="text-center text-xs font-medium uppercase tracking-widest text-gray-400 mb-8">
            Built for modern content teams
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-gray-300">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-400">
              <Building2 className="w-5 h-5" />
              <span>Enterprise SaaS</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-400">
              <Globe className="w-5 h-5" />
              <span>Marketing Agencies</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-400">
              <Users className="w-5 h-5" />
              <span>Content Teams</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-400">
              <Award className="w-5 h-5" />
              <span>Regulated Industries</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features Section ─── */}
      <section id="features" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 mb-3">Features</p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 mb-4">
              Everything you need to ship <br className="hidden sm:block" />brand-safe content
            </h2>
            <p className="text-base text-gray-500 leading-relaxed">
              One platform to scan, review, approve, and publish — with complete audit trails.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: FileSearch,
                title: 'AI Content Scanning',
                desc: 'Every draft is automatically audited against your brand voice guidelines, verified facts, and banned terms using RAG-powered AI.',
                color: 'text-violet-600 bg-violet-50',
              },
              {
                icon: ShieldCheck,
                title: 'Claim Verification',
                desc: 'Superlative claims, statistics, and product assertions are cross-checked against your approved fact database in real time.',
                color: 'text-emerald-600 bg-emerald-50',
              },
              {
                icon: Users,
                title: 'Role-Based Workflows',
                desc: 'Creators draft, reviewers approve, brand managers configure — each role sees exactly what they need.',
                color: 'text-blue-600 bg-blue-50',
              },
              {
                icon: Building2,
                title: 'Multi-Tenant Isolation',
                desc: 'Each organization gets completely isolated brand rules. The same copy can produce different results per tenant.',
                color: 'text-amber-600 bg-amber-50',
              },
              {
                icon: BarChart3,
                title: 'Governance Analytics',
                desc: 'Track violation trends, identify ambiguous brand rules, and measure team compliance scores over time.',
                color: 'text-rose-600 bg-rose-50',
              },
              {
                icon: Eye,
                title: 'Accessibility Audit',
                desc: 'Built-in WCAG contrast checker and readability analysis ensure every piece of content meets accessibility standards.',
                color: 'text-cyan-600 bg-cyan-50',
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="group p-6 rounded-2xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/80 transition-all duration-300"
              >
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${feature.color} mb-4`}>
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="py-20 md:py-28 bg-gray-50/70 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 mb-3">How It Works</p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 mb-4">
              Three steps to brand-safe publishing
            </h2>
            <p className="text-base text-gray-500 leading-relaxed">
              From draft to publication, every piece of content passes through intelligent governance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                step: '01',
                title: 'Write & Submit',
                desc: 'Creators draft marketing copy, blog posts, or social content directly in the platform and submit for AI review.',
                icon: Sparkles,
              },
              {
                step: '02',
                title: 'AI Scans & Flags',
                desc: 'Our AI engine checks tone, verifies claims against your approved facts, and flags any brand violations — all in seconds.',
                icon: Zap,
              },
              {
                step: '03',
                title: 'Review & Publish',
                desc: 'Reviewers approve or request changes with full diff views. Once signed off, content is cleared for publication with an immutable audit trail.',
                icon: CheckCircle,
              },
            ].map((item, idx) => (
              <div key={idx} className="relative text-center md:text-left">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white border border-gray-200 shadow-sm mb-5">
                  <item.icon className="w-6 h-6 text-gray-700" />
                </div>
                <div className="text-xs font-bold text-violet-500 tracking-widest mb-2">STEP {item.step}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── About Section ─── */}
      <section id="about" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div className="space-y-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-violet-600">About Inkloom</p>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 leading-tight">
                Brand governance,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
                  reimagined.
                </span>
              </h2>
              <p className="text-base text-gray-500 leading-relaxed">
                Inkloom AI is a pre-publication governance platform that ensures every piece of content aligns with your brand voice, verified facts, and compliance requirements — before it reaches your audience.
              </p>
              <p className="text-base text-gray-500 leading-relaxed">
                Built with RAG-powered AI and pgvector semantic search, Inkloom goes beyond simple keyword matching. It understands context, tone, and intent — delivering enterprise-grade brand protection with the simplicity modern teams expect.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                {[
                  { label: 'AI-Powered Scanning', icon: Sparkles },
                  { label: 'Immutable Audit Trail', icon: Lock },
                  { label: 'Multi-Tenant Ready', icon: Building2 },
                  { label: 'Role-Based Access', icon: Users },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <div className="flex-shrink-0 w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center">
                      <item.icon className="w-3.5 h-3.5 text-gray-500" />
                    </div>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            {/* About visual */}
            <div className="space-y-4">
              <div className="p-6 rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                    <Star className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900 mb-1">Semantic Understanding</div>
                    <p className="text-sm text-gray-500">
                      Unlike regex-based tools, Inkloom uses vector embeddings to understand the meaning behind your brand guidelines — catching violations that pattern matching would miss.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900 mb-1">Intent-Preserving Fixes</div>
                    <p className="text-sm text-gray-500">
                      AI doesn't just flag problems — it suggests rewrites that fix the violation while preserving the original creative intent and messaging.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900 mb-1">Ambiguity Detection</div>
                    <p className="text-sm text-gray-500">
                      When multiple team members repeatedly violate the same rule, Inkloom flags it as ambiguous — helping you refine guidelines proactively.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="py-20 md:py-24 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
            Ready to see it in action?
          </h2>
          <p className="text-base text-gray-500 max-w-xl mx-auto leading-relaxed">
            Explore the full platform with pre-loaded demo data — multiple organizations, roles, and real AI-powered content governance.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onGetStarted}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-all shadow-sm hover:shadow-md"
            >
              Launch Demo
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-400 pt-1">
            No account required · Pre-loaded demo credentials · Free forever
          </p>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-gray-100 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-gray-900 flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-bold text-gray-900">Inkloom AI</span>
              <span className="text-xs text-gray-400 ml-1">· Pre-Publication Brand Governance</span>
            </div>

            <div className="flex items-center gap-6 text-xs text-gray-400">
              <a href="#features" className="hover:text-gray-600 transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-gray-600 transition-colors">How It Works</a>
              <a href="#about" className="hover:text-gray-600 transition-colors">About</a>
            </div>

            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} Inkloom. Built for FutureStack.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
