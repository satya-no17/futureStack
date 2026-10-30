'use client';

import React, { useState } from 'react';
import {
  FileText,
  CheckCircle,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { api } from '../lib/api';

interface SlideItem {
  slideNumber: number;
  title: string;
  body?: string;
  text?: string;
  layoutNotes?: string;
}

interface SlideDeckData {
  title: string;
  fileType: string;
  slides: SlideItem[];
}

interface SlideIssue {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  suggestion: string;
  slideNumber?: number;
  quote?: string;
  explanation?: string;
}

interface SlideScanItem {
  slideNumber: number;
  title: string;
  score: number;
  issues: SlideIssue[];
}

interface SlideScanResultData {
  title: string;
  totalSlides: number;
  overallScore: number;
  summary?: {
    totalIssues?: number;
    highSeverity?: number;
    mediumSeverity?: number;
    lowSeverity?: number;
    claimsFlagged?: number;
    typographyIssues?: number;
    logoWarnings?: number;
  };
  slides: SlideScanItem[];
}

interface SlideDeckScannerProps {
  onImportToDraft?: (title: string, body: string) => void;
}

export const SlideDeckScanner: React.FC<SlideDeckScannerProps> = ({ onImportToDraft }) => {
  const [deck, setDeck] = useState<SlideDeckData | null>(null);
  const [scanResult, setScanResult] = useState<SlideScanResultData | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  async function handleLoadDemoDeck() {
    setLoading(true);
    try {
      const demo = await api.getDemoSlideDeck();
      setDeck(demo);
      setCurrentSlideIndex(0);

      // Automatically run scan on load
      const res = await api.scanSlideDeck(demo.title, demo.fileType, demo.slides);
      setScanResult(res as unknown as SlideScanResultData);
    } catch (err: unknown) {
      alert(`Could not load slide deck: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  const currentSlide = deck?.slides?.[currentSlideIndex];
  const currentSlideScan = scanResult?.slides?.find(
    (s: SlideScanItem) => s.slideNumber === currentSlide?.slideNumber
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-violet-500/30 text-violet-300">
              <Layers className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-violet-300">
              Automated Slide Governance
            </span>
          </div>
          <h2 className="text-xl font-black tracking-tight">Multi-Modal Visual Asset & Slide Deck Scanner</h2>
          <p className="text-xs text-gray-300 max-w-2xl mt-1">
            Scans multi-page slide decks (.pptx / .pdf) for typography standards, logo safety exclusion margins, and OCR factual claims using Factual Verification against Approved Brand Facts.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLoadDemoDeck}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white font-bold text-xs shadow-lg shadow-violet-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing Presentation...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Load Demo Pitch Deck & Scan</span>
            </>
          )}
        </button>
      </div>

      {!deck ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-violet-50 text-violet-600 mx-auto flex items-center justify-center">
            <FileText className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-gray-900">No Slide Deck Loaded</h3>
            <p className="text-xs text-gray-500">
              Click the button above to load the &ldquo;Acme Q4 Enterprise Launch Pitch Deck&rdquo; to test multi-page typography, logo padding, and semantic claims.
            </p>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={handleLoadDemoDeck}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading Deck...</span>
              </>
            ) : (
              <span>Load Demo Pitch Deck</span>
            )}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Visual Slide Stage (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Slide Navigation Thumbnails */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {deck.slides.map((s: SlideItem, idx: number) => {
                const sScan = scanResult?.slides?.find((item: SlideScanItem) => item.slideNumber === s.slideNumber);
                const score = sScan ? sScan.score : 100;
                const isSelected = idx === currentSlideIndex;

                return (
                  <button
                    key={s.slideNumber}
                    onClick={() => {
                      setCurrentSlideIndex(idx);
                      setSelectedIssueId(null);
                    }}
                    className={`flex-1 min-w-[120px] p-3 rounded-2xl border text-left transition ${
                      isSelected
                        ? 'bg-violet-50/80 border-violet-400 shadow-sm ring-2 ring-violet-500/20'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-gray-500">Slide {s.slideNumber}</span>
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                          score >= 80
                            ? 'bg-emerald-50 text-emerald-700'
                            : score >= 50
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {score}/100
                      </span>
                    </div>
                    <div className="text-xs font-bold text-gray-800 truncate">{s.title || `Slide ${s.slideNumber}`}</div>
                  </button>
                );
              })}
            </div>

            {/* Simulated 16:9 Slide Canvas with Bounding Boxes */}
            <div className="relative aspect-[16/9] bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-8 text-white shadow-2xl overflow-hidden border border-slate-800 flex flex-col justify-between">
              {/* Top Navigation in Slide Canvas */}
              <div className="flex items-start justify-between">
                {/* Logo with Exclusion Zone Visual Indicator */}
                <div className="relative group">
                  <div className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-xs font-extrabold tracking-wider">
                    ACME ENTERPRISE
                  </div>
                  {/* Bounding Box for Logo Padding */}
                  {currentSlideScan?.issues?.some((i: SlideIssue) => i.type === 'logo_exclusion') && (
                    <div className="absolute -inset-2 border-2 border-dashed border-amber-400 rounded-xl bg-amber-500/10 animate-pulse pointer-events-none flex items-center justify-center">
                      <span className="text-[9px] font-black uppercase text-amber-300 bg-amber-950/80 px-1 rounded absolute -top-3">
                        Logo Margin &lt;24px
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-gray-300">Slide {currentSlideIndex + 1} of {deck.slides.length}</span>
                  <div
                    className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                      (currentSlideScan?.score || 100) >= 80
                        ? 'bg-emerald-500 text-white'
                        : (currentSlideScan?.score || 100) >= 50
                        ? 'bg-amber-500 text-black'
                        : 'bg-rose-500 text-white'
                    }`}
                  >
                    Score: {currentSlideScan?.score || 100}
                  </div>
                </div>
              </div>

              {/* Center Content */}
              <div className="space-y-4 my-auto max-w-xl">
                {/* Slide Title with Typography Highlight */}
                <div className="relative inline-block">
                  <h1
                    className={`text-2xl font-black tracking-tight leading-snug ${
                      currentSlideScan?.issues?.some((i: SlideIssue) => i.type === 'typography')
                        ? 'bg-amber-400/20 px-2 py-1 rounded-lg border border-amber-400/40 text-amber-200'
                        : 'text-white'
                    }`}
                  >
                    {currentSlide?.title}
                  </h1>
                  {currentSlideScan?.issues?.some((i: SlideIssue) => i.type === 'typography') && (
                    <span className="absolute -top-3 -right-3 px-1.5 py-0.5 rounded-md bg-amber-500 text-black text-[9px] font-extrabold uppercase shadow">
                      Typography Alert
                    </span>
                  )}
                </div>

                {/* Slide Body with Claim Bounding Box */}
                <div className="relative">
                  <p
                    className={`text-sm text-gray-200 leading-relaxed ${
                      currentSlideScan?.issues?.some((i: SlideIssue) => i.type.includes('claim') || i.type === 'banned_term')
                        ? 'bg-rose-500/20 p-3 rounded-2xl border border-rose-500/40 text-rose-100'
                        : ''
                    }`}
                  >
                    {currentSlide?.body}
                  </p>
                  {currentSlideScan?.issues?.some((i: SlideIssue) => i.type.includes('claim')) && (
                    <span className="absolute -top-3 right-2 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-extrabold uppercase shadow-md flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" />
                      Fact Mismatch Detected
                    </span>
                  )}
                </div>
              </div>

              {/* Slide Footer */}
              <div className="flex items-center justify-between text-[11px] text-gray-300 border-t border-white/10 pt-4">
                <span>Inkloom Brand Governance AI • Confidential</span>
                {onImportToDraft && (
                  <button
                    onClick={() => onImportToDraft(currentSlide?.title || 'Slide Draft', currentSlide?.body || '')}
                    className="flex items-center gap-1.5 text-violet-300 hover:text-white font-bold transition"
                  >
                    Import Slide Text into Draft Editor <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: Issues & Compliance Breakdown (1 Col) */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900">Slide Issues & Violations</h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {currentSlideScan?.issues?.length || 0} Flagged
                </span>
              </div>

              {(!currentSlideScan?.issues || currentSlideScan.issues.length === 0) ? (
                <div className="p-8 text-center space-y-2">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-bold text-gray-800">Slide is 100% Compliant!</p>
                  <p className="text-[11px] text-gray-500">
                    No typography violations, logo margin issues, or unverified claims found on this slide.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {currentSlideScan.issues.map((issue: SlideIssue) => {
                    const isSelected = selectedIssueId === issue.id;
                    return (
                      <div
                        key={issue.id}
                        onClick={() => setSelectedIssueId(issue.id)}
                        className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition ${
                          issue.severity === 'high'
                            ? isSelected ? 'bg-rose-50 border-rose-400' : 'bg-rose-50/50 border-rose-200 hover:border-rose-300'
                            : isSelected ? 'bg-amber-50 border-amber-400' : 'bg-amber-50/50 border-amber-200 hover:border-amber-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                              issue.severity === 'high'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {issue.type.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono">Slide {issue.slideNumber}</span>
                        </div>

                        <div className="font-bold text-gray-900 mb-1">
                          &ldquo;{issue.quote}&rdquo;
                        </div>
                        <p className="text-[11px] text-gray-600 mb-2 leading-relaxed">
                          {issue.explanation}
                        </p>

                        {issue.suggestion && (
                          <div className="p-2 rounded-xl bg-white border border-gray-200 text-[11px] text-emerald-800 font-medium">
                            <span className="font-bold text-emerald-700">Fix Suggestion: </span>
                            {issue.suggestion}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Overall Deck Metrics */}
            {scanResult?.summary && (
              <div className="pt-4 border-t border-gray-100 space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500">
                  Deck Summary Across {scanResult.totalSlides} Slides
                </span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="text-sm font-black text-rose-600">{scanResult.summary.claimsFlagged}</div>
                    <div className="text-[9px] text-gray-500 uppercase font-semibold">Claims</div>
                  </div>
                  <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="text-sm font-black text-amber-600">{scanResult.summary.typographyIssues}</div>
                    <div className="text-[9px] text-gray-500 uppercase font-semibold">Typography</div>
                  </div>
                  <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="text-sm font-black text-indigo-600">{scanResult.summary.logoWarnings}</div>
                    <div className="text-[9px] text-gray-500 uppercase font-semibold">Logo Margin</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
