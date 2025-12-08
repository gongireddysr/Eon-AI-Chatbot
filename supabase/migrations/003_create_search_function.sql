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
    finance_chat.id,
    finance_chat.content,
    finance_chat.embedding,
    finance_chat.chunk_index,
    finance_chat.start_char,
    finance_chat.end_char,
    finance_chat.char_count,
    finance_chat.document_name,
    finance_chat.created_at,
    1 - (finance_chat.embedding <=> query_embedding) as similarity
  from finance_chat
  where 1 - (finance_chat.embedding <=> query_embedding) > match_threshold
  order by finance_chat.embedding <=> query_embedding
  limit match_count;
$$;
