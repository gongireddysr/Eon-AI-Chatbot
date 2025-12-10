-- Create helper function to insert chunks with proper vector casting
CREATE OR REPLACE FUNCTION public.insert_finance_chunk(
  p_content text,
  p_embedding text,
  p_chunk_index integer,
  p_start_char integer,
  p_end_char integer,
  p_char_count integer,
  p_document_name text
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.finance_chat (
    content, 
    embedding, 
    chunk_index, 
    start_char, 
    end_char, 
    char_count, 
    document_name
  )
  VALUES (
    p_content, 
    p_embedding::vector,  -- Cast string to vector type
    p_chunk_index, 
    p_start_char, 
    p_end_char, 
    p_char_count, 
    p_document_name
  );
END;
$$;

COMMENT ON FUNCTION insert_finance_chunk IS 'Helper function to insert chunks with proper vector type casting';
