-- Tabela para armazenar rating multiplayer de cada usuário
CREATE TABLE IF NOT EXISTS multiplayer_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 700, -- Inicia com 700 pontos
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  total_matches INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_multiplayer_ratings_user_id ON multiplayer_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_ratings_rating ON multiplayer_ratings(rating DESC);

-- Habilitar RLS
ALTER TABLE multiplayer_ratings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para multiplayer_ratings
CREATE POLICY "Todos podem ver ratings" ON multiplayer_ratings
  FOR SELECT USING (true);

CREATE POLICY "Sistema pode inserir ratings" ON multiplayer_ratings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Sistema pode atualizar ratings" ON multiplayer_ratings
  FOR UPDATE USING (true);

-- Função para atualizar rating após partida
-- Vencedor +50, Perdedor -50 (pode ficar negativo)
CREATE OR REPLACE FUNCTION update_multiplayer_rating(
  winner_user_id UUID,
  loser_user_id UUID
)
RETURNS void AS $$
DECLARE
  winner_username TEXT;
  loser_username TEXT;
BEGIN
  -- Buscar usernames
  SELECT username INTO winner_username FROM auth.users WHERE id = winner_user_id;
  SELECT username INTO loser_username FROM auth.users WHERE id = loser_user_id;

  -- Atualizar rating do vencedor (+50 pontos)
  INSERT INTO multiplayer_ratings (user_id, username, rating, wins, total_matches)
  VALUES (winner_user_id, winner_username, 750, 1, 1) -- 700 inicial + 50
  ON CONFLICT (user_id)
  DO UPDATE SET
    rating = multiplayer_ratings.rating + 50,
    wins = multiplayer_ratings.wins + 1,
    total_matches = multiplayer_ratings.total_matches + 1,
    updated_at = NOW();

  -- Atualizar rating do perdedor (-50 pontos, pode ficar negativo)
  INSERT INTO multiplayer_ratings (user_id, username, rating, losses, total_matches)
  VALUES (loser_user_id, loser_username, 650, 1, 1) -- 700 inicial - 50
  ON CONFLICT (user_id)
  DO UPDATE SET
    rating = multiplayer_ratings.rating - 50,
    losses = multiplayer_ratings.losses + 1,
    total_matches = multiplayer_ratings.total_matches + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar rating automaticamente quando partida é inserida no histórico
CREATE OR REPLACE FUNCTION trigger_update_multiplayer_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Determinar perdedor (o que não é o vencedor)
  DECLARE
    loser_id UUID;
  BEGIN
    IF NEW.winner_id = NEW.player1_id THEN
      loser_id := NEW.player2_id;
    ELSE
      loser_id := NEW.player1_id;
    END IF;

    -- Atualizar ratings
    PERFORM update_multiplayer_rating(NEW.winner_id, loser_id);
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para histórico de partidas
DROP TRIGGER IF EXISTS multiplayer_history_update_rating ON multiplayer_history;
CREATE TRIGGER multiplayer_history_update_rating
AFTER INSERT ON multiplayer_history
FOR EACH ROW
EXECUTE FUNCTION trigger_update_multiplayer_rating();

-- Função para buscar leaderboard de rating multiplayer
CREATE OR REPLACE FUNCTION get_multiplayer_leaderboard(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  username TEXT,
  rating INTEGER,
  wins INTEGER,
  losses INTEGER,
  total_matches INTEGER,
  win_rate NUMERIC,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mr.id,
    mr.user_id,
    mr.username,
    mr.rating,
    mr.wins,
    mr.losses,
    mr.total_matches,
    CASE 
      WHEN mr.total_matches > 0 THEN ROUND((mr.wins::NUMERIC / mr.total_matches::NUMERIC) * 100, 2)
      ELSE 0
    END as win_rate,
    mr.updated_at
  FROM multiplayer_ratings mr
  ORDER BY mr.rating DESC, mr.wins DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários para documentação
COMMENT ON TABLE multiplayer_ratings IS 
'Armazena rating/pontuação competitiva de cada jogador no modo multiplayer. Inicia em 700, vencedor ganha +50, perdedor perde -50 (pode ficar negativo)';

COMMENT ON FUNCTION update_multiplayer_rating(UUID, UUID) IS 
'Atualiza rating de vencedor (+50) e perdedor (-50) após uma partida multiplayer';

COMMENT ON FUNCTION get_multiplayer_leaderboard(INTEGER) IS 
'Retorna ranking multiplayer ordenado por rating (descendente)';

COMMENT ON TRIGGER multiplayer_history_update_rating ON multiplayer_history IS 
'Trigger que atualiza automaticamente os ratings quando uma partida é adicionada ao histórico';
