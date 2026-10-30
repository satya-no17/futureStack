'use client';

import React, { useRef, useState } from 'react';
import {
  FileText,
  CheckCircle,
  Layers,
  ArrowRight,
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file?: File) {
    if (!file || loading) return;
    setLoading(true);
    setErrorMessage(null);
    setFileName(file.name);
    setDeck(null);
    setScanResult(null);
    try {
      const result = await api.scanUploadedSlideDeck(file);
      setDeck({ title: result.title, fileType: result.fileType || 'pptx', slides: result.slides.map((slide) => ({ slideNumber: slide.slideNumber, title: slide.title, body: slide.body || '' })) });
      setScanResult(result as unknown as SlideScanResultData);
      setCurrentSlideIndex(0);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not read this presentation. Save it as .pptx and try again.');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleLoadDemoDeck() {
    if (loading) return;
    setFileName(null);
    setLoading(true);
    setErrorMessage(null);
    try {
      const demo = await api.getDemoSlideDeck();
      setDeck(demo);
      setCurrentSlideIndex(0);

      // Automatically run scan on load
      const res = await api.scanSlideDeck(demo.title, demo.fileType, demo.slides);
      setScanResult(res as unknown as SlideScanResultData);
    } catch (err: unknown) {
      setErrorMessage(`Could not load and check the sample deck. ${err instanceof Error ? err.message : String(err)}`);
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
      <div className="rounded-xl border border-gray-200 bg-white p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-violet-50 text-violet-700">
              <Layers className="h-4 w-4" />
            </span>
            <span className="text-xs font-semibold text-violet-700">Visual asset review</span>
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-gray-950">Review a deck or banner</h2>
          <p className="text-sm text-gray-600 max-w-2xl mt-1 leading-6">
            Scan a PowerPoint, PDF, or social image for brand language, approved claims, readability, and visual risks.
          </p>
          <p className="mt-2 text-xs text-gray-500">PPTX: 25 MB / 30 slides. PDF and PNG/JPG/WebP: 14 MB / 20 pages. OCR and visual findings require Gemini and need human review.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input ref={fileInputRef} type="file" accept=".pptx,.pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp,application/vnd.openxmlformats-officedocument.presentationml.presentation" className="sr-only" aria-label="Choose a presentation or image" onChange={(event) => handleUpload(event.target.files?.[0])} />
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={loading} className="flex items-center gap-2 rounded-lg bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" />{fileName ? 'Scanning asset…' : 'Loading sample…'}</> : <><FileText className="h-4 w-4" />Upload asset</>}
          </button>
          <button type="button" onClick={handleLoadDemoDeck} disabled={loading} className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">Try sample</button>
        </div>
      </div>

      {errorMessage && <div role="alert" className="flex items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"><span>{errorMessage}</span><button type="button" onClick={() => fileName ? fileInputRef.current?.click() : handleLoadDemoDeck()} disabled={loading} className="font-semibold underline underline-offset-2 disabled:opacity-50">Try again</button></div>}

      {!deck ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-violet-50 text-violet-600 mx-auto flex items-center justify-center">
            <FileText className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-semibold text-gray-900">No presentation selected</h3>
            <p className="text-xs text-gray-500">
              {fileName ? `Scanning ${fileName}…` : 'Upload a deck or banner to check extracted text and visual risks, or load the sample.'}
            </p>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={handleLoadDemoDeck}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-violet-700 hover:bg-violet-800 text-white text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading Deck...</span>
              </>
            ) : (
              <span>Load sample deck</span>
            )}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {scanResult && 'extractionNote' in scanResult && <p className="lg:col-span-3 rounded-lg border border-violet-100 bg-violet-50/60 px-4 py-3 text-xs leading-5 text-violet-900">{(scanResult as SlideScanResultData & { extractionNote?: string }).extractionNote}</p>}
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

            <section aria-label={`Extracted text from slide ${currentSlide?.slideNumber}`} className="flex min-h-[360px] flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div><p className="text-xs font-medium text-gray-500">{deck.fileType === 'image' ? 'Banner review' : deck.fileType === 'pdf' ? 'PDF page review' : 'Extracted slide text'}</p><p className="mt-1 text-sm font-semibold text-gray-800">Page {currentSlideIndex + 1} of {deck.slides.length}</p></div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${(currentSlideScan?.score || 100) >= 80 ? 'bg-emerald-50 text-emerald-800' : (currentSlideScan?.score || 100) >= 50 ? 'bg-amber-50 text-amber-800' : 'bg-rose-50 text-rose-800'}`}>Review score {currentSlideScan?.score ?? '—'}</span>
              </div>
              <div className="my-auto py-8">
                <h1 className="max-w-2xl text-2xl font-semibold leading-snug tracking-tight text-gray-950">{currentSlide?.title || `Slide ${currentSlideIndex + 1}`}</h1>
                <p className="mt-5 whitespace-pre-line text-sm leading-7 text-gray-700">{currentSlide?.body || 'No readable text was extracted from this slide.'}</p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-500">The original asset is not rendered here; visual findings are AI estimates.</p>
                {onImportToDraft && <button type="button" onClick={() => onImportToDraft(currentSlide?.title || 'Slide Draft', currentSlide?.body || '')} className="flex items-center gap-1.5 text-sm font-semibold text-violet-700 hover:text-violet-900">Use text in a draft <ArrowRight className="h-3.5 w-3.5" /></button>}
              </div>
            </section>
          </div>

          {/* Right Panel: Issues & Compliance Breakdown (1 Col) */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Review findings</h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {currentSlideScan?.issues?.length || 0} Flagged
                </span>
              </div>

              {(!currentSlideScan?.issues || currentSlideScan.issues.length === 0) ? (
                <div className="p-8 text-center space-y-2">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-semibold text-gray-800">No findings returned for this page</p>
                  <p className="text-[11px] leading-5 text-gray-500">A clear scan result is not proof of compliance. Review the original asset before publishing.</p>
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
