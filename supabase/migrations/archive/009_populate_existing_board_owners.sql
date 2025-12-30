-- Add board owners to board_members for existing boards
-- This ensures existing boards work with the new shared boards system

INSERT INTO board_members (board_id, user_id, role, invited_by)
SELECT
  b.id as board_id,
  b.user_id,
  'owner' as role,
  b.user_id as invited_by
FROM boards b
WHERE NOT EXISTS (
  SELECT 1 FROM board_members bm
  WHERE bm.board_id = b.id AND bm.user_id = b.user_id
)
ON CONFLICT (board_id, user_id) DO NOTHING;

-- Log the results
DO $$
DECLARE
  member_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO member_count FROM board_members WHERE role = 'owner';
  RAISE NOTICE 'Total board owners in board_members: %', member_count;
END $$;
