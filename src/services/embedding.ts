import { getOpenAIClient } from "@/lib/openai";
import { TextChunk } from "./chunker";

// OpenAI embedding model configuration
export const EMBEDDING_MODEL = "text-embedding-3-small"; // Cheaper, good quality
export const EMBEDDING_DIMENSIONS = 1536; // Vector size for text-embedding-3-small

export interface ChunkWithEmbedding extends TextChunk {
  embedding: number[];
}

/**
 * Generates an embedding vector for a single text string
 * @param text - Text to generate embedding for
 * @returns Array of numbers (vector with 1536 dimensions)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await getOpenAIClient().embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to generate embedding: ${errorMessage}`);
  }
}

/**
 * Generates embeddings for multiple text chunks
 * Processes in batches to respect API rate limits
 * @param chunks - Array of text chunks
 * @param batchSize - Number of chunks to process at once (default: 50)
 * @returns Array of chunks with embeddings attached
 */
export async function generateEmbeddingsForChunks(
  chunks: TextChunk[],
  batchSize: number = 50
): Promise<ChunkWithEmbedding[]> {
  const chunksWithEmbeddings: ChunkWithEmbedding[] = [];

  // Process in batches
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}...`);

    // Generate embeddings for batch
    const embeddings = await generateEmbeddingsBatch(
      batch.map((chunk) => chunk.content)
    );

    // Combine chunks with their embeddings
    for (let j = 0; j < batch.length; j++) {
      chunksWithEmbeddings.push({
        ...batch[j],
        embedding: embeddings[j],
      });
    }

    // Small delay to avoid rate limits (if processing many batches)
    if (i + batchSize < chunks.length) {
      await delay(100); // 100ms delay between batches
    }
  }

  return chunksWithEmbeddings;
}

/**
 * Generates embeddings for multiple texts in a single API call
 * More efficient than calling generateEmbedding() multiple times
 * @param texts - Array of text strings
 * @returns Array of embedding vectors
 */
async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  try {
    const response = await getOpenAIClient().embeddings.create({
      model: EMBEDDING_MODEL,
      input: texts,
    });

    // Extract embeddings in the same order as input
    return response.data.map((item) => item.embedding);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to generate batch embeddings: ${errorMessage}`);
  }
}

/**
 * Generates an embedding for a user query
 * Used when searching for similar chunks
 * @param query - User's question/query
 * @returns Embedding vector
 */
export async function generateQueryEmbedding(query: string): Promise<number[]> {
  return generateEmbedding(query);
}

/**
 * Helper function to add delay between API calls
 * @param ms - Milliseconds to wait
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Gets embedding statistics
 * @param embeddings - Array of embedding vectors
 * @returns Statistics object
 */
export function getEmbeddingStats(embeddings: number[][]): {
  count: number;
  dimensions: number;
  totalSize: number;
} {
  return {
    count: embeddings.length,
    dimensions: embeddings.length > 0 ? embeddings[0].length : 0,
    totalSize: embeddings.length * (embeddings.length > 0 ? embeddings[0].length : 0),
  };
}
