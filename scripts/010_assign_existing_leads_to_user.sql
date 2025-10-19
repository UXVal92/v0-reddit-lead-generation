-- This script assigns all existing leads with NULL user_id to your user account
-- Run this script in Supabase SQL Editor after logging in to your app

-- First, let's see how many leads need to be updated
SELECT COUNT(*) as unassigned_leads 
FROM reddit_leads 
WHERE user_id IS NULL;

-- Update all leads with NULL user_id to your user ID
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID from auth.users
-- You can find your user ID by running: SELECT id, email FROM auth.users;

-- IMPORTANT: First, get your user ID by running this query:
-- SELECT id, email FROM auth.users;
-- Then replace 'YOUR_USER_ID_HERE' below with your actual user ID

-- UPDATE reddit_leads
-- SET user_id = 'YOUR_USER_ID_HERE'
-- WHERE user_id IS NULL;

-- After running the update, verify the changes:
-- SELECT COUNT(*) as assigned_leads 
-- FROM reddit_leads 
-- WHERE user_id IS NOT NULL;
