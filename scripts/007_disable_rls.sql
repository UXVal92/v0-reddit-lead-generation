-- Disable Row Level Security for personal/development use
-- This allows all operations without authentication

-- Disable RLS on reddit_leads table
ALTER TABLE reddit_leads DISABLE ROW LEVEL SECURITY;

-- Disable RLS on settings table
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies (cleanup)
DROP POLICY IF EXISTS "Allow all operations on reddit_leads" ON reddit_leads;
DROP POLICY IF EXISTS "Allow all operations on settings" ON settings;
