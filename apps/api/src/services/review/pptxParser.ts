import { inflateRawSync } from 'zlib';
import { SlideData } from './slideScanner';

const MAX_SLIDES = 30;
const MAX_EXPANDED_BYTES = 80 * 1024 * 1024;

function readZipEntries(buffer: Buffer): Map<string, Buffer> {
  let eocd = -1;
  for (let i = Math.max(0, buffer.length - 65_557); i <= buffer.length - 22; i++) {
    if (buffer.readUInt32LE(i) === 0x06054b50) eocd = i;
  }
  if (eocd < 0) throw new Error('This file is not a valid PowerPoint presentation.');
  const entryCount = buffer.readUInt16LE(eocd + 10);
  const directorySize = buffer.readUInt32LE(eocd + 12);
  let offset = buffer.readUInt32LE(eocd + 16);
  if (entryCount > 5000 || offset + directorySize > buffer.length) throw new Error('The presentation archive is malformed.');
  const entries = new Map<string, Buffer>();
  let expandedTotal = 0;
  for (let i = 0; i < entryCount; i++) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) throw new Error('The presentation archive is malformed.');
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const expandedSize = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.subarray(offset + 46, offset + 46 + nameLength).toString('utf8');
    offset += 46 + nameLength + extraLength + commentLength;
    if (!name.startsWith('ppt/') || name.endsWith('/')) continue;
    expandedTotal += expandedSize;
    if (expandedTotal > MAX_EXPANDED_BYTES || expandedSize > MAX_EXPANDED_BYTES) throw new Error('This presentation is too large to scan safely.');
    if (localOffset + 30 > buffer.length || buffer.readUInt32LE(localOffset) !== 0x04034b50) throw new Error('The presentation archive is malformed.');
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
    let data: Buffer;
    if (method === 0) data = compressed;
    else if (method === 8) data = inflateRawSync(compressed, { maxOutputLength: MAX_EXPANDED_BYTES });
    else continue;
    if (data.length !== expandedSize) throw new Error('The presentation archive failed integrity checks.');
    entries.set(name, data);
  }
  return entries;
}

function decodeXml(text: string): string {
  return text.replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(parseInt(code, 10)))
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'");
}

function slideOrder(entries: Map<string, Buffer>): string[] {
  const presentation = entries.get('ppt/presentation.xml')?.toString('utf8');
  const rels = entries.get('ppt/_rels/presentation.xml.rels')?.toString('utf8');
  if (presentation && rels) {
    const targets = new Map<string, string>();
    for (const match of rels.matchAll(/<Relationship\b([^>]*)\/?\s*>/g)) {
      const id = match[1].match(/\bId="([^"]+)"/)?.[1];
      const target = match[1].match(/\bTarget="([^"]+)"/)?.[1];
      if (id && target && /(^|\/)slides\//.test(target)) {
        const normalized = target.replace(/^\//, '').replace(/^ppt\//, '').replace(/^(\.\.\/)+/, '');
        targets.set(id, `ppt/${normalized}`);
      }
    }
    const ordered = [...presentation.matchAll(/<p:sldId\b[^>]*\br:id="([^"]+)"/g)]
      .map((match) => targets.get(match[1])).filter((path): path is string => !!path && entries.has(path));
    if (ordered.length) return ordered;
  }
  return [...entries.keys()].filter((path) => /^ppt\/slides\/slide\d+\.xml$/.test(path))
    .sort((a, b) => Number(a.match(/slide(\d+)/)?.[1]) - Number(b.match(/slide(\d+)/)?.[1]));
}

export function parsePptx(buffer: Buffer): SlideData[] {
  const entries = readZipEntries(buffer);
  const paths = slideOrder(entries);
  if (!paths.length) throw new Error('No readable slides were found in this presentation.');
  if (paths.length > MAX_SLIDES) throw new Error(`Presentations can contain up to ${MAX_SLIDES} slides.`);
  return paths.map((path, index) => {
    const xml = entries.get(path)!.toString('utf8');
    const texts = [...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((match) => decodeXml(match[1].replace(/<[^>]+>/g, '')).trim()).filter(Boolean);
    const titleMatch = xml.match(/<p:ph\b[^>]*\btype="(?:title|ctrTitle)"[\s\S]*?<\/p:sp>/);
    const title = titleMatch ? [...titleMatch[0].matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((match) => decodeXml(match[1]).trim()).filter(Boolean).join(' ') : texts[0] || `Slide ${index + 1}`;
    const body = texts.join('\n');
    return { slideNumber: index + 1, title, body };
  });
}
