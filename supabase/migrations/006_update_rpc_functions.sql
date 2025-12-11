-- Migration: Update RPC functions to use documents_chat table and add industry support

-- Drop old functions
DROP FUNCTION IF EXISTS public.match_finance_chunks(vector, float, int);
DROP FUNCTION IF EXISTS public.insert_finance_chunk(text, text, integer, integer, integer, integer, text);

-- Create new search function with industry filter
CREATE OR REPLACE FUNCTION public.match_document_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5,
  filter_industry text DEFAULT NULL
)
RETURNS TABLE (
  id bigint,
  content text,
  embedding vector(1536),
  chunk_index integer,
  start_char integer,
  end_char integer,
  char_count integer,
  document_name text,
  industry text,
  document_hash text,
  created_at timestamp with time zone,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    public.documents_chat.id,
    public.documents_chat.content,
    public.documents_chat.embedding,
    public.documents_chat.chunk_index,
    public.documents_chat.start_char,
    public.documents_chat.end_char,
    public.documents_chat.char_count,
    public.documents_chat.document_name,
    public.documents_chat.industry,
    public.documents_chat.document_hash,
    public.documents_chat.created_at,
    1 - (public.documents_chat.embedding <=> query_embedding) AS similarity
  FROM public.documents_chat
  WHERE 1 - (public.documents_chat.embedding <=> query_embedding) > match_threshold
    AND (filter_industry IS NULL OR public.documents_chat.industry = filter_industry)
  ORDER BY public.documents_chat.embedding <=> query_embedding
  LIMIT match_count;
$$;

COMMENT ON FUNCTION public.match_document_chunks IS 'Performs vector similarity search on documents_chat table with optional industry filter';

-- Create new insert helper function
CREATE OR REPLACE FUNCTION public.insert_document_chunk(
  p_content text,
  p_embedding text,
  p_chunk_index integer,
  p_start_char integer,
  p_end_char integer,
  p_char_count integer,
  p_document_name text,
  p_industry text DEFAULT 'Finance',
  p_document_hash text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.documents_chat (
    content, 
    embedding, 
    chunk_index,
    start_char,
    end_char,
    char_count,
    document_name,
    industry,
    document_hash
  )
  VALUES (
    p_content, 
    p_embedding::vector,
    p_chunk_index,
    p_start_char,
    p_end_char,
    p_char_count,
    p_document_name,
    p_industry,
    p_document_hash
  );
END;
$$;

COMMENT ON FUNCTION public.insert_document_chunk IS 'Helper function to insert document chunks with proper vector type casting and industry labeling';
