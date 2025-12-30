-- Create a secure function for board creation that works with RLS
CREATE OR REPLACE FUNCTION create_board(name VARCHAR)
RETURNS boards AS $$
DECLARE
  new_board boards;
BEGIN
  INSERT INTO boards (name, user_id)
  VALUES (name, auth.uid())
  RETURNING * INTO new_board;
  RETURN new_board;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission to anon role
GRANT EXECUTE ON FUNCTION create_board(VARCHAR) TO anon, authenticated;
