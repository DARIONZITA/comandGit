-- Script de testes para validar o sistema de desafios
-- Execute este script para testar a estrutura do banco de dados

-- ============================================
-- TESTES BÁSICOS DE ESTRUTURA
-- ============================================

-- Teste 1: Verificar se todas as tabelas foram criadas
SELECT 
    'worlds' as table_name, 
    COUNT(*) as record_count 
FROM worlds
UNION ALL
SELECT 'git_states', COUNT(*) FROM git_states
UNION ALL
SELECT 'challenges', COUNT(*) FROM challenges
UNION ALL
SELECT 'dynamic_variables', COUNT(*) FROM dynamic_variables
UNION ALL
SELECT 'valid_transitions', COUNT(*) FROM valid_transitions;

-- ============================================
-- TESTES DE DESAFIOS SIMPLES
-- ============================================

-- Teste 2: Buscar um desafio simples (git add)
SELECT 
    c.challenge_id,
    w.world_name,
    c.question_template,
    c.is_multi_step,
    gs.state_name as start_state,
    c.points,
    c.timer_seconds
FROM challenges c
JOIN worlds w ON c.world_id = w.world_id
JOIN git_states gs ON c.start_state_id = gs.state_id
WHERE c.challenge_id = 2;

-- Teste 3: Buscar transições para o desafio de git add
SELECT 
    vt.transition_id,
    vt.challenge_id,
    gs_current.state_name as current_state,
    vt.answer_pattern,
    vt.command_output,
    gs_next.state_name as next_state,
    vt.is_final_step,
    vt.step_order
FROM valid_transitions vt
JOIN git_states gs_current ON vt.current_state_id = gs_current.state_id
JOIN git_states gs_next ON vt.next_state_id = gs_next.state_id
WHERE vt.challenge_id = 2;

-- ============================================
-- TESTES DE DESAFIOS MULTI-ETAPA
-- ============================================

-- Teste 4: Buscar desafio multi-etapa (add + commit)
SELECT 
    c.challenge_id,
    w.world_name,
    c.question_template,
    c.is_multi_step,
    gs.state_name as start_state,
    c.points
FROM challenges c
JOIN worlds w ON c.world_id = w.world_id
JOIN git_states gs ON c.start_state_id = gs.state_id
WHERE c.challenge_id = 5;

-- Teste 5: Buscar TODAS as transições do desafio multi-etapa
SELECT 
    vt.transition_id,
    vt.step_order,
    gs_current.state_name as current_state,
    vt.answer_pattern,
    gs_next.state_name as next_state,
    vt.is_final_step,
    CASE 
        WHEN vt.is_final_step THEN '✅ FINAL'
        ELSE '⏭️ CONTINUA'
    END as status
FROM valid_transitions vt
JOIN git_states gs_current ON vt.current_state_id = gs_current.state_id
JOIN git_states gs_next ON vt.next_state_id = gs_next.state_id
WHERE vt.challenge_id = 5
ORDER BY vt.step_order;

-- ============================================
-- TESTE DE CONFLITO DE MERGE
-- ============================================

-- Teste 6: Buscar desafio de conflito (2 passos)
SELECT 
    c.challenge_id,
    c.question_template,
    c.is_multi_step,
    gs.state_name as start_state,
    gs.status_template
FROM challenges c
JOIN git_states gs ON c.start_state_id = gs.state_id
WHERE c.challenge_id = 6;

-- Teste 7: Verificar sequência de resolução de conflito
SELECT 
    vt.step_order,
    gs_current.state_name as estado_atual,
    vt.answer_pattern as comando_esperado,
    gs_next.state_name as proximo_estado,
    vt.is_final_step as e_final
FROM valid_transitions vt
JOIN git_states gs_current ON vt.current_state_id = gs_current.state_id
JOIN git_states gs_next ON vt.next_state_id = gs_next.state_id
WHERE vt.challenge_id = 6
ORDER BY vt.step_order;

-- ============================================
-- TESTES DE VARIÁVEIS DINÂMICAS
-- ============================================

-- Teste 8: Listar todas as variáveis e seus valores
SELECT 
    variable_name,
    jsonb_array_length(value_pool) as total_values,
    value_pool
FROM dynamic_variables;

-- Teste 9: Extrair valores individuais de [FILE_NAME]
SELECT 
    variable_name,
    jsonb_array_elements_text(value_pool) as possible_value
FROM dynamic_variables
WHERE variable_name = '[FILE_NAME]';

-- ============================================
-- TESTES DE INTEGRIDADE
-- ============================================

-- Teste 10: Verificar desafios sem transições (problema!)
SELECT 
    c.challenge_id,
    c.question_template,
    COUNT(vt.transition_id) as num_transitions
FROM challenges c
LEFT JOIN valid_transitions vt ON c.challenge_id = vt.challenge_id
GROUP BY c.challenge_id, c.question_template
HAVING COUNT(vt.transition_id) = 0;

-- Teste 11: Verificar transições órfãs (sem desafio)
SELECT 
    vt.transition_id,
    vt.challenge_id,
    vt.answer_pattern
FROM valid_transitions vt
LEFT JOIN challenges c ON vt.challenge_id = c.challenge_id
WHERE c.challenge_id IS NULL;

-- Teste 12: Verificar estados não utilizados
SELECT 
    gs.state_id,
    gs.state_name
FROM git_states gs
WHERE gs.state_id NOT IN (
    SELECT DISTINCT start_state_id FROM challenges
    UNION
    SELECT DISTINCT current_state_id FROM valid_transitions
    UNION
    SELECT DISTINCT next_state_id FROM valid_transitions
);

-- ============================================
-- SIMULAÇÃO DE JOGO
-- ============================================

-- Teste 13: Simular busca de desafio aleatório do Mundo 1
WITH random_challenge AS (
    SELECT * FROM challenges
    WHERE world_id = 1
    ORDER BY RANDOM()
    LIMIT 1
)
SELECT 
    rc.challenge_id,
    w.world_name,
    rc.question_template,
    gs.status_template as git_status,
    rc.is_multi_step,
    rc.points,
    rc.timer_seconds
FROM random_challenge rc
JOIN worlds w ON rc.world_id = w.world_id
JOIN git_states gs ON rc.start_state_id = gs.state_id;

-- Teste 14: Simular validação de comando
-- Supondo challenge_id=2, current_state_id=2, comando="git add app.js"
SELECT 
    vt.transition_id,
    'git add app.js' as comando_jogador,
    vt.answer_pattern as pattern,
    CASE 
        WHEN 'git add app.js' ~ REPLACE(vt.answer_pattern, '[FILE_NAME]', 'app.js') THEN '✅ VÁLIDO'
        ELSE '❌ INVÁLIDO'
    END as resultado,
    vt.is_final_step,
    gs_next.state_name as proximo_estado
FROM valid_transitions vt
JOIN git_states gs_next ON vt.next_state_id = gs_next.state_id
WHERE vt.challenge_id = 2 
  AND vt.current_state_id = 2;

-- ============================================
-- ESTATÍSTICAS DO SISTEMA
-- ============================================

-- Teste 15: Resumo geral do sistema
SELECT 
    'Total de Mundos' as metrica,
    COUNT(*)::TEXT as valor
FROM worlds
UNION ALL
SELECT 'Total de Estados', COUNT(*)::TEXT FROM git_states
UNION ALL
SELECT 'Total de Desafios', COUNT(*)::TEXT FROM challenges
UNION ALL
SELECT 'Desafios Simples', COUNT(*)::TEXT FROM challenges WHERE is_multi_step = FALSE
UNION ALL
SELECT 'Desafios Multi-Etapa', COUNT(*)::TEXT FROM challenges WHERE is_multi_step = TRUE
UNION ALL
SELECT 'Total de Transições', COUNT(*)::TEXT FROM valid_transitions
UNION ALL
SELECT 'Total de Variáveis', COUNT(*)::TEXT FROM dynamic_variables;

-- Teste 16: Desafios por mundo
SELECT 
    w.world_name,
    w.world_level,
    COUNT(c.challenge_id) as total_desafios,
    SUM(CASE WHEN c.is_multi_step THEN 1 ELSE 0 END) as multi_step,
    SUM(CASE WHEN NOT c.is_multi_step THEN 1 ELSE 0 END) as single_step,
    AVG(c.points)::INTEGER as pontos_medio
FROM worlds w
LEFT JOIN challenges c ON w.world_id = c.world_id
GROUP BY w.world_id, w.world_name, w.world_level
ORDER BY w.world_level;

-- Teste 17: Estados mais utilizados
SELECT 
    gs.state_name,
    COUNT(DISTINCT c.challenge_id) as usado_como_start,
    COUNT(DISTINCT vt_current.transition_id) as usado_como_current,
    COUNT(DISTINCT vt_next.transition_id) as usado_como_next
FROM git_states gs
LEFT JOIN challenges c ON gs.state_id = c.start_state_id
LEFT JOIN valid_transitions vt_current ON gs.state_id = vt_current.current_state_id
LEFT JOIN valid_transitions vt_next ON gs.state_id = vt_next.next_state_id
GROUP BY gs.state_id, gs.state_name
ORDER BY (COUNT(DISTINCT c.challenge_id) + COUNT(DISTINCT vt_current.transition_id) + COUNT(DISTINCT vt_next.transition_id)) DESC;

-- ============================================
-- TESTES DE PERFORMANCE
-- ============================================

-- Teste 18: Verificar índices existentes
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename IN ('worlds', 'git_states', 'challenges', 'valid_transitions', 'dynamic_variables')
ORDER BY tablename, indexname;

-- ============================================
-- MENSAGEM FINAL
-- ============================================

SELECT 
    '🎮 Sistema de Desafios Git - Testes Concluídos!' as mensagem,
    NOW() as timestamp;
