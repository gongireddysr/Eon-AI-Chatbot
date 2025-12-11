-- Migration: Rename finance_chat to documents_chat and add multi-industry support
-- This enables storing documents from multiple industries in one table

-- Step 1: Rename the table
ALTER TABLE public.finance_chat RENAME TO documents_chat;

-- Step 2: Add industry column (default to 'Finance' for existing data)
ALTER TABLE public.documents_chat 
ADD COLUMN IF NOT EXISTS industry TEXT DEFAULT 'Finance';

-- Step 3: Add document_hash column for duplicate detection
ALTER TABLE public.documents_chat 
ADD COLUMN IF NOT EXISTS document_hash TEXT;

-- Step 4: Update existing data to have 'Finance' industry
UPDATE public.documents_chat 
SET industry = 'Finance' 
WHERE industry IS NULL;

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_chat_industry 
ON public.documents_chat(industry);

CREATE INDEX IF NOT EXISTS idx_documents_chat_document_hash 
ON public.documents_chat(document_hash);

CREATE INDEX IF NOT EXISTS idx_documents_chat_document_name 
ON public.documents_chat(document_name);

-- Step 6: Update table comment
COMMENT ON TABLE public.documents_chat IS 'Stores document chunks and embeddings for multi-industry RAG system';
