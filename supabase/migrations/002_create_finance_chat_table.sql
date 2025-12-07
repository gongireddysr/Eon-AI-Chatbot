-- Create Finance_chat table for storing document chunks and embeddings
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
