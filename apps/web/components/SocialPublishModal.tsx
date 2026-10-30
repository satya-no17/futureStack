'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  score: number;
  isOpen: boolean;
  onClose: () => void;
  onPublished: () => void;
}

export const SocialPublishModal: React.FC<SocialPublishModalProps> = ({
  contentId,
  contentTitle,
  score,
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
  const [cmsSiteUrl, setCmsSiteUrl] = useState('');
  const [cmsUsername, setCmsUsername] = useState('');
  const [wordpressPassword, setWordpressPassword] = useState('');
  const [wordpressSchedule, setWordpressSchedule] = useState('');
  const [webflowToken, setWebflowToken] = useState('');
  const [webflowCollectionId, setWebflowCollectionId] = useState('');
  const [webflowBodyField, setWebflowBodyField] = useState('post-body');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const publishInFlightRef = useRef(false);

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

  useEffect(() => {
    if (isOpen) return;
    setWordpressPassword('');
    setWebflowToken('');
    setCmsUsername('');
    setCmsSiteUrl('');
    setWebhookUrl('');
  }, [isOpen]);

  if (!isOpen) return null;

  const currentPreview = previews.find(p => p.channel === selectedChannel) || previews[0];

  async function handleIntentPublish() {
    if (!currentPreview || publishInFlightRef.current) return;
    publishInFlightRef.current = true;
    setPublishing(true);
    setStatusMessage(null);

    try {
      // 1. Launch zero-API web share intent in a new tab
      if (currentPreview.intentUrl) {
        window.open(currentPreview.intentUrl, '_blank', 'noopener,noreferrer');
      }

      // 2. Record published state and audit trail on backend
      const result = await api.publishToSocial(contentId, {
        channel: selectedChannel,
        method: 'intent_url',
        includeWatermark
      });

      setStatusMessage({
        type: 'success',
        text: result.status === 'published_simulated'
          ? `Opened the ${currentPreview.channelName} composer. Offline mode is active, so Inkloom did not record this handoff in workspace history.`
          : `Opened the ${currentPreview.channelName} composer. Review and publish there to complete sharing; Inkloom recorded this handoff.`
      });

      setTimeout(() => {
        if (result.status !== 'published_simulated') onPublished();
        onClose();
      }, 1400);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not record the handoff.';
      setStatusMessage({ type: 'error', text: `The composer may have opened, but Inkloom could not record the handoff: ${msg}` });
    } finally {
      setPublishing(false);
      publishInFlightRef.current = false;
    }
  }

  async function handleClipboardPublish() {
    if (!currentPreview || publishInFlightRef.current) return;
    publishInFlightRef.current = true;
    setPublishing(true);
    setStatusMessage(null);

    try {
      await navigator.clipboard.writeText(currentPreview.formattedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      const result = await api.publishToSocial(contentId, {
        channel: selectedChannel,
        method: 'clipboard_context',
        includeWatermark
      });

      setStatusMessage({
        type: 'success',
        text: result.status === 'published_simulated'
          ? 'Formatted copy is on your clipboard. Offline mode is active, so Inkloom did not record this handoff in workspace history.'
          : 'Formatted copy added to your clipboard. Paste and publish it in the destination app to complete sharing.'
      });

      setTimeout(() => {
        if (result.status !== 'published_simulated') onPublished();
        onClose();
      }, 1400);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to copy to clipboard';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setPublishing(false);
      publishInFlightRef.current = false;
    }
  }

  async function handleWebhookPublish() {
    if (!webhookUrl.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid webhook URL' });
      return;
    }

    if (publishInFlightRef.current) return;
    publishInFlightRef.current = true;
    setPublishing(true);
    setStatusMessage(null);

    try {
      const result = await api.publishToSocial(contentId, {
        channel: 'webhook',
        method: 'webhook',
        webhookUrl: webhookUrl.trim(),
        includeWatermark
      });

      if (result.status === 'published_simulated') {
        setStatusMessage({ type: 'error', text: 'Offline mode is active. The webhook was not sent; reconnect and try again.' });
        return;
      }

      setStatusMessage({
        type: 'success',
        text: 'Payload delivered to the configured webhook.'
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
      publishInFlightRef.current = false;
    }
  }

  async function handleCmsPublish() {
    const provider = selectedChannel;
    if (provider !== 'wordpress' && provider !== 'webflow') return;
    if (publishInFlightRef.current || statusMessage?.type === 'success') return;
    publishInFlightRef.current = true;
    setPublishing(true);
    setStatusMessage(null);
    try {
      const cmsSettings = provider === 'wordpress' ? {
        siteUrl: cmsSiteUrl.trim(), username: cmsUsername.trim(), applicationPassword: wordpressPassword,
        scheduledFor: wordpressSchedule ? new Date(wordpressSchedule).toISOString() : undefined
      } : {
        accessToken: webflowToken, collectionId: webflowCollectionId.trim(), bodyField: webflowBodyField.trim()
      };
      const result = await api.publishToSocial(contentId, {
        channel: provider, method: 'cms_api', cmsProvider: provider, cmsSettings
      });
      setStatusMessage({ type: 'success', text: result.status === 'scheduled'
        ? 'WordPress post scheduled. Inkloom did not retain your application password.'
        : `${provider === 'wordpress' ? 'WordPress' : 'Webflow'} post published. Inkloom did not retain your credentials.` });
      setWordpressPassword('');
      setWebflowToken('');
      setTimeout(() => { onPublished(); onClose(); }, 1800);
    } catch (err: unknown) {
      setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : 'Publishing failed. Check the connection details and try again.' });
    } finally {
      setPublishing(false);
      publishInFlightRef.current = false;
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
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-violet-50/50 via-white to-pink-50/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-200">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="social-publish-title" className="text-base font-semibold text-gray-900">Share this draft</h3>
                <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                  Approved content
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate max-w-md">
                Publish to WordPress or Webflow, or hand off copy to a social platform composer.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={publishing}
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
                disabled={publishing}
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
            disabled={publishing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedChannel === 'webhook'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="font-mono text-sm">⚡</span>
            Universal Webhook
          </button>
          <button type="button" onClick={() => setSelectedChannel('wordpress')} disabled={publishing} className={`rounded-xl border px-3 py-1.5 text-xs font-bold whitespace-nowrap transition ${selectedChannel === 'wordpress' ? 'border-violet-600 bg-violet-600 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>WordPress</button>
          <button type="button" onClick={() => setSelectedChannel('webflow')} disabled={publishing} className={`rounded-xl border px-3 py-1.5 text-xs font-bold whitespace-nowrap transition ${selectedChannel === 'webflow' ? 'border-violet-600 bg-violet-600 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>Webflow</button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="py-12 text-center text-xs text-gray-500 animate-pulse">
              Formatting compliant copy for {selectedChannel}...
            </div>
          ) : selectedChannel === 'wordpress' || selectedChannel === 'webflow' ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-4 text-xs leading-5 text-violet-950">
                <p className="font-semibold">Publish this approved draft directly</p>
                <p className="mt-1">Credentials are sent over the API for this request only. Inkloom does not save them. The post includes the current approved draft text.</p>
              </div>
              {selectedChannel === 'wordpress' ? <>
                <label className="block text-xs font-medium text-gray-700">WordPress site URL<input type="url" value={cmsSiteUrl} onChange={(event) => setCmsSiteUrl(event.target.value)} placeholder="https://example.com" disabled={publishing} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100" /></label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-medium text-gray-700">WordPress username<input autoComplete="username" value={cmsUsername} onChange={(event) => setCmsUsername(event.target.value)} disabled={publishing} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100" /></label>
                  <label className="block text-xs font-medium text-gray-700">Application password<input type="password" autoComplete="off" value={wordpressPassword} onChange={(event) => setWordpressPassword(event.target.value)} disabled={publishing} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100" /></label>
                </div>
                <label className="block text-xs font-medium text-gray-700">Schedule (optional)<input type="datetime-local" value={wordpressSchedule} onChange={(event) => setWordpressSchedule(event.target.value)} min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)} disabled={publishing} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100" /></label>
                <p className="text-[11px] leading-5 text-gray-500">Use a revocable WordPress application password, not your account password. The site must use HTTPS.</p>
              </> : <>
                <label className="block text-xs font-medium text-gray-700">Webflow API token<input type="password" autoComplete="off" value={webflowToken} onChange={(event) => setWebflowToken(event.target.value)} disabled={publishing} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100" /></label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-medium text-gray-700">CMS collection ID<input value={webflowCollectionId} onChange={(event) => setWebflowCollectionId(event.target.value)} disabled={publishing} placeholder="24-character collection ID" className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100" /></label>
                  <label className="block text-xs font-medium text-gray-700">Content field slug<input value={webflowBodyField} onChange={(event) => setWebflowBodyField(event.target.value)} disabled={publishing} placeholder="post-body" className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100" /></label>
                </div>
                <p className="text-[11px] leading-5 text-gray-500">The token needs the <code>cms:write</code> scope. Webflow title maps to “name”; body maps to the field slug above. Webflow publishes immediately.</p>
              </>}
            </div>
          ) : selectedChannel === 'webhook' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-amber-600" />
                  Send to a webhook
                </div>
                <p>
                  Send this draft and its review details to a webhook URL you control.
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
                  disabled={publishing}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                />
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Payload Preview</span>
                <pre className="text-[11px] font-mono text-gray-700 bg-white p-3 rounded-xl border border-gray-200 overflow-x-auto">
{JSON.stringify({
  event: 'inkloom.content.share_requested',
  title: contentTitle,
  channel: 'webhook',
  reviewScore: score,
  source: 'Inkloom',
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
                  <span className="font-semibold text-gray-700">Formatted copy</span>
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
                  disabled={publishing}
                  className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500"
                />
                <span className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Include the Inkloom check score in the footer
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
              role={statusMessage.type === 'error' ? 'alert' : 'status'}
              aria-live={statusMessage.type === 'error' ? 'assertive' : 'polite'}
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
            disabled={publishing}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-200/60 transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {selectedChannel === 'wordpress' || selectedChannel === 'webflow' ? (
              <button type="button" onClick={handleCmsPublish} disabled={publishing || statusMessage?.type === 'success' || (selectedChannel === 'wordpress' ? !cmsSiteUrl.trim() || !cmsUsername.trim() || !wordpressPassword.trim() : !webflowToken.trim() || !webflowCollectionId.trim() || !webflowBodyField.trim())} className="flex items-center gap-2 rounded-xl bg-violet-700 px-5 py-2.5 text-xs font-semibold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50">
                {publishing ? <><Loader2 className="h-4 w-4 animate-spin" />Sending…</> : selectedChannel === 'wordpress' ? wordpressSchedule ? 'Schedule in WordPress' : 'Publish to WordPress' : 'Publish to Webflow'}
              </button>
            ) : selectedChannel === 'webhook' ? (
              <button
                type="button"
                onClick={handleWebhookPublish}
                disabled={publishing || statusMessage?.type === 'success' || !webhookUrl.trim()}
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
                    <span>Send to webhook</span>
                  </>
                )}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleClipboardPublish}
                  disabled={publishing || statusMessage?.type === 'success' || !currentPreview}
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
                      <span>Copy formatted text</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleIntentPublish}
                  disabled={publishing || statusMessage?.type === 'success' || !currentPreview || !currentPreview.isWithinLimit}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-violet-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {publishing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Opening composer…</span>
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4" />
                      <span>Open {currentPreview?.channelName || 'social'} composer</span>
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
