-- Change id column from uuid to text to support custom IDs
-- This allows the app to use custom string IDs like "1oa487t" instead of UUIDs

-- First, drop any foreign key constraints if they exist
-- (none exist in this schema, but this is good practice)

-- Change reddit_leads.id from uuid to text
ALTER TABLE reddit_leads 
ALTER COLUMN id TYPE text USING id::text;

-- Change settings.id from uuid to text
ALTER TABLE settings 
ALTER COLUMN id TYPE text USING id::text;
