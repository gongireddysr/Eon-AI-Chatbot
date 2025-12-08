-- Combined migration: Run this in Supabase SQL Editor
-- This creates everything needed for the Finance RAG system

-- Step 1: Enable pgvector extension
create extension if not exists vector;

-- Step 2: Create Finance_chat table
create table if not exists Finance_chat (
  id bigserial primary key,
  content text not null,
  embedding vector(1536) not null,
  chunk_index integer not null,
  start_char integer not null,
  end_char integer not null,
  char_count integer not null,
  document_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index for vector similarity search (cosine distance)
create index if not exists Finance_chat_embedding_idx 
  on Finance_chat 
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Create index for filtering by document
create index if not exists Finance_chat_document_name_idx 
  on Finance_chat (document_name);

-- Add comment to table
comment on table Finance_chat is 'Stores document chunks and their embeddings for Finance domain RAG';

-- Step 3: Create search function
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
