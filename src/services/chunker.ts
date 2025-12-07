// Chunking configuration
export const CHUNK_SIZE = 1000; // characters per chunk
export const CHUNK_OVERLAP = 200; // overlapping characters between chunks

export interface TextChunk {
  content: string;
  chunkIndex: number;
  startChar: number;
  endChar: number;
  charCount: number;
}

/**
 * Splits text into overlapping chunks
 * @param text - The full text to split
 * @param chunkSize - Maximum characters per chunk (default: 1000)
 * @param overlap - Number of overlapping characters (default: 200)
 * @returns Array of TextChunk objects
 */
export function splitTextIntoChunks(
  text: string,
  chunkSize: number = CHUNK_SIZE,
  overlap: number = CHUNK_OVERLAP
): TextChunk[] {
  const chunks: TextChunk[] = [];

  // Handle empty or short text
  if (!text || text.length === 0) {
    return chunks;
  }

  // If text is shorter than chunk size, return as single chunk
  if (text.length <= chunkSize) {
    chunks.push({
      content: text,
      chunkIndex: 0,
      startChar: 0,
      endChar: text.length,
      charCount: text.length,
    });
    return chunks;
  }

  // Calculate step size (how far to move for each new chunk)
  const stepSize = chunkSize - overlap;
  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < text.length) {
    // Calculate end index for this chunk
    let endIndex = Math.min(startIndex + chunkSize, text.length);

    // Extract the chunk
    let chunkContent = text.slice(startIndex, endIndex);

    // Try to break at sentence or word boundary (if not at end of text)
    if (endIndex < text.length) {
      chunkContent = breakAtBoundary(chunkContent);
      endIndex = startIndex + chunkContent.length;
    }

    // Create chunk object
    chunks.push({
      content: chunkContent.trim(),
      chunkIndex: chunkIndex,
      startChar: startIndex,
      endChar: endIndex,
      charCount: chunkContent.trim().length,
    });

    // Move to next chunk position
    startIndex += stepSize;
    chunkIndex++;

    // Prevent infinite loop if stepSize is 0 or negative
    if (stepSize <= 0) {
      break;
    }
  }

  return chunks;
}

/**
 * Tries to break text at a sentence or word boundary
 * Looks for period, newline, or space near the end
 * @param text - Text to find boundary in
 * @returns Text trimmed at best boundary
 */
function breakAtBoundary(text: string): string {
  // Look in the last 20% of the chunk for a good break point
  const searchStart = Math.floor(text.length * 0.8);
  const searchText = text.slice(searchStart);

  // Priority 1: Break at sentence end (period, !, ?)
  const sentenceEnd = searchText.lastIndexOf(". ");
  if (sentenceEnd !== -1) {
    return text.slice(0, searchStart + sentenceEnd + 1);
  }

  // Priority 2: Break at newline
  const newlineIndex = searchText.lastIndexOf("\n");
  if (newlineIndex !== -1) {
    return text.slice(0, searchStart + newlineIndex);
  }

  // Priority 3: Break at space (word boundary)
  const spaceIndex = searchText.lastIndexOf(" ");
  if (spaceIndex !== -1) {
    return text.slice(0, searchStart + spaceIndex);
  }

  // No good boundary found, return original
  return text;
}

/**
 * Gets chunk statistics
 * @param chunks - Array of text chunks
 * @returns Object with statistics
 */
export function getChunkStats(chunks: TextChunk[]): {
  totalChunks: number;
  totalCharacters: number;
  avgChunkSize: number;
  minChunkSize: number;
  maxChunkSize: number;
} {
  if (chunks.length === 0) {
    return {
      totalChunks: 0,
      totalCharacters: 0,
      avgChunkSize: 0,
      minChunkSize: 0,
      maxChunkSize: 0,
    };
  }

  const sizes = chunks.map((c) => c.charCount);
  const totalCharacters = sizes.reduce((sum, size) => sum + size, 0);

  return {
    totalChunks: chunks.length,
    totalCharacters: totalCharacters,
    avgChunkSize: Math.round(totalCharacters / chunks.length),
    minChunkSize: Math.min(...sizes),
    maxChunkSize: Math.max(...sizes),
  };
}
