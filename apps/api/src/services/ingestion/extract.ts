/**
 * Extracts plain text from various file formats (TXT, MD, JSON, plain text).
 */
export async function extractText(buffer: Buffer | string, filename: string): Promise<string> {
  if (typeof buffer === 'string') {
    return buffer;
  }

  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'txt' || ext === 'md' || ext === 'markdown') {
    return buffer.toString('utf-8');
  }

  if (ext === 'json') {
    try {
      const obj = JSON.parse(buffer.toString('utf-8'));
      return typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2);
    } catch {
      return buffer.toString('utf-8');
    }
  }

  // Fallback to utf-8 text representation
  return buffer.toString('utf-8');
}
