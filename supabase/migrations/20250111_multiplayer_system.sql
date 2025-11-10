-- Tabela para fila de matchmaking
CREATE TABLE IF NOT EXISTS multiplayer_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'matched', 'cancelled'))
);

-- Tabela para partidas multiplayer ativas
CREATE TABLE IF NOT EXISTS multiplayer_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player1_username TEXT NOT NULL,
  player1_score INTEGER DEFAULT 0,
  player1_current_challenge INTEGER DEFAULT 0,
  player1_is_ready BOOLEAN DEFAULT false,
  
  player2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player2_username TEXT NOT NULL,
  player2_score INTEGER DEFAULT 0,
  player2_current_challenge INTEGER DEFAULT 0,
  player2_is_ready BOOLEAN DEFAULT false,
  
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'finished')),
  winner_id UUID REFERENCES auth.users(id),
  winner_reason TEXT,
  
  game_duration INTEGER DEFAULT 120, -- duração em segundos (2 minutos)
  score_limit INTEGER DEFAULT 10, -- primeiro a ter +10 de diferença ganha
  
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para eventos em tempo real durante a partida
CREATE TABLE IF NOT EXISTS multiplayer_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES multiplayer_matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('typing', 'submit_correct', 'submit_wrong', 'ready')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para histórico de partidas
CREATE TABLE IF NOT EXISTS multiplayer_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES multiplayer_matches(id) ON DELETE CASCADE,
  player1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player1_username TEXT NOT NULL,
  player1_final_score INTEGER NOT NULL,
  
  player2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player2_username TEXT NOT NULL,
  player2_final_score INTEGER NOT NULL,
  
  winner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  duration_seconds INTEGER NOT NULL,
  played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_multiplayer_queue_status ON multiplayer_queue(status);
CREATE INDEX IF NOT EXISTS idx_multiplayer_queue_created_at ON multiplayer_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_multiplayer_matches_status ON multiplayer_matches(status);
CREATE INDEX IF NOT EXISTS idx_multiplayer_matches_players ON multiplayer_matches(player1_id, player2_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_events_match_id ON multiplayer_events(match_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_events_created_at ON multiplayer_events(created_at);
CREATE INDEX IF NOT EXISTS idx_multiplayer_history_players ON multiplayer_history(player1_id, player2_id);

-- Habilitar Row Level Security (RLS)
ALTER TABLE multiplayer_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para multiplayer_queue
CREATE POLICY "Usuários podem inserir na fila" ON multiplayer_queue
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver a fila" ON multiplayer_queue
  FOR SELECT USING (true);

CREATE POLICY "Usuários podem atualizar suas entradas na fila" ON multiplayer_queue
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas entradas na fila" ON multiplayer_queue
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para multiplayer_matches
CREATE POLICY "Jogadores podem ver suas partidas" ON multiplayer_matches
  FOR SELECT USING (auth.uid() = player1_id OR auth.uid() = player2_id);

CREATE POLICY "Sistema pode criar partidas" ON multiplayer_matches
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Jogadores podem atualizar suas partidas" ON multiplayer_matches
  FOR UPDATE USING (auth.uid() = player1_id OR auth.uid() = player2_id);

-- Políticas RLS para multiplayer_events
CREATE POLICY "Jogadores podem ver eventos de suas partidas" ON multiplayer_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM multiplayer_matches 
      WHERE multiplayer_matches.id = multiplayer_events.match_id 
      AND (multiplayer_matches.player1_id = auth.uid() OR multiplayer_matches.player2_id = auth.uid())
    )
  );

CREATE POLICY "Jogadores podem criar eventos" ON multiplayer_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para multiplayer_history
CREATE POLICY "Usuários podem ver histórico de partidas" ON multiplayer_history
  FOR SELECT USING (auth.uid() = player1_id OR auth.uid() = player2_id);

CREATE POLICY "Sistema pode inserir no histórico" ON multiplayer_history
  FOR INSERT WITH CHECK (true);

-- Função para limpar fila antiga (usuários que saíram)
CREATE OR REPLACE FUNCTION cleanup_old_queue_entries()
RETURNS void AS $$
BEGIN
  DELETE FROM multiplayer_queue 
  WHERE created_at < NOW() - INTERVAL '5 minutes' 
  AND status = 'waiting';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para finalizar partida automaticamente após timeout
CREATE OR REPLACE FUNCTION check_match_timeout()
RETURNS void AS $$
BEGIN
  UPDATE multiplayer_matches
  SET 
    status = 'finished',
    finished_at = NOW(),
    winner_id = CASE 
      WHEN player1_score > player2_score THEN player1_id
      WHEN player2_score > player1_score THEN player2_id
      ELSE player1_id -- empate, player1 ganha
    END,
    winner_reason = 'timeout'
  WHERE status = 'active'
  AND started_at < NOW() - (game_duration || ' seconds')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
