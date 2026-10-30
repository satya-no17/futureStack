import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface InlineMedia {
  mimeType: string;
  data: Buffer;
}

/**
 * Universal LLM wrapper returning typed JSON validated by Zod.
 * Tries Gemini API -> Ollama.
 * If AI fails or is unconfigured, throws an error so the UI can show "AI not responded".
 */
export async function llm<T>(
  prompt: string,
  schema: z.ZodType<T>,
  options: LLMOptions = { temperature: 0.1 }
): Promise<T> {
  let attempts = 0;
  let lastError: any = null;

  while (attempts < 2) {
    attempts++;
    try {
      let rawJsonString = '';

      if (process.env.GEMINI_API_KEY) {
        rawJsonString = await callGemini(prompt, options.temperature ?? 0.1);
      } else if (process.env.USE_OLLAMA === 'true') {
        rawJsonString = await callOllama(prompt);
      } else {
        throw new Error('No AI provider configured (GEMINI_API_KEY missing)');
      }

      // Strip markdown code fences if model enclosed in ```json ... ```
      const cleaned = cleanJsonString(rawJsonString);
      const parsed = JSON.parse(cleaned);
      const validated = schema.parse(parsed);
      return validated;
    } catch (err: any) {
      lastError = err;
      console.warn(`[LLM] Attempt ${attempts} failed:`, err?.message || err);
    }
  }

  const rawMsg = lastError?.message?.replace(/^AI not responded:\s*/i, '') || 'Failed to communicate with AI model';
  throw new Error(`AI not responded: ${rawMsg}`);
}

/** Multimodal Gemini request for OCR and visual brand review. */
export async function llmWithMedia<Schema extends z.ZodTypeAny>(
  prompt: string,
  schema: Schema,
  media: InlineMedia,
  options: LLMOptions = { temperature: 0.1 }
): Promise<z.infer<Schema>> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Visual review requires GEMINI_API_KEY to be configured.');
  }
  let lastError: unknown;
  const models = [process.env.GEMINI_MODEL, 'gemini-flash-lite-latest', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite-preview'].filter(Boolean) as string[];
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [
            { text: prompt },
            { inline_data: { mime_type: media.mimeType, data: media.data.toString('base64') } }
          ] }],
          generationConfig: { temperature: options.temperature ?? 0.1, maxOutputTokens: options.maxTokens ?? 8192, responseMimeType: 'application/json' }
        }),
        signal: AbortSignal.timeout(90000)
      });
      if (!response.ok) {
        const details = await response.text();
        lastError = new Error(`Gemini HTTP error ${response.status}: ${details.slice(0, 300)}`);
        if ([404, 429, 503].includes(response.status)) continue;
        break;
      }
      const responseData: any = await response.json();
      const text = responseData.candidates?.[0]?.content?.parts?.find((part: any) => part.text)?.text;
      if (!text) throw new Error('Visual model returned no readable result.');
      return schema.parse(JSON.parse(cleanJsonString(text)));
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(`Visual review could not finish: ${lastError instanceof Error ? lastError.message : 'AI service unavailable'}`);
}

function cleanJsonString(str: string): string {
  let cleaned = str.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

async function callGemini(prompt: string, temperature: number): Promise<string> {
  const models = [
    process.env.GEMINI_MODEL,
    'gemini-flash-lite-latest',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite-preview'
  ].filter(Boolean) as string[];

  let lastErr: any = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature,
            responseMimeType: 'application/json'
          }
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        lastErr = new Error(`Gemini HTTP error ${res.status}: ${errText}`);
        if (res.status === 503 || res.status === 429 || res.status === 404) {
          continue;
        }
        throw lastErr;
      }

      const data: any = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (err: any) {
      lastErr = err;
    }
  }

  throw lastErr || new Error('No candidate response from Gemini models');
}

async function callOllama(prompt: string): Promise<string> {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const res = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'qwen3.5:0.8b',
      prompt,
      stream: false,
      format: 'json'
    })
  });

  if (!res.ok) {
    throw new Error(`Ollama HTTP error ${res.status}`);
  }

  const data: any = await res.json();
  return data.response;
}
