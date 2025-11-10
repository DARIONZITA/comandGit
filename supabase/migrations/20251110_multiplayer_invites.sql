-- Sistema de convites para multiplayer
-- Permite que jogadores convidem outros usuários para partidas privadas

-- Tabela para convites de multiplayer
CREATE TABLE IF NOT EXISTS multiplayer_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_username TEXT NOT NULL,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_username TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled', 'expired')),
  match_id UUID REFERENCES multiplayer_matches(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 minutes')
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_multiplayer_invites_receiver ON multiplayer_invites(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_multiplayer_invites_sender ON multiplayer_invites(sender_id, status);
CREATE INDEX IF NOT EXISTS idx_multiplayer_invites_status ON multiplayer_invites(status);
CREATE INDEX IF NOT EXISTS idx_multiplayer_invites_expires ON multiplayer_invites(expires_at);

-- Habilitar RLS
ALTER TABLE multiplayer_invites ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para multiplayer_invites
CREATE POLICY "Usuários podem ver convites enviados por eles" ON multiplayer_invites
  FOR SELECT USING (auth.uid() = sender_id);

CREATE POLICY "Usuários podem ver convites recebidos" ON multiplayer_invites
  FOR SELECT USING (auth.uid() = receiver_id);

CREATE POLICY "Usuários podem criar convites" ON multiplayer_invites
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Destinatários podem atualizar convites recebidos" ON multiplayer_invites
  FOR UPDATE USING (auth.uid() = receiver_id);

CREATE POLICY "Remetentes podem cancelar seus convites" ON multiplayer_invites
  FOR UPDATE USING (auth.uid() = sender_id AND status = 'pending');

-- RPC para buscar usuários (busca por username ou email)
CREATE OR REPLACE FUNCTION search_users_for_invite(search_term TEXT, current_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  email VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as user_id,
    COALESCE(
      us.username,
      u.raw_user_meta_data->>'display_name',
      u.raw_user_meta_data->>'username',
      u.raw_user_meta_data->>'full_name',
      SPLIT_PART(u.email, '@', 1),
      'Jogador' || SUBSTRING(u.id::TEXT, 1, 8)
    ) as username,
    u.email as email
  FROM auth.users u
  LEFT JOIN user_stats us ON us.user_id = u.id::text
  WHERE u.id != current_user_id
    AND u.email IS NOT NULL
    AND (
      LOWER(COALESCE(us.username, '')) LIKE LOWER('%' || search_term || '%')
      OR LOWER(COALESCE(u.raw_user_meta_data->>'display_name', '')) LIKE LOWER('%' || search_term || '%')
      OR LOWER(COALESCE(u.raw_user_meta_data->>'username', '')) LIKE LOWER('%' || search_term || '%')
      OR LOWER(COALESCE(u.raw_user_meta_data->>'full_name', '')) LIKE LOWER('%' || search_term || '%')
      OR LOWER(u.email) LIKE LOWER('%' || search_term || '%')
    )
  ORDER BY 
    CASE 
      WHEN LOWER(COALESCE(us.username, '')) = LOWER(search_term) THEN 0
      WHEN LOWER(COALESCE(u.raw_user_meta_data->>'display_name', '')) = LOWER(search_term) THEN 0
      WHEN LOWER(COALESCE(us.username, '')) LIKE LOWER(search_term || '%') THEN 1
      WHEN LOWER(COALESCE(u.raw_user_meta_data->>'display_name', '')) LIKE LOWER(search_term || '%') THEN 1
      WHEN LOWER(u.email) = LOWER(search_term) THEN 2
      WHEN LOWER(u.email) LIKE LOWER(search_term || '%') THEN 3
      ELSE 4
    END,
    us.username,
    u.raw_user_meta_data->>'display_name'
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC para enviar convite
CREATE OR REPLACE FUNCTION send_multiplayer_invite(
  p_receiver_id UUID,
  p_sender_username TEXT,
  p_receiver_username TEXT
)
RETURNS UUID AS $$
DECLARE
  v_invite_id UUID;
  v_existing_invite UUID;
BEGIN
  -- Limpar matches travadas primeiro
  PERFORM cleanup_stale_matches();

  -- Verificar se já existe convite pendente entre esses usuários
  SELECT id INTO v_existing_invite
  FROM multiplayer_invites
  WHERE sender_id = auth.uid()
    AND receiver_id = p_receiver_id
    AND status = 'pending'
    AND expires_at > NOW();
  
  IF v_existing_invite IS NOT NULL THEN
    RAISE EXCEPTION 'Já existe um convite pendente para este usuário';
  END IF;

  -- Verificar se o destinatário não está em partida ATIVA
  IF EXISTS (
    SELECT 1 FROM multiplayer_matches
    WHERE (player1_id = p_receiver_id OR player2_id = p_receiver_id)
      AND status = 'active'
      AND started_at IS NOT NULL
      AND started_at > NOW() - INTERVAL '10 minutes'
  ) THEN
    RAISE EXCEPTION 'Este usuário já está em uma partida ativa';
  END IF;

  -- Criar convite
  INSERT INTO multiplayer_invites (
    sender_id,
    sender_username,
    receiver_id,
    receiver_username,
    status
  ) VALUES (
    auth.uid(),
    p_sender_username,
    p_receiver_id,
    p_receiver_username,
    'pending'
  )
  RETURNING id INTO v_invite_id;

  RETURN v_invite_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC para aceitar convite (cria match)
CREATE OR REPLACE FUNCTION accept_multiplayer_invite(p_invite_id UUID)
RETURNS UUID AS $$
DECLARE
  v_invite RECORD;
  v_match_id UUID;
BEGIN
  -- Limpar matches travadas antes de verificar
  PERFORM cleanup_stale_matches();

  -- Buscar convite e validar
  SELECT * INTO v_invite
  FROM multiplayer_invites
  WHERE id = p_invite_id
    AND receiver_id = auth.uid()
    AND status = 'pending'
    AND expires_at > NOW();

  IF v_invite IS NULL THEN
    RAISE EXCEPTION 'Convite não encontrado, expirado ou já respondido';
  END IF;

  -- Verificar se ambos os jogadores não estão em partida ATIVA (ignorar waiting antigas)
  IF EXISTS (
    SELECT 1 FROM multiplayer_matches
    WHERE (player1_id = v_invite.sender_id OR player2_id = v_invite.sender_id
           OR player1_id = v_invite.receiver_id OR player2_id = v_invite.receiver_id)
      AND status = 'active'
      AND started_at IS NOT NULL
      AND started_at > NOW() - INTERVAL '10 minutes'
  ) THEN
    RAISE EXCEPTION 'Um dos jogadores já está em uma partida ativa';
  END IF;

  -- Criar match
  INSERT INTO multiplayer_matches (
    player1_id,
    player1_username,
    player2_id,
    player2_username,
    status,
    game_duration,
    score_limit
  ) VALUES (
    v_invite.sender_id,
    v_invite.sender_username,
    v_invite.receiver_id,
    v_invite.receiver_username,
    'waiting',
    120,
    10
  )
  RETURNING id INTO v_match_id;

  -- Atualizar convite
  UPDATE multiplayer_invites
  SET 
    status = 'accepted',
    match_id = v_match_id,
    responded_at = NOW()
  WHERE id = p_invite_id;

  RETURN v_match_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC para recusar convite
CREATE OR REPLACE FUNCTION reject_multiplayer_invite(p_invite_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE multiplayer_invites
  SET 
    status = 'rejected',
    responded_at = NOW()
  WHERE id = p_invite_id
    AND receiver_id = auth.uid()
    AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Convite não encontrado ou já respondido';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC para cancelar convite (pelo remetente)
CREATE OR REPLACE FUNCTION cancel_multiplayer_invite(p_invite_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE multiplayer_invites
  SET 
    status = 'cancelled',
    responded_at = NOW()
  WHERE id = p_invite_id
    AND sender_id = auth.uid()
    AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Convite não encontrado ou já respondido';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para expirar convites antigos (executar periodicamente)
CREATE OR REPLACE FUNCTION expire_old_invites()
RETURNS void AS $$
BEGIN
  UPDATE multiplayer_invites
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para limpar matches travadas automaticamente
CREATE OR REPLACE FUNCTION cleanup_stale_matches()
RETURNS void AS $$
BEGIN
  -- Finalizar matches waiting há mais de 5 minutos
  UPDATE multiplayer_matches
  SET 
    status = 'finished',
    winner_reason = 'abandoned',
    finished_at = NOW()
  WHERE status = 'waiting'
    AND started_at IS NULL
    AND created_at < NOW() - INTERVAL '5 minutes';

  -- Finalizar matches active travadas (mais de 10 minutos sem finalizar)
  UPDATE multiplayer_matches
  SET 
    status = 'finished',
    winner_reason = 'timeout',
    finished_at = NOW()
  WHERE status = 'active'
    AND started_at IS NOT NULL
    AND started_at < NOW() - INTERVAL '10 minutes'
    AND finished_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
