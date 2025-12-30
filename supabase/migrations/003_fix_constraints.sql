-- ============================================================================
-- TaskFlow - Fix Constraints
-- ============================================================================
-- Description: Remove restrictive constraints that cause reorder issues
-- Version: 1.0
-- Created: 2024-12-31
-- ============================================================================

-- Drop color check constraint (allow both hex and color names)
ALTER TABLE board_statuses DROP CONSTRAINT IF EXISTS board_statuses_color_check;

-- Drop unique constraint on order_index (allow temporary duplicates during reorder)
ALTER TABLE board_statuses DROP CONSTRAINT IF EXISTS board_statuses_board_id_order_index_key;

-- Confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Constraints fixed!';
  RAISE NOTICE '   - Removed color format check';
  RAISE NOTICE '   - Removed order_index uniqueness';
END $$;
