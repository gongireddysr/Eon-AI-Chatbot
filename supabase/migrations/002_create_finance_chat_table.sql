-- Drop existing table if it exists
DROP TABLE IF EXISTS finance_chat CASCADE;

-- Create finance_chat table with proper vector type
CREATE TABLE finance_chat (
  id bigserial PRIMARY KEY,
  content text NOT NULL,
  embedding vector(1536) NOT NULL,
  chunk_index integer NOT NULL,
  start_char integer NOT NULL,
  end_char integer NOT NULL,
  char_count integer NOT NULL,
  document_name text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for vector similarity search using cosine distance
CREATE INDEX finance_chat_embedding_idx 
  ON finance_chat 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Create index for filtering by document name
CREATE INDEX finance_chat_document_name_idx 
  ON finance_chat (document_name);

-- Add table comment
COMMENT ON TABLE finance_chat IS 'Stores document chunks and their embeddings for Finance domain RAG';
