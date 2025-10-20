-- Enable RLS on reddit_leads table and add user-based policies
ALTER TABLE reddit_leads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "reddit_leads_select_own" ON reddit_leads;
DROP POLICY IF EXISTS "reddit_leads_insert_own" ON reddit_leads;
DROP POLICY IF EXISTS "reddit_leads_update_own" ON reddit_leads;
DROP POLICY IF EXISTS "reddit_leads_delete_own" ON reddit_leads;

-- Add user_id column to reddit_leads table
ALTER TABLE reddit_leads ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create policies that allow users to manage only their own leads
CREATE POLICY "reddit_leads_select_own"
  ON reddit_leads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "reddit_leads_insert_own"
  ON reddit_leads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reddit_leads_update_own"
  ON reddit_leads FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "reddit_leads_delete_own"
  ON reddit_leads FOR DELETE
  USING (auth.uid() = user_id);

-- Enable RLS on settings table and add user-based policies
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "settings_select_own" ON settings;
DROP POLICY IF EXISTS "settings_insert_own" ON settings;
DROP POLICY IF EXISTS "settings_update_own" ON settings;
DROP POLICY IF EXISTS "settings_delete_own" ON settings;

-- Add user_id column to settings table
ALTER TABLE settings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create policies that allow users to manage only their own settings
CREATE POLICY "settings_select_own"
  ON settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "settings_insert_own"
  ON settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "settings_update_own"
  ON settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "settings_delete_own"
  ON settings FOR DELETE
  USING (auth.uid() = user_id);
