-- Create vector similarity search function
CREATE OR REPLACE FUNCTION public.match_finance_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5
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
  created_at timestamp with time zone,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    public.finance_chat.id,
    public.finance_chat.content,
    public.finance_chat.embedding,
    public.finance_chat.chunk_index,
    public.finance_chat.start_char,
    public.finance_chat.end_char,
    public.finance_chat.char_count,
    public.finance_chat.document_name,
    public.finance_chat.created_at,
    1 - (public.finance_chat.embedding <=> query_embedding) AS similarity
  FROM public.finance_chat
  WHERE 1 - (public.finance_chat.embedding <=> query_embedding) > match_threshold
  ORDER BY public.finance_chat.embedding <=> query_embedding
  LIMIT match_count;
$$;

COMMENT ON FUNCTION match_finance_chunks IS 'Performs vector similarity search on finance_chat table using cosine distance';
