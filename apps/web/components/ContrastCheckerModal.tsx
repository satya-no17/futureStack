'use client';

import React, { useState } from 'react';
import { api } from '../lib/api';
import { Eye, CheckCircle2, XCircle, Sparkles, Sliders } from 'lucide-react';

export function ContrastCheckerModal() {
  const [fgColor, setFgColor] = useState('#FFFFFF');
  const [bgColor, setBgColor] = useState('#0B0F19');
  const [contrastResult, setContrastResult] = useState<any>(null);
  const [testingA11yText, setTestingA11yText] = useState('');
  const [textAuditIssues, setTextAuditIssues] = useState<any[]>([]);

  async function handleCheckContrast() {
    try {
      const res = await api.checkContrast(fgColor, bgColor);
      setContrastResult(res);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleAuditText() {
    if (!testingA11yText.trim()) return;
    try {
      const res = await api.auditA11yText(testingA11yText);
      setTextAuditIssues(res.issues || []);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* 1. Color Contrast Tool */}
      <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">WCAG 2.1 Color Contrast Ratio Validator</h2>
            <p className="text-xs text-gray-400">
              Computes exact relative luminance ratio (WCAG AA: 4.5:1 for normal text, 3:1 for large text).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Foreground (Text) Color:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Background Color:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-white"
                />
              </div>
            </div>

            <button
              onClick={handleCheckContrast}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20"
            >
              Calculate Contrast Ratio
            </button>
          </div>

          {/* Live Preview Box */}
          <div
            style={{ backgroundColor: bgColor, color: fgColor }}
            className="p-6 rounded-2xl border border-white/10 flex flex-col justify-between min-h-[180px] shadow-inner"
          >
            <div>
              <div className="text-xl font-bold tracking-tight mb-1">
                Inkloom Sample Headline
              </div>
              <p className="text-sm opacity-90 leading-relaxed">
                This is a sample live preview of copy rendered with the selected foreground and background palette colors.
              </p>
            </div>
            <div className="text-xs font-mono opacity-75 pt-2 border-t border-current/20">
              Sample 14px Body Copy • Sample 20px Header
            </div>
          </div>
        </div>

        {/* Results Badges */}
        {contrastResult && (
          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400">Calculated Contrast Ratio:</span>
              <span className="text-2xl font-black text-white">{contrastResult.contrastRatio}:1</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className={`p-3 rounded-xl border text-center ${
                contrastResult.wcag.aaNormalText
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                <div className="text-[10px] uppercase font-bold tracking-wider mb-1">WCAG AA Normal</div>
                <div className="text-xs font-semibold flex items-center justify-center gap-1">
                  {contrastResult.wcag.aaNormalText ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {contrastResult.wcag.aaNormalText ? 'Pass (≥4.5:1)' : 'Fail (<4.5:1)'}
                </div>
              </div>

              <div className={`p-3 rounded-xl border text-center ${
                contrastResult.wcag.aaLargeText
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                <div className="text-[10px] uppercase font-bold tracking-wider mb-1">WCAG AA Large</div>
                <div className="text-xs font-semibold flex items-center justify-center gap-1">
                  {contrastResult.wcag.aaLargeText ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {contrastResult.wcag.aaLargeText ? 'Pass (≥3.0:1)' : 'Fail (<3.0:1)'}
                </div>
              </div>

              <div className={`p-3 rounded-xl border text-center ${
                contrastResult.wcag.aaaNormalText
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}>
                <div className="text-[10px] uppercase font-bold tracking-wider mb-1">WCAG AAA Normal</div>
                <div className="text-xs font-semibold flex items-center justify-center gap-1">
                  {contrastResult.wcag.aaaNormalText ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {contrastResult.wcag.aaaNormalText ? 'Pass (≥7.0:1)' : 'Fail (<7.0:1)'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Text Accessibility & Readability Tool */}
      <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Live Readability & Alt-Text Audit Sandbox</h2>
            <p className="text-xs text-gray-400">
              Evaluates missing image descriptions, sentences over 30 words, and long all-caps blocks.
            </p>
          </div>
        </div>

        <textarea
          rows={3}
          value={testingA11yText}
          onChange={(e) => setTestingA11yText(e.target.value)}
          placeholder="Paste or write markdown text to test accessibility (e.g. '![](https://domain.com/chart.png) BUY NOW TODAY')..."
          className="w-full p-3.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
        />

        <button
          onClick={handleAuditText}
          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition"
        >
          Audit Accessibility Signals
        </button>

        {textAuditIssues.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="text-xs font-semibold text-gray-300">Accessibility Findings ({textAuditIssues.length}):</div>
            {textAuditIssues.map((iss, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-cyan-500/30 text-xs text-gray-200">
                <div className="font-bold text-cyan-400 mb-0.5">{iss.explanation}</div>
                <div className="text-gray-400 italic">Suggestion: {iss.suggestion}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
