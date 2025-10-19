-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations on reddit_leads" ON reddit_leads;
DROP POLICY IF EXISTS "Allow all operations on settings" ON settings;

-- Enable RLS on tables
ALTER TABLE reddit_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create permissive policies that allow all operations
-- For reddit_leads table
CREATE POLICY "Allow all operations on reddit_leads"
ON reddit_leads
FOR ALL
USING (true)
WITH CHECK (true);

-- For settings table
CREATE POLICY "Allow all operations on settings"
ON settings
FOR ALL
USING (true)
WITH CHECK (true);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('reddit_leads', 'settings');
