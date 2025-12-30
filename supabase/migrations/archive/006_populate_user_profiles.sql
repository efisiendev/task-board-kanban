-- Auto-populate user_profiles for existing auth.users
-- This creates user profiles for all users who don't have one yet

-- Insert user_profiles for existing users
INSERT INTO user_profiles (user_id, email, username, employee_number, division)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'username', SPLIT_PART(au.email, '@', 1)) as username, -- Use metadata username or email prefix
  'EMP' || LPAD(ROW_NUMBER() OVER (ORDER BY au.created_at)::text, 4, '0') as employee_number, -- EMP0001, EMP0002, etc.
  'Unassigned' as division -- Default division
FROM auth.users au
WHERE au.id NOT IN (SELECT user_id FROM user_profiles)
ON CONFLICT (user_id) DO NOTHING;

-- Log the number of profiles created
DO $$
DECLARE
  profile_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM user_profiles;
  RAISE NOTICE 'Total user profiles: %', profile_count;
END $$;
