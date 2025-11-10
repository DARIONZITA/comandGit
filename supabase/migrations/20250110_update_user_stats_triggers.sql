-- Criar ou substituir a função que atualiza user_stats
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir ou atualizar estatísticas do usuário
  INSERT INTO user_stats (
    user_id,
    username,
    high_score_normal,
    high_score_dojo,
    high_score_arcade,
    total_xp_normal,
    total_xp_dojo,
    total_xp_arcade,
    total_xp,
    level,
    total_games,
    total_combos,
    max_combo
  )
  VALUES (
    NEW.user_id,
    (SELECT username FROM users WHERE id = NEW.user_id),
    CASE WHEN NEW.mode = 'normal' THEN NEW.score ELSE 0 END,
    CASE WHEN NEW.mode = 'dojo' THEN NEW.score ELSE 0 END,
    CASE WHEN NEW.mode = 'arcade' THEN NEW.score ELSE 0 END,
    CASE WHEN NEW.mode = 'normal' THEN NEW.score ELSE 0 END,
    CASE WHEN NEW.mode = 'dojo' THEN NEW.score ELSE 0 END,
    CASE WHEN NEW.mode = 'arcade' THEN NEW.score ELSE 0 END,
    NEW.score,
    1,
    1,
    NEW.combo,
    NEW.combo
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    username = (SELECT username FROM users WHERE id = NEW.user_id),
    high_score_normal = CASE 
      WHEN NEW.mode = 'normal' AND NEW.score > user_stats.high_score_normal 
      THEN NEW.score 
      ELSE user_stats.high_score_normal 
    END,
    high_score_dojo = CASE 
      WHEN NEW.mode = 'dojo' AND NEW.score > user_stats.high_score_dojo 
      THEN NEW.score 
      ELSE user_stats.high_score_dojo 
    END,
    high_score_arcade = CASE 
      WHEN NEW.mode = 'arcade' AND NEW.score > user_stats.high_score_arcade 
      THEN NEW.score 
      ELSE user_stats.high_score_arcade 
    END,
    total_xp_normal = user_stats.total_xp_normal + CASE WHEN NEW.mode = 'normal' THEN NEW.score ELSE 0 END,
    total_xp_dojo = user_stats.total_xp_dojo + CASE WHEN NEW.mode = 'dojo' THEN NEW.score ELSE 0 END,
    total_xp_arcade = user_stats.total_xp_arcade + CASE WHEN NEW.mode = 'arcade' THEN NEW.score ELSE 0 END,
    total_xp = user_stats.total_xp + NEW.score,
    level = GREATEST(1, FLOOR((user_stats.total_xp + NEW.score) / 1000.0) + 1),
    total_games = user_stats.total_games + 1,
    total_combos = user_stats.total_combos + NEW.combo,
    max_combo = GREATEST(user_stats.max_combo, NEW.combo),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS game_scores_update_stats ON game_scores;

-- Criar trigger que executa após inserção de pontuação
CREATE TRIGGER game_scores_update_stats
AFTER INSERT ON game_scores
FOR EACH ROW
EXECUTE FUNCTION update_user_stats();

-- Comentários para documentação
COMMENT ON FUNCTION update_user_stats() IS 
'Atualiza automaticamente as estatísticas do usuário quando uma nova pontuação é inserida';

COMMENT ON TRIGGER game_scores_update_stats ON game_scores IS 
'Trigger que mantém a tabela user_stats sincronizada com game_scores';
