import { lookup } from 'dns/promises';
import { isIP } from 'net';

/**
 * Zero-API and Low-API Social Publishing Engine
 * Generates instant Web Share Intent links, channel-specific context formatting,
 * and lightweight universal webhook dispatches for approved content.
 */

export interface SocialChannelConfig {
  name: string;
  maxChars: number;
  requiresUrl?: boolean;
}

export const SOCIAL_CHANNELS: Record<string, SocialChannelConfig> = {
  twitter: { name: 'Twitter / X', maxChars: 280 },
  linkedin: { name: 'LinkedIn', maxChars: 3000 },
  threads: { name: 'Threads', maxChars: 500 },
  bluesky: { name: 'Bluesky', maxChars: 300 },
  reddit: { name: 'Reddit', maxChars: 40000 },
  telegram: { name: 'Telegram', maxChars: 4096 },
  whatsapp: { name: 'WhatsApp', maxChars: 4096 }
};

export interface SocialPreviewResult {
  channel: string;
  channelName: string;
  formattedText: string;
  characterCount: number;
  maxChars: number;
  isWithinLimit: boolean;
  intentUrl: string;
  complianceWatermark: string;
}

export function formatSocialText(
  body: string,
  channel: string,
  score: number = 100,
  includeWatermark: boolean = false
): { formattedText: string; watermark: string } {
  let text = body.trim();
  const watermark = `\n\nInkloom check score: ${score}/100`;

  if (includeWatermark) {
    text += watermark;
  }

  return { formattedText: text, watermark };
}

export function generateSocialIntentUrl(
  channel: string,
  title: string,
  text: string,
  targetUrl: string = 'https://inkloom.ai'
): string {
  const encText = encodeURIComponent(text);
  const encTitle = encodeURIComponent(title);
  const encUrl = encodeURIComponent(targetUrl);

  switch (channel.toLowerCase()) {
    case 'twitter':
    case 'x':
      return `https://twitter.com/intent/tweet?text=${encText}`;

    case 'linkedin':
      // Direct post composer with pre-filled text intent or share URL
      return `https://www.linkedin.com/feed/?shareActive=true&text=${encText}`;

    case 'threads':
      return `https://www.threads.net/intent/post?text=${encText}`;

    case 'bluesky':
      return `https://bsky.app/intent/compose?text=${encText}`;

    case 'reddit':
      return `https://www.reddit.com/submit?title=${encTitle}&text=${encText}`;

    case 'telegram':
      return `https://t.me/share/url?url=${encUrl}&text=${encText}`;

    case 'whatsapp':
      return `https://api.whatsapp.com/send?text=${encText}`;

    default:
      return `https://twitter.com/intent/tweet?text=${encText}`;
  }
}

export function getSocialPreviews(
  title: string,
  body: string,
  score: number = 100,
  includeWatermark: boolean = false
): SocialPreviewResult[] {
  return Object.keys(SOCIAL_CHANNELS).map((channelKey) => {
    const config = SOCIAL_CHANNELS[channelKey];
    const { formattedText, watermark } = formatSocialText(body, channelKey, score, includeWatermark);
    const intentUrl = generateSocialIntentUrl(channelKey, title, formattedText);

    return {
      channel: channelKey,
      channelName: config.name,
      formattedText,
      characterCount: formattedText.length,
      maxChars: config.maxChars,
      isWithinLimit: formattedText.length <= config.maxChars,
      intentUrl,
      complianceWatermark: watermark
    };
  });
}

/**
 * Universal Webhook Publisher (Minimal API - no complex OAuth or App reviews required)
 * Sends compliant content payloads directly to Slack, Discord, Zapier, or Make webhooks.
 */
export async function dispatchUniversalWebhook(
  webhookUrl: string,
  payload: {
    contentId: string;
    title: string;
    body: string;
    channel: string;
    score: number;
    publishedBy: string;
    organizationName?: string;
  }
): Promise<{ success: boolean; statusCode: number; responseText: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const safeWebhookUrl = await assertPublicHttpsSite(webhookUrl);
    const res = await fetch(safeWebhookUrl, {
      method: 'POST',
      redirect: 'error',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Inkloom-Brand-Governance/1.0'
      },
      body: JSON.stringify({
        event: 'inkloom.content.published',
        publishedAt: new Date().toISOString(),
        ...payload
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const text = await res.text();
    return {
      success: res.ok,
      statusCode: res.status,
      responseText: text.slice(0, 500)
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    return {
      success: false,
      statusCode: 0,
      responseText: err.message || 'Webhook dispatch failed or timed out'
    };
  }
}
function isPrivateAddress(address: string): boolean {
  const normalized = address.toLowerCase().split('%')[0];
  if (isIP(normalized) === 6) {
    if (normalized === '::' || normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('2001:db8:') || /^fe[89ab]/.test(normalized)) return true;
    if (normalized.startsWith('::ffff:')) return isPrivateAddress(normalized.slice(7));
    return !/^[23][0-9a-f]{3}:/.test(normalized);
  }
  const octets = normalized.split('.').map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b] = octets;
  return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 0 || b === 168)) || (a === 100 && b >= 64 && b <= 127) || (a === 198 && (b === 18 || b === 19 || b === 51)) || (a === 203 && b === 0 && octets[2] === 113) || a >= 224;
}

async function assertPublicHttpsSite(site: string): Promise<URL> {
  let url: URL;
  try { url = new URL(site); } catch { throw new Error('Enter a valid HTTPS site URL.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port && url.port !== '443') throw new Error('Use a public HTTPS site URL without embedded credentials or a custom port.');
  const hostname = url.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local') || hostname.endsWith('.internal')) throw new Error('Private and local site addresses cannot be used.');
  const addresses = isIP(hostname) ? [{ address: hostname }] : await lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) throw new Error('This site address does not resolve to a public internet host.');
  return url;
}

async function responseJson(response: Response): Promise<any> {
  const text = await response.text();
  let value: any = {};
  try { value = text ? JSON.parse(text) : {}; } catch { value = {}; }
  if (!response.ok) {
    const message = typeof value.message === 'string' ? value.message : typeof value.error === 'string' ? value.error : `Destination returned HTTP ${response.status}.`;
    throw new Error(message.slice(0, 400));
  }
  return value;
}

export async function publishToWordPress(input: {
  siteUrl: string; username: string; applicationPassword: string; title: string; body: string; scheduledFor?: string;
}): Promise<{ status: 'published' | 'scheduled'; externalUrl?: string; externalId?: string }> {
  const site = await assertPublicHttpsSite(input.siteUrl);
  if (!input.username.trim() || !input.applicationPassword.trim()) throw new Error('WordPress username and application password are required.');
  const url = new URL(`${site.pathname.replace(/\/$/, '')}/wp-json/wp/v2/posts`, site.origin);
  const scheduledFor = input.scheduledFor ? new Date(input.scheduledFor) : null;
  if (scheduledFor && (!Number.isFinite(scheduledFor.getTime()) || scheduledFor.getTime() < Date.now() + 60_000)) throw new Error('Choose a publication time at least one minute in the future.');
  const password = input.applicationPassword.replace(/\s/g, '');
  const response = await fetch(url, {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(20000),
    headers: { 'Content-Type': 'application/json', Authorization: `Basic ${Buffer.from(`${input.username.trim()}:${password}`).toString('base64')}` },
    body: JSON.stringify({ title: input.title, content: input.body, status: scheduledFor ? 'future' : 'publish', ...(scheduledFor ? { date_gmt: scheduledFor.toISOString() } : {}) })
  });
  const data = await responseJson(response);
  return { status: scheduledFor ? 'scheduled' : 'published', externalUrl: typeof data.link === 'string' ? data.link : undefined, externalId: data.id ? String(data.id) : undefined };
}

export async function publishToWebflow(input: {
  accessToken: string; collectionId: string; title: string; body: string; bodyField: string;
}): Promise<{ status: 'published'; externalId?: string; externalUrl?: string }> {
  if (!input.accessToken.trim()) throw new Error('A Webflow API token is required.');
  if (!/^[a-f\d]{24}$/i.test(input.collectionId)) throw new Error('Enter a valid 24-character Webflow collection ID.');
  if (!/^[a-z][a-z\d_-]{1,49}$/i.test(input.bodyField) || ['name', 'slug'].includes(input.bodyField.toLowerCase())) throw new Error('Enter the slug of a Webflow Plain text or Rich text field (not name or slug).');
  const fieldData: Record<string, string> = {
    name: input.title.slice(0, 256),
    slug: input.title.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100) || `inkloom-${Date.now()}`,
    [input.bodyField]: input.body
  };
  const headers = { Authorization: `Bearer ${input.accessToken.trim()}`, 'Content-Type': 'application/json' };
  const base = `https://api.webflow.com/v2/collections/${input.collectionId}/items`;
  const created = await responseJson(await fetch(`${base}/insert`, {
    method: 'POST', headers, signal: AbortSignal.timeout(20000),
    body: JSON.stringify({ items: [{ isDraft: false, fieldData }] })
  }));
  const itemId = created.items?.[0]?.id;
  if (!itemId) throw new Error('Webflow created no CMS item. Check the collection fields and try again.');
  const published = await responseJson(await fetch(`${base}/publish`, {
    method: 'POST', headers, signal: AbortSignal.timeout(20000),
    body: JSON.stringify({ itemIds: [itemId] })
  }));
  if (Array.isArray(published.errors) && published.errors.length) throw new Error(`Webflow created a staged item but could not publish it: ${String(published.errors[0]).slice(0, 250)}`);
  if (!Array.isArray(published.publishedItemIds) || !published.publishedItemIds.includes(itemId)) throw new Error('Webflow created a staged item but did not confirm publication. Check the collection in Webflow before retrying.');
  return { status: 'published', externalId: String(itemId) };
}
