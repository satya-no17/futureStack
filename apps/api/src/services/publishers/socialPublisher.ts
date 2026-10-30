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
  const watermark = `\n\n🛡️ Verified Brand-Compliant by Inkloom AI (${score}/100)`;

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
    const res = await fetch(webhookUrl, {
      method: 'POST',
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
