-- Migration: Create documents_chat table for multi-industry RAG support
-- This stores document chunks and embeddings from multiple industries

-- Create the documents_chat table
CREATE TABLE IF NOT EXISTS public.documents_chat (
  id BIGSERIAL PRIMARY KEY,
  content TEXT,
  embedding vector(1536),
  chunk_index INTEGER,
  start_char INTEGER,
  end_char INTEGER,
  char_count INTEGER,
  document_name TEXT,
  industry TEXT DEFAULT 'Finance',
  document_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_chat_industry 
ON public.documents_chat(industry);

CREATE INDEX IF NOT EXISTS idx_documents_chat_document_hash 
ON public.documents_chat(document_hash);

CREATE INDEX IF NOT EXISTS idx_documents_chat_document_name 
ON public.documents_chat(document_name);

-- Update table comment
COMMENT ON TABLE public.documents_chat IS 'Stores document chunks and embeddings for multi-industry RAG system';
