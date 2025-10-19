-- Enable Row Level Security on reddit_leads table
ALTER TABLE reddit_leads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow all operations on reddit_leads" ON reddit_leads;

-- Create a policy that allows all operations (SELECT, INSERT, UPDATE, DELETE)
-- Since this is a personal app without authentication, we allow all operations
CREATE POLICY "Allow all operations on reddit_leads"
ON reddit_leads
FOR ALL
USING (true)
WITH CHECK (true);

-- Enable Row Level Security on settings table
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow all operations on settings" ON settings;

-- Create a policy that allows all operations on settings table
CREATE POLICY "Allow all operations on settings"
ON settings
FOR ALL
USING (true)
WITH CHECK (true);
