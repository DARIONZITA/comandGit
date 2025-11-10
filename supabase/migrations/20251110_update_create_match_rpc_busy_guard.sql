-- Migration: strengthen create_match RPC to guard busy opponents
-- Date: 2025-11-10
-- Purpose: Ensure a player cannot be matched if already in another 'waiting' or 'active' match

CREATE OR REPLACE FUNCTION create_match_and_mark_queue(opponent_id uuid)
RETURNS multiplayer_matches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  auth_user_id uuid := auth.uid();
  waiting_opponent multiplayer_queue%ROWTYPE;
  waiting_self multiplayer_queue%ROWTYPE;
  new_match multiplayer_matches%ROWTYPE;
BEGIN
  IF auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Auth user required';
  END IF;
  IF opponent_id IS NULL THEN
    RAISE EXCEPTION 'Opponent id required';
  END IF;
  IF auth_user_id = opponent_id THEN
    RAISE EXCEPTION 'Cannot match with yourself';
  END IF;

  -- Guard: neither user can be in another waiting/active match
  IF EXISTS (
    SELECT 1 FROM multiplayer_matches
    WHERE status IN ('waiting','active')
      AND (player1_id = opponent_id OR player2_id = opponent_id)
  ) THEN
    RAISE EXCEPTION 'Opponent busy';
  END IF;

  IF EXISTS (
    SELECT 1 FROM multiplayer_matches
    WHERE status IN ('waiting','active')
      AND (player1_id = auth_user_id OR player2_id = auth_user_id)
  ) THEN
    RAISE EXCEPTION 'Current user busy';
  END IF;

  -- Lock opponent row
  SELECT * INTO waiting_opponent
  FROM multiplayer_queue
  WHERE user_id = opponent_id AND status = 'waiting'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Opponent not in waiting queue';
  END IF;

  -- Lock self row
  SELECT * INTO waiting_self
  FROM multiplayer_queue
  WHERE user_id = auth_user_id AND status = 'waiting'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Current user not in waiting queue';
  END IF;

  -- Prevent duplicate match creation between the same two players
  IF EXISTS (
    SELECT 1 FROM multiplayer_matches
    WHERE status = 'waiting'
      AND ((player1_id = opponent_id AND player2_id = auth_user_id)
        OR (player1_id = auth_user_id AND player2_id = opponent_id))
  ) THEN
    RAISE EXCEPTION 'Match already exists between these players';
  END IF;

  -- Remove both queue entries
  DELETE FROM multiplayer_queue WHERE user_id IN (opponent_id, auth_user_id);

  -- Insert new match (opponent becomes player1 deterministically)
  INSERT INTO multiplayer_matches(
    player1_id, player1_username,
    player2_id, player2_username,
    status
  ) VALUES (
    waiting_opponent.user_id, waiting_opponent.username,
    waiting_self.user_id, waiting_self.username,
    'waiting'
  ) RETURNING * INTO new_match;

  RETURN new_match;
END;
$$;

GRANT EXECUTE ON FUNCTION create_match_and_mark_queue(uuid) TO authenticated;
