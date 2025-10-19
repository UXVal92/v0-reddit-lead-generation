-- Add opportunity column to reddit_leads table
ALTER TABLE public.reddit_leads
ADD COLUMN IF NOT EXISTS opportunity TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN public.reddit_leads.opportunity IS 'AI-generated explanation of why an Ascott Lloyd adviser should reach out to this person';
