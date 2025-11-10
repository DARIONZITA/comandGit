-- Migration: atomic ready + start
-- Date: 2025-11-10
-- SECURITY DEFINER function to mark the current player ready and start the match when both are ready.

CREATE OR REPLACE FUNCTION mark_ready_and_start(p_match_id uuid)
RETURNS multiplayer_matches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  m multiplayer_matches%ROWTYPE;
  is_p1 boolean;
  is_p2 boolean;
  new_p1_ready boolean;
  new_p2_ready boolean;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Auth user required';
  END IF;

  SELECT * INTO m FROM multiplayer_matches WHERE id = p_match_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  IF m.status <> 'waiting' THEN
    RETURN m; -- nothing to do if already active/finished
  END IF;

  is_p1 := (m.player1_id = uid);
  is_p2 := (m.player2_id = uid);
  IF NOT is_p1 AND NOT is_p2 THEN
    RAISE EXCEPTION 'User is not a participant of this match';
  END IF;

  new_p1_ready := CASE WHEN is_p1 THEN true ELSE m.player1_is_ready END;
  new_p2_ready := CASE WHEN is_p2 THEN true ELSE m.player2_is_ready END;

  UPDATE multiplayer_matches
  SET
    player1_is_ready = new_p1_ready,
    player2_is_ready = new_p2_ready,
  status = CASE WHEN new_p1_ready AND new_p2_ready THEN 'active' ELSE m.status END,
  started_at = CASE WHEN new_p1_ready AND new_p2_ready AND (m.started_at IS NULL) THEN NOW() ELSE m.started_at END
  WHERE id = p_match_id
  RETURNING * INTO m;

  RETURN m;
END;
$$;

GRANT EXECUTE ON FUNCTION mark_ready_and_start(uuid) TO authenticated;
