import supabase from "@/lib/supabase";
import { ChunkWithEmbedding } from "./embedding";

export const DOCUMENTS_TABLE = "documents_chat";

export interface DocumentChatRow {
  id?: number;
  content: string;
  embedding: number[] | string;
  chunk_index: number;
  start_char: number;
  end_char: number;
  char_count: number;
  document_name: string;
  industry?: string;
  document_hash?: string;
  created_at?: string;
}

/**
 * Inserts chunks with embeddings into Finance_chat table
 * @param chunks - Array of chunks with embeddings
 * @param documentName - Name of the source document
 * @returns Number of rows inserted
 */
export async function insertChunksToTable(
  chunks: ChunkWithEmbedding[],
  documentName: string,
  industry: string = 'Finance',
  documentHash?: string
): Promise<number> {
  if (chunks.length === 0) {
    throw new Error("No chunks to insert");
  }

  console.log(`💾 Inserting ${chunks.length} chunks for ${documentName} (${industry})...`);

  let insertedCount = 0;

  for (const chunk of chunks) {
    const embeddingString = `[${chunk.embedding.join(',')}]`;
    
    const { error } = await supabase.rpc('insert_document_chunk', {
      p_content: chunk.content,
      p_embedding: embeddingString,
      p_chunk_index: chunk.chunkIndex,
      p_start_char: chunk.startChar,
      p_end_char: chunk.endChar,
      p_char_count: chunk.charCount,
      p_document_name: documentName,
      p_industry: industry,
      p_document_hash: documentHash || null
    });

    if (error) {
      throw new Error(`Failed to insert chunk ${chunk.chunkIndex}: ${error.message}`);
    }

    insertedCount++;
  }

  console.log(`✅ Inserted ${insertedCount} chunks into ${DOCUMENTS_TABLE}`);
  return insertedCount;
}

/**
 * Deletes all chunks for a specific document
 * Useful for re-processing a document
 * @param documentName - Name of the document to delete
 * @returns Number of rows deleted
 */
export async function deleteDocumentChunks(
  documentName: string,
  industry?: string
): Promise<number> {
  let query = supabase
    .from(DOCUMENTS_TABLE)
    .delete()
    .eq("document_name", documentName);

  if (industry) {
    query = query.eq("industry", industry);
  }

  const { data, error } = await query.select();

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
  similarityThreshold: number = 0.5,
  industry?: string
): Promise<
  Array<
    DocumentChatRow & {
      similarity: number;
    }
  >
> {
  const { data, error } = await supabase.rpc("match_document_chunks", {
    query_embedding: queryEmbedding,
    match_threshold: similarityThreshold,
    match_count: limit,
    filter_industry: industry || null,
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
): Promise<DocumentChatRow[]> {
  const { data, error } = await supabase
    .from(DOCUMENTS_TABLE)
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
export async function documentExists(documentName: string, industry?: string): Promise<boolean> {
  let query = supabase
    .from(DOCUMENTS_TABLE)
    .select("id")
    .eq("document_name", documentName);

  if (industry) {
    query = query.eq("industry", industry);
  }

  const { data, error } = await query.limit(1);

  if (error) {
    throw new Error(`Failed to check document existence: ${error.message}`);
  }

  return (data?.length || 0) > 0;
}

export async function documentExistsByHash(documentHash: string): Promise<boolean> {
  const { data, error } = await supabase
    .from(DOCUMENTS_TABLE)
    .select("id")
    .eq("document_hash", documentHash)
    .limit(1);

  if (error) {
    throw new Error(`Failed to check document hash: ${error.message}`);
  }

  return (data?.length || 0) > 0;
}

/**
 * Gets statistics about stored documents
 * @returns Object with document statistics
 */
export async function getDocumentsTableStats(): Promise<{
  totalChunks: number;
  uniqueDocuments: number;
  documents: Array<{ name: string; industry: string; chunkCount: number }>;
  industries: Record<string, number>;
}> {
  const { count: totalChunks, error: countError } = await supabase
    .from(DOCUMENTS_TABLE)
    .select("*", { count: "exact", head: true });

  if (countError) {
    throw new Error(`Failed to get stats: ${countError.message}`);
  }

  const { data: docs, error: docsError } = await supabase
    .from(DOCUMENTS_TABLE)
    .select("document_name, industry")
    .order("document_name");

  if (docsError) {
    throw new Error(`Failed to get documents: ${docsError.message}`);
  }

  const docCounts = new Map<string, { industry: string; count: number }>();
  const industryCounts: Record<string, number> = {};

  docs?.forEach((doc) => {
    const key = doc.document_name;
    const existing = docCounts.get(key);
    if (existing) {
      existing.count++;
    } else {
      docCounts.set(key, { industry: doc.industry || 'Unknown', count: 1 });
    }
    
    const industry = doc.industry || 'Unknown';
    industryCounts[industry] = (industryCounts[industry] || 0) + 1;
  });

  const documents = Array.from(docCounts.entries()).map(([name, data]) => ({
    name,
    industry: data.industry,
    chunkCount: data.count,
  }));

  return {
    totalChunks: totalChunks || 0,
    uniqueDocuments: documents.length,
    documents,
    industries: industryCounts,
  };
}
