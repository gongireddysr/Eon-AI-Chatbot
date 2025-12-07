-- Create function for vector similarity search
create or replace function match_finance_chunks(
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 5
)
returns table (
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
language sql stable
as $$
  select
    Finance_chat.id,
    Finance_chat.content,
    Finance_chat.embedding,
    Finance_chat.chunk_index,
    Finance_chat.start_char,
    Finance_chat.end_char,
    Finance_chat.char_count,
    Finance_chat.document_name,
    Finance_chat.created_at,
    1 - (Finance_chat.embedding <=> query_embedding) as similarity
  from Finance_chat
  where 1 - (Finance_chat.embedding <=> query_embedding) > match_threshold
  order by Finance_chat.embedding <=> query_embedding
  limit match_count;
$$;
