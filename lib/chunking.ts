import type { Chunk } from '@/types';

export function chunkText(text: string, chunkSize = 500, overlap = 50): Chunk[] {
  // remove extra newlines and trim the text
  const cleanedText = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  
  if (!cleanedText) return [];

  const chunks: Chunk[] = [];
  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < cleanedText.length) {
    // Calculate the end index for the current chunk
    const endIndex = Math.min(startIndex + chunkSize, cleanedText.length);
    // Extract the chunk content and trim it
    const chunkContent = cleanedText.slice(startIndex, endIndex).trim();

    if (chunkContent.length > 0) {
      chunks.push({
        content: chunkContent,
        chunkIndex,
      });
      chunkIndex++;
    }

    // If the endIndex reaches the end of the cleanedText, break the loop to avoid infinite looping
    if (endIndex === cleanedText.length) break;

    // Advance distance is chunkSize - overlap
    startIndex += chunkSize - overlap;
  }

  return chunks;
}