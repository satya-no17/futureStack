'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Share2,
  ExternalLink,
  Copy,
  Check,
  Send,
  ShieldCheck,
  AlertCircle,
  Radio,
  Loader2
} from 'lucide-react';
import { api, SocialPreview } from '../lib/api';

interface SocialPublishModalProps {
  contentId: string;
  contentTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onPublished: () => void;
}

export const SocialPublishModal: React.FC<SocialPublishModalProps> = ({
  contentId,
  contentTitle,
  isOpen,
  onClose,
  onPublished
}) => {
  const [selectedChannel, setSelectedChannel] = useState<string>('twitter');
  const [includeWatermark, setIncludeWatermark] = useState<boolean>(true);
  const [previews, setPreviews] = useState<SocialPreview[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [publishing, setPublishing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadPreviews = useCallback(async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const data = await api.getSocialPreviews(contentId, includeWatermark);
      setPreviews(data.previews || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load social previews';
      setStatusMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  }, [contentId, includeWatermark]);

  useEffect(() => {
    if (isOpen && contentId) {
      queueMicrotask(() => {
        loadPreviews();
      });
    }
  }, [isOpen, contentId, loadPreviews]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentPreview = previews.find(p => p.channel === selectedChannel) || previews[0];

  async function handleIntentPublish() {
    if (!currentPreview) return;
    setPublishing(true);
    setStatusMessage(null);

    try {
      // 1. Launch zero-API web share intent in a new tab
      if (currentPreview.intentUrl) {
        window.open(currentPreview.intentUrl, '_blank', 'noopener,noreferrer');
      }

      // 2. Record published state and audit trail on backend
      await api.publishToSocial(contentId, {
        channel: selectedChannel,
        method: 'intent_url',
        includeWatermark
      });

      setStatusMessage({
        type: 'success',
        text: `Launched composer on ${currentPreview.channelName} and recorded publication in audit trail!`
      });

      setTimeout(() => {
        onPublished();
        onClose();
      }, 1400);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record publication';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setPublishing(false);
    }
  }

  async function handleClipboardPublish() {
    if (!currentPreview) return;
    setPublishing(true);
    setStatusMessage(null);

    try {
      await navigator.clipboard.writeText(currentPreview.formattedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      await api.publishToSocial(contentId, {
        channel: selectedChannel,
        method: 'clipboard_context',
        includeWatermark
      });

      setStatusMessage({
        type: 'success',
        text: `Formatted context copied to clipboard and marked as Published!`
      });

      setTimeout(() => {
        onPublished();
        onClose();
      }, 1400);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to copy to clipboard';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setPublishing(false);
    }
  }

  async function handleWebhookPublish() {
    if (!webhookUrl.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid webhook URL' });
      return;
    }

    setPublishing(true);
    setStatusMessage(null);

    try {
      await api.publishToSocial(contentId, {
        channel: 'webhook',
        method: 'webhook',
        webhookUrl: webhookUrl.trim(),
        includeWatermark
      });

      setStatusMessage({
        type: 'success',
        text: 'Payload successfully dispatched to webhook and locked as Published!'
      });

      setTimeout(() => {
        onPublished();
        onClose();
      }, 1400);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Webhook delivery failed';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setPublishing(false);
    }
  }

  const channelIcons: Record<string, string> = {
    twitter: '𝕏',
    linkedin: 'in',
    threads: '@',
    bluesky: '🦋',
    reddit: 'r/',
    telegram: '✈️',
    whatsapp: '💬',
    webhook: '⚡'
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="social-publish-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-violet-50/50 via-white to-pink-50/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-200">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="social-publish-title" className="text-base font-bold text-gray-900">Zero-API Social Publishing</h3>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Zero Keys Required
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate max-w-md">
                Publish approved copy directly using web intents or context copy without OAuth setup.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close social publish modal"
            className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Channel Selector Pills */}
        <div className="px-6 pt-4 pb-2 border-b border-gray-100 bg-gray-50/50 flex gap-2 overflow-x-auto">
          {previews.map((p) => {
            const isSelected = selectedChannel === p.channel;
            return (
              <button
                key={p.channel}
                onClick={() => setSelectedChannel(p.channel)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  isSelected
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="font-mono text-sm">{channelIcons[p.channel] || '•'}</span>
                {p.channelName}
              </button>
            );
          })}
          <button
            onClick={() => setSelectedChannel('webhook')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedChannel === 'webhook'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="font-mono text-sm">⚡</span>
            Universal Webhook
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="py-12 text-center text-xs text-gray-500 animate-pulse">
              Formatting compliant copy for {selectedChannel}...
            </div>
          ) : selectedChannel === 'webhook' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-amber-600" />
                  Low-API Universal Webhook (Slack / Discord / Zapier)
                </div>
                <p>
                  Dispatches the full compliant JSON payload to any incoming webhook URL. No OAuth developer accounts required.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Incoming Webhook URL</label>
                <input
                  type="url"
                  placeholder="https://hooks.slack.com/services/... or https://discord.com/api/webhooks/..."
                  aria-label="Incoming Webhook URL"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                />
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Payload Preview</span>
                <pre className="text-[11px] font-mono text-gray-700 bg-white p-3 rounded-xl border border-gray-200 overflow-x-auto">
{JSON.stringify({
  event: 'inkloom.content.published',
  title: contentTitle,
  channel: 'webhook',
  complianceScore: 95,
  verifiedBy: 'Inkloom AI',
  bodySnippet: currentPreview?.formattedText.slice(0, 100) + '...'
}, null, 2)}
                </pre>
              </div>
            </div>
          ) : currentPreview ? (
            <div className="space-y-4">
              {/* Context Preview Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-700">Pre-Formatted Social Copy</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-xs font-semibold px-2 py-0.5 rounded-lg ${
                        currentPreview.isWithinLimit
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700 font-bold'
                      }`}
                    >
                      {currentPreview.characterCount} / {currentPreview.maxChars} chars
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 font-sans text-xs text-gray-800 leading-relaxed whitespace-pre-wrap select-all">
                  {currentPreview.formattedText}
                </div>
              </div>

              {/* Watermark toggle */}
              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-gray-600 select-none">
                <input
                  type="checkbox"
                  checked={includeWatermark}
                  onChange={(e) => setIncludeWatermark(e.target.checked)}
                  className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500"
                />
                <span className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Attach verified brand compliance footer badge
                </span>
              </label>

              {/* Character Limit Warning if exceeded */}
              {!currentPreview.isWithinLimit && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  This draft exceeds {currentPreview.channelName}&rsquo;s {currentPreview.maxChars} character limit. Please trim before launching.
                </div>
              )}
            </div>
          ) : null}

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              )}
              {statusMessage.text}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-200/60 transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {selectedChannel === 'webhook' ? (
              <button
                type="button"
                onClick={handleWebhookPublish}
                disabled={publishing || !webhookUrl.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {publishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Dispatching...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Dispatch Webhook & Publish</span>
                  </>
                )}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleClipboardPublish}
                  disabled={publishing || !currentPreview}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-gray-300 text-gray-700 text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                >
                  {publishing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Copying...</span>
                    </>
                  ) : copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Context & Publish</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleIntentPublish}
                  disabled={publishing || !currentPreview || !currentPreview.isWithinLimit}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-violet-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {publishing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4" />
                      <span>Launch in {currentPreview?.channelName || 'Social'} & Publish</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
