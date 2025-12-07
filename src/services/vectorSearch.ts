import supabase from "@/lib/supabase";
import { ChunkWithEmbedding } from "./embedding";

export const FINANCE_TABLE = "finance_chat";

export interface FinanceChatRow {
  id?: number;
  content: string;
  embedding: number[];
  chunk_index: number;
  start_char: number;
  end_char: number;
  char_count: number;
  document_name: string;
  created_at?: string;
}

/**
 * Inserts chunks with embeddings into Finance_chat table
 * @param chunks - Array of chunks with embeddings
 * @param documentName - Name of the source document
 * @returns Number of rows inserted
 */
export async function insertChunksToFinanceTable(
  chunks: ChunkWithEmbedding[],
  documentName: string
): Promise<number> {
  if (chunks.length === 0) {
    throw new Error("No chunks to insert");
  }

  // Transform chunks to database rows
  const rows: FinanceChatRow[] = chunks.map((chunk) => ({
    content: chunk.content,
    embedding: chunk.embedding,
    chunk_index: chunk.chunkIndex,
    start_char: chunk.startChar,
    end_char: chunk.endChar,
    char_count: chunk.charCount,
    document_name: documentName,
  }));

  // Insert into database
  const { data, error } = await supabase
    .from(FINANCE_TABLE)
    .insert(rows)
    .select();

  if (error) {
    throw new Error(`Failed to insert chunks: ${error.message}`);
  }

  console.log(`✅ Inserted ${data?.length || 0} chunks into ${FINANCE_TABLE}`);
  return data?.length || 0;
}

/**
 * Deletes all chunks for a specific document
 * Useful for re-processing a document
 * @param documentName - Name of the document to delete
 * @returns Number of rows deleted
 */
export async function deleteDocumentChunks(
  documentName: string
): Promise<number> {
  const { data, error } = await supabase
    .from(FINANCE_TABLE)
    .delete()
    .eq("document_name", documentName)
    .select();

  if (error) {
    throw new Error(`Failed to delete chunks: ${error.message}`);
  }

  console.log(`🗑️ Deleted ${data?.length || 0} chunks for document: ${documentName}`);
  return data?.length || 0;
}

/**
 * Searches for similar chunks using vector similarity
 * @param queryEmbedding - Embedding vector of the user's query
 * @param limit - Maximum number of results to return (default: 5)
 * @param similarityThreshold - Minimum similarity score (0-1, default: 0.7)
 * @returns Array of matching chunks with similarity scores
 */
export async function searchSimilarChunks(
  queryEmbedding: number[],
  limit: number = 5,
  similarityThreshold: number = 0.7
): Promise<
  Array<
    FinanceChatRow & {
      similarity: number;
    }
  >
> {
  // Use RPC function for vector similarity search
  const { data, error } = await supabase.rpc("match_finance_chunks", {
    query_embedding: queryEmbedding,
    match_threshold: similarityThreshold,
    match_count: limit,
  });

  if (error) {
    throw new Error(`Failed to search chunks: ${error.message}`);
  }

  return data || [];
}

/**
 * Gets all chunks for a specific document
 * @param documentName - Name of the document
 * @returns Array of chunks ordered by chunk_index
 */
export async function getDocumentChunks(
  documentName: string
): Promise<FinanceChatRow[]> {
  const { data, error } = await supabase
    .from(FINANCE_TABLE)
    .select("*")
    .eq("document_name", documentName)
    .order("chunk_index", { ascending: true });

  if (error) {
    throw new Error(`Failed to get document chunks: ${error.message}`);
  }

  return data || [];
}

/**
 * Checks if a document already exists in the database
 * @param documentName - Name of the document
 * @returns True if document exists
 */
export async function documentExists(documentName: string): Promise<boolean> {
  const { data, error } = await supabase
    .from(FINANCE_TABLE)
    .select("id")
    .eq("document_name", documentName)
    .limit(1);

  if (error) {
    throw new Error(`Failed to check document existence: ${error.message}`);
  }

  return (data?.length || 0) > 0;
}

/**
 * Gets statistics about stored documents
 * @returns Object with document statistics
 */
export async function getFinanceTableStats(): Promise<{
  totalChunks: number;
  uniqueDocuments: number;
  documents: Array<{ name: string; chunkCount: number }>;
}> {
  // Get total chunks
  const { count: totalChunks, error: countError } = await supabase
    .from(FINANCE_TABLE)
    .select("*", { count: "exact", head: true });

  if (countError) {
    throw new Error(`Failed to get stats: ${countError.message}`);
  }

  // Get unique documents with chunk counts
  const { data: docs, error: docsError } = await supabase
    .from(FINANCE_TABLE)
    .select("document_name")
    .order("document_name");

  if (docsError) {
    throw new Error(`Failed to get documents: ${docsError.message}`);
  }

  // Count chunks per document
  const docCounts = new Map<string, number>();
  docs?.forEach((doc) => {
    const count = docCounts.get(doc.document_name) || 0;
    docCounts.set(doc.document_name, count + 1);
  });

  const documents = Array.from(docCounts.entries()).map(([name, chunkCount]) => ({
    name,
    chunkCount,
  }));

  return {
    totalChunks: totalChunks || 0,
    uniqueDocuments: documents.length,
    documents,
  };
}
