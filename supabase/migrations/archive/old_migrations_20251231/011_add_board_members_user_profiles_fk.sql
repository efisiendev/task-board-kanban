-- Fix board_members to user_profiles relationship for Supabase PostgREST joins
-- The issue: board_members.user_id references auth.users, not user_profiles
-- Solution: Change FK to reference user_profiles.user_id directly

-- Step 1: Ensure all users in board_members have user_profiles entries
INSERT INTO user_profiles (user_id, email, username, employee_number, division)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'username', SPLIT_PART(au.email, '@', 1)) as username,
  'EMP' || LPAD(ROW_NUMBER() OVER (ORDER BY au.created_at)::text, 4, '0') as employee_number,
  'Unassigned' as division
FROM auth.users au
WHERE au.id IN (SELECT DISTINCT user_id FROM board_members)
AND au.id NOT IN (SELECT user_id FROM user_profiles)
ON CONFLICT (user_id) DO NOTHING;

-- Step 2: Drop old foreign key constraint
ALTER TABLE board_members
  DROP CONSTRAINT IF EXISTS board_members_user_id_fkey;

-- Step 3: Add new foreign key to user_profiles
ALTER TABLE board_members
  ADD CONSTRAINT board_members_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES user_profiles(user_id)
  ON DELETE CASCADE;

-- Step 4: Update invited_by to also reference user_profiles
ALTER TABLE board_members
  DROP CONSTRAINT IF EXISTS board_members_invited_by_fkey;

ALTER TABLE board_members
  ADD CONSTRAINT board_members_invited_by_fkey
  FOREIGN KEY (invited_by)
  REFERENCES user_profiles(user_id)
  ON DELETE SET NULL;

-- Step 5: Update tasks table assigned_to and created_by to reference user_profiles
ALTER TABLE tasks
  DROP CONSTRAINT IF EXISTS tasks_assigned_to_fkey;

ALTER TABLE tasks
  ADD CONSTRAINT tasks_assigned_to_fkey
  FOREIGN KEY (assigned_to)
  REFERENCES user_profiles(user_id)
  ON DELETE SET NULL;

ALTER TABLE tasks
  DROP CONSTRAINT IF EXISTS tasks_created_by_fkey;

ALTER TABLE tasks
  ADD CONSTRAINT tasks_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES user_profiles(user_id)
  ON DELETE SET NULL;

-- Verify
DO $$
DECLARE
  missing_profiles INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_profiles
  FROM board_members bm
  WHERE NOT EXISTS (SELECT 1 FROM user_profiles up WHERE up.user_id = bm.user_id);

  IF missing_profiles > 0 THEN
    RAISE WARNING 'Found % board members without user profiles - migration may fail!', missing_profiles;
  ELSE
    RAISE NOTICE 'All board members have user profiles!';
    RAISE NOTICE 'Foreign keys updated to reference user_profiles';
    RAISE NOTICE 'PostgREST joins should now work correctly';
  END IF;
END $$;
