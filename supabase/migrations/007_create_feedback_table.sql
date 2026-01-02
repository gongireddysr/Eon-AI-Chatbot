-- Create session_feedback table for storing all feedback from chat sessions
CREATE TABLE IF NOT EXISTS public.session_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  industry TEXT NOT NULL,
  message_feedbacks JSONB DEFAULT '[]'::jsonb,
  star_rating INTEGER CHECK (star_rating >= 1 AND star_rating <= 5),
  text_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on session_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_session_feedback_session_id ON public.session_feedback(session_id);

-- Create index on industry for filtering
CREATE INDEX IF NOT EXISTS idx_session_feedback_industry ON public.session_feedback(industry);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_session_feedback_created_at ON public.session_feedback(created_at DESC);

-- Enable RLS
ALTER TABLE public.session_feedback ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous insert" ON public.session_feedback;
DROP POLICY IF EXISTS "Allow anonymous update" ON public.session_feedback;
DROP POLICY IF EXISTS "Allow anonymous select" ON public.session_feedback;

-- Allow anonymous access for inserting and reading feedback
CREATE POLICY "Allow anonymous insert" ON public.session_feedback
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous update" ON public.session_feedback
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous select" ON public.session_feedback
  FOR SELECT TO anon USING (true);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_update_feedback_timestamp
  BEFORE UPDATE ON public.session_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_feedback_updated_at();

COMMENT ON TABLE public.session_feedback IS 'Stores feedback from chat sessions including message-level thumbs up/down and session-level star ratings';
