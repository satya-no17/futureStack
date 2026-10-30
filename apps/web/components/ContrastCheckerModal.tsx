'use client';

import React, { useState, useEffect } from 'react';
import { api, ContrastResult, Issue } from '../lib/api';
import { Eye, CheckCircle2, XCircle, Sliders, Loader2 } from 'lucide-react';

export interface ContrastCheckerModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function ContrastCheckerModal({ isOpen, onClose }: ContrastCheckerModalProps = {}) {
  const [fgColor, setFgColor] = useState('#111827');
  const [bgColor, setBgColor] = useState('#F9FAFB');
  const [contrastResult, setContrastResult] = useState<ContrastResult | null>(null);
  const [testingA11yText, setTestingA11yText] = useState('');
  const [textAuditIssues, setTextAuditIssues] = useState<Issue[]>([]);
  const [isCheckingContrast, setIsCheckingContrast] = useState(false);
  const [isAuditingText, setIsAuditingText] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (isOpen === false) return null;

  async function handleCheckContrast() {
    if (isCheckingContrast) return;
    setErrorMessage(null);
    setIsCheckingContrast(true);
    try {
      const res = await api.checkContrast(fgColor, bgColor);
      setContrastResult(res);
    } catch (err) {
      console.error(err);
      setErrorMessage(`Could not check these colors. ${err instanceof Error ? err.message : 'Please try again.'}`);
    } finally {
      setIsCheckingContrast(false);
    }
  }

  async function handleAuditText() {
    if (!testingA11yText.trim() || isAuditingText) return;
    setErrorMessage(null);
    setIsAuditingText(true);
    try {
      const res = await api.auditA11yText(testingA11yText);
      setTextAuditIssues(res.issues || []);
    } catch (err) {
      console.error(err);
      setErrorMessage(`Could not check this text. ${err instanceof Error ? err.message : 'Please try again.'}`);
    } finally {
      setIsAuditingText(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Color Contrast & Readability Checker"
      className="space-y-8 max-w-4xl mx-auto"
    >
      {errorMessage && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{errorMessage}</div>}
      {/* 1. Color Contrast Tool */}
      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Color Contrast & Readability Checker</h2>
            <p className="text-xs text-gray-500">
              Check if your text and background colors are easy for everyone to read on screen.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="fg-color-hex" className="block text-xs font-semibold text-gray-700 mb-1.5">
                Text Color:
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="fg-color-picker"
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  aria-label="Foreground text color picker"
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  id="fg-color-hex"
                  type="text"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  aria-label="Foreground text hex color code"
                  className="flex-1 px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs font-mono text-gray-900 shadow-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="bg-color-hex" className="block text-xs font-semibold text-gray-700 mb-1.5">
                Background Color:
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="bg-color-picker"
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  aria-label="Background color picker"
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  id="bg-color-hex"
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  aria-label="Background hex color code"
                  className="flex-1 px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs font-mono text-gray-900 shadow-sm"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleCheckContrast}
              disabled={isCheckingContrast}
              className="w-full py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isCheckingContrast ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Checking Colors...</span>
                </>
              ) : (
                <span>Check Colors</span>
              )}
            </button>
          </div>

          {/* Live Preview Box */}
          <div
            style={{ backgroundColor: bgColor, color: fgColor }}
            className="p-6 rounded-2xl border border-gray-200 flex flex-col justify-between min-h-[180px] shadow-sm transition-colors"
          >
            <div>
              <div className="text-xl font-bold tracking-tight mb-1">
                Sample Headline
              </div>
              <p className="text-sm opacity-90 leading-relaxed">
                This is a live preview of how your text looks with these chosen colors.
              </p>
            </div>
            <div className="text-xs font-mono opacity-75 pt-2 border-t border-current/20">
              Sample 14px Body • Sample 20px Headline
            </div>
          </div>
        </div>

        {/* Results Badges */}
        {contrastResult && (
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-600">Calculated Contrast Ratio:</span>
              <span className="text-2xl font-black text-gray-900">{contrastResult.contrastRatio}:1</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className={`p-3 rounded-xl border text-center ${
                contrastResult.wcag.aaNormalText
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <div className="text-[10px] uppercase font-bold tracking-wider mb-1">Normal Text</div>
                <div className="text-xs font-semibold flex items-center justify-center gap-1">
                  {contrastResult.wcag.aaNormalText ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {contrastResult.wcag.aaNormalText ? 'Easy to read' : 'Too hard to read'}
                </div>
              </div>

              <div className={`p-3 rounded-xl border text-center ${
                contrastResult.wcag.aaLargeText
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <div className="text-[10px] uppercase font-bold tracking-wider mb-1">Large Text / Titles</div>
                <div className="text-xs font-semibold flex items-center justify-center gap-1">
                  {contrastResult.wcag.aaLargeText ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {contrastResult.wcag.aaLargeText ? 'Easy to read' : 'Too hard to read'}
                </div>
              </div>

              <div className={`p-3 rounded-xl border text-center ${
                contrastResult.wcag.aaaNormalText
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                <div className="text-[10px] uppercase font-bold tracking-wider mb-1">Top Standard</div>
                <div className="text-xs font-semibold flex items-center justify-center gap-1">
                  {contrastResult.wcag.aaaNormalText ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {contrastResult.wcag.aaaNormalText ? 'Best contrast' : 'Good (meets standard)'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Text Accessibility & Readability Tool */}
      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Quick Text Readability Checker</h2>
            <p className="text-xs text-gray-500">
              Checks for missing image descriptions, sentences over 30 words, and blocks of ALL-CAPS text.
            </p>
          </div>
        </div>

        <textarea
          rows={3}
          value={testingA11yText}
          onChange={(e) => setTestingA11yText(e.target.value)}
          placeholder="Paste or write text here to test (e.g. 'Check out this chart ![](https://example.com/chart.png) and ACT NOW')..."
          aria-label="Text content for accessibility audit"
          className="w-full p-3.5 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-violet-500 shadow-sm"
        />

        <button
          type="button"
          onClick={handleAuditText}
          disabled={isAuditingText || !testingA11yText.trim()}
          className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
        >
          {isAuditingText ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Checking Text...</span>
            </>
          ) : (
            <span>Check Text</span>
          )}
        </button>

        {textAuditIssues.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="text-xs font-semibold text-gray-700">Readability Suggestions ({textAuditIssues.length}):</div>
            {textAuditIssues.map((iss, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-gray-800 space-y-1">
                <div className="font-bold text-amber-900">{iss.explanation}</div>
                <div className="text-amber-800 italic">Tip: {iss.suggestion}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
