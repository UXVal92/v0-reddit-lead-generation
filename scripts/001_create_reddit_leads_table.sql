-- Create table for storing Reddit leads
CREATE TABLE IF NOT EXISTS public.reddit_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reddit_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  subreddit TEXT NOT NULL,
  url TEXT NOT NULL,
  reddit_created_at TIMESTAMPTZ NOT NULL,
  summary TEXT,
  score INTEGER CHECK (score >= 1 AND score <= 10),
  draft_reply TEXT,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on reddit_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_reddit_leads_reddit_id ON public.reddit_leads(reddit_id);

-- Create index on subreddit for filtering
CREATE INDEX IF NOT EXISTS idx_reddit_leads_subreddit ON public.reddit_leads(subreddit);

-- Create index on score for filtering
CREATE INDEX IF NOT EXISTS idx_reddit_leads_score ON public.reddit_leads(score);

-- Create index on reddit_created_at for date filtering
CREATE INDEX IF NOT EXISTS idx_reddit_leads_reddit_created_at ON public.reddit_leads(reddit_created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE public.reddit_leads ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since this is not user-specific data)
-- Adjust these policies based on your security requirements
CREATE POLICY "Allow all operations on reddit_leads"
  ON public.reddit_leads
  FOR ALL
  USING (true)
  WITH CHECK (true);
