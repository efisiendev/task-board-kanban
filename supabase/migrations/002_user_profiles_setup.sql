-- ============================================================================
-- TaskFlow - User Profiles Setup
-- ============================================================================
-- Description: Auto-create user profiles and populate existing users
-- Version: 1.0
-- Created: 2024-12-31
-- ============================================================================

-- Function: Auto-create user profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, employee_number)
  VALUES (
    NEW.id,
    NEW.email,
    'EMP-' || SUBSTRING(NEW.id::text, 1, 8) -- Auto-generate employee number from user ID
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Populate existing users (if any)
INSERT INTO public.user_profiles (user_id, email, employee_number)
SELECT
  id,
  email,
  'EMP-' || SUBSTRING(id::text, 1, 8)
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_profiles)
ON CONFLICT (user_id) DO NOTHING;

-- Confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ User profiles setup completed!';
  RAISE NOTICE '📋 Total profiles: %', (SELECT COUNT(*) FROM user_profiles);
END $$;
