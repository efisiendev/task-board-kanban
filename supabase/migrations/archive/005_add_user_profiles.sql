-- Create user_profiles table for additional user information
-- This stores employee metadata like username, employee number, division, etc.

CREATE TABLE user_profiles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) NOT NULL, -- Stored for easy access (synced from auth.users)
  username VARCHAR(100) NOT NULL,
  employee_number VARCHAR(50) UNIQUE NOT NULL,
  division VARCHAR(100),
  department VARCHAR(100),
  position VARCHAR(100),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_employee_number ON user_profiles(employee_number);
CREATE INDEX idx_user_profiles_division ON user_profiles(division);
CREATE INDEX idx_user_profiles_department ON user_profiles(department);
CREATE INDEX idx_user_profiles_username ON user_profiles(username);

-- RLS Policies for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can view all user profiles (for assignment dropdown)
CREATE POLICY "Anyone can view user profiles"
  ON user_profiles FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Apply updated_at trigger
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE user_profiles IS 'Extended user information including employee details';
COMMENT ON COLUMN user_profiles.email IS 'User email address (synced from auth.users for easy access)';
COMMENT ON COLUMN user_profiles.username IS 'Display name of the user';
COMMENT ON COLUMN user_profiles.employee_number IS 'Unique employee identification number';
COMMENT ON COLUMN user_profiles.division IS 'Division/department the employee belongs to';
COMMENT ON COLUMN user_profiles.department IS 'Sub-department within division';
COMMENT ON COLUMN user_profiles.position IS 'Job title/position';
