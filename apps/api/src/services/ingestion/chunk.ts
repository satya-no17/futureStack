export interface TextChunk {
  content: string;
  section_ref: string;
}

/**
 * Splits document text into 200-400 word chunks on headings or paragraphs,
 * maintaining section references for exact source citation.
 */
export function chunkDocument(text: string, documentTitle: string): TextChunk[] {
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: TextChunk[] = [];

  let currentHeading = `${documentTitle}, Overview`;
  let currentWords: string[] = [];
  let sectionIndex = 1;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    // Check if paragraph is a markdown heading
    const headingMatch = trimmed.match(/^#{1,4}\s+(.+)$/m);
    if (headingMatch) {
      currentHeading = `${documentTitle}, ${headingMatch[1].trim()}`;
    }

    const words = trimmed.split(/\s+/);
    if (currentWords.length + words.length > 350) {
      if (currentWords.length > 0) {
        chunks.push({
          content: currentWords.join(' '),
          section_ref: `${currentHeading} (Part ${sectionIndex++})`
        });
        // 40-word overlap for contextual continuity
        const overlap = currentWords.slice(-40);
        currentWords = [...overlap, ...words];
      } else {
        currentWords = words;
      }
    } else {
      currentWords.push(...words);
    }
  }

  if (currentWords.length > 0) {
    chunks.push({
      content: currentWords.join(' '),
      section_ref: `${currentHeading}${sectionIndex > 1 ? ` (Part ${sectionIndex})` : ''}`
    });
  }

  // If text is short and yielded no chunks, create single chunk
  if (chunks.length === 0 && text.trim().length > 0) {
    chunks.push({
      content: text.trim(),
      section_ref: `${documentTitle}, Section 1`
    });
  }

  return chunks;
}
