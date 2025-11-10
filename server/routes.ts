import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createClient } from "@supabase/supabase-js";
import { gameEngine } from "./gameEngine";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Supabase environment variables missing");
}

const supabase = createClient(supabaseUrl as string, supabaseServiceKey as string);

export async function registerRoutes(app: Express): Promise<Server> {
  const getUsername = (users: any) => Array.isArray(users) ? users[0]?.username : users?.username;
  
  // Test route
  app.get("/api/test", (_req, res) => {
    res.json({ 
      status: "ok", 
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseServiceKey,
      timestamp: new Date().toISOString() 
    });
  });

  // Leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const limit = Math.max(1, Math.min(parseInt(req.query.limit as string) || 10, 50));
      
      const { data, error } = await supabase.rpc('get_leaderboard', { limit_count: limit });
      
      if (error) throw error;
      res.json(data || []);
    } catch (error) {
      console.error('[LEADERBOARD] Error:', error);
      res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
  });

  // Public user profile
  app.get("/api/users/:userId/public", async (req, res) => {
    try {
      const { userId } = req.params;
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, username, created_at')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      if (!user) return res.status(404).json({ error: 'User not found' });

      const { data: stats, error: statsError } = await supabase
        .from('game_scores')
        .select('score, combo')
        .eq('user_id', userId);

      if (statsError) throw statsError;

      const totalScore = stats?.reduce((sum: number, s: any) => sum + s.score, 0) || 0;
      const highestScore = stats?.length > 0 ? Math.max(...stats.map((s: any) => s.score)) : 0;
      const highestCombo = stats?.length > 0 ? Math.max(...stats.map((s: any) => s.combo || 0)) : 0;
      const totalGames = stats?.length || 0;

      res.json({
        id: user.id,
        username: user.username,
        created_at: user.created_at,
        stats: { totalScore, highestScore, highestCombo, totalGames },
      });
    } catch (error) {
      console.error('Error fetching public profile:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });

  // User achievements
  app.get("/api/users/:userId/achievements", async (req, res) => {
    try {
      const { userId } = req.params;
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`id, unlocked_at, achievements (id, name, description, icon, requirement_type, requirement_value)`)
        .eq('user_id', userId);

      if (error) throw error;
      res.json(data || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      res.status(500).json({ error: 'Failed to fetch achievements' });
    }
  });

  // World-specific leaderboard
  app.get("/api/worlds/:worldId/leaderboard", async (req, res) => {
    try {
      const { worldId } = req.params;
      const limit = Math.max(1, Math.min(parseInt(req.query.limit as string) || 5, 50));

      const { data, error } = await supabase
        .from('game_scores')
        .select(`id, score, combo, created_at, users!inner (username)`)
        .eq('world', parseInt(worldId))
        .order('score', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const leaderboard = data.map((score: any) => ({
        id: score.id,
        username: getUsername(score.users),
        score: score.score,
        combo: score.combo,
        created_at: score.created_at,
      }));

      res.json(leaderboard);
    } catch (error) {
      console.error('Error fetching world leaderboard:', error);
      res.status(500).json({ error: 'Failed to fetch world leaderboard' });
    }
  });

  // High Score Leaderboard por modo (Habilidade)
  app.get("/api/leaderboard/high-score/:mode", async (req, res) => {
    try {
      const { mode } = req.params;
      const limit = Math.max(1, Math.min(parseInt(req.query.limit as string) || 10, 50));
      
      let orderColumn = 'high_score_normal';
      if (mode === 'dojo') orderColumn = 'high_score_dojo';
      if (mode === 'arcade') orderColumn = 'high_score_arcade';

      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .order(orderColumn, { ascending: false })
        .limit(limit);

      if (error) throw error;
      res.json(data || []);
    } catch (error) {
      console.error('[HIGH_SCORE_LEADERBOARD] Error:', error);
      res.status(500).json({ error: 'Failed to fetch high score leaderboard' });
    }
  });

  // XP Total Leaderboard (Experiência/Persistência)
  app.get("/api/leaderboard/xp", async (req, res) => {
    try {
      const limit = Math.max(1, Math.min(parseInt(req.query.limit as string) || 10, 50));

      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .order('total_xp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      res.json(data || []);
    } catch (error) {
      console.error('[XP_LEADERBOARD] Error:', error);
      res.status(500).json({ error: 'Failed to fetch XP leaderboard' });
    }
  });

  // Estatísticas de um usuário específico
  app.get("/api/user-stats/:userId", async (req, res) => {
    try {
      const { userId } = req.params;

      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error('[USER_STATS] Error:', error);
      res.status(404).json({ error: 'User stats not found' });
    }
  });

  // ========== ROTAS DO NOVO SISTEMA DE DESAFIOS ==========
  // ===== DEBUG MULTIPLAYER =====
  // Endpoint para inspeção rápida do estado da fila e partidas envolvendo o usuário autenticado
  app.get('/api/multiplayer/debug-state', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      // Este endpoint assume que o cliente já tem sessão supabase e envia o user id como query
      const userId = (req.query.user_id as string) || 'unknown';
      const now = new Date().toISOString();
      console.log(`[MP_DEBUG ${now}] solicitando estado para user ${userId}`);

      const { data: queueEntries, error: qErr } = await supabase
        .from('multiplayer_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (qErr) throw qErr;

      const { data: waitingMatches, error: wErr } = await supabase
        .from('multiplayer_matches')
        .select('*')
        .eq('status', 'waiting')
        .order('created_at', { ascending: false })
        .limit(5);
      if (wErr) throw wErr;

      const { data: activeMatches, error: aErr } = await supabase
        .from('multiplayer_matches')
        .select('*')
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(5);
      if (aErr) throw aErr;

      // Procurar partidas específicas do usuário (qualquer status)
      const { data: userMatches, error: uErr } = await supabase
        .from('multiplayer_matches')
        .select('*')
        .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(5);
      if (uErr) throw uErr;

      console.log(`[MP_DEBUG ${now}] fila(${queueEntries.length}) waiting(${waitingMatches.length}) active(${activeMatches.length}) userMatches(${userMatches.length})`);

      res.json({
        timestamp: now,
        authHeaderPresent: !!authHeader,
        userId,
        queueEntries,
        waitingMatches,
        activeMatches,
        userMatches,
      });
    } catch (error) {
      console.error('[MP_DEBUG] Erro ao recuperar estado:', error);
      res.status(500).json({ error: 'Erro ao recuperar estado multiplayer', details: (error as any)?.message });
    }
  });

  // Buscar todos os mundos disponíveis
  app.get("/api/worlds", async (_req, res) => {
    try {
      const worlds = await gameEngine.getAvailableWorlds();
      res.json(worlds);
    } catch (error) {
      console.error('[WORLDS] Error:', error);
      res.status(500).json({ error: 'Erro ao buscar mundos' });
    }
  });

  // Buscar informações de um mundo específico
  app.get("/api/worlds/:worldId", async (req, res) => {
    try {
      const worldId = parseInt(req.params.worldId);
      const worldInfo = await gameEngine.getWorldInfo(worldId);
      
      if (!worldInfo) {
        return res.status(404).json({ error: 'Mundo não encontrado' });
      }
      
      res.json(worldInfo);
    } catch (error) {
      console.error('[WORLD_INFO] Error:', error);
      res.status(500).json({ error: 'Erro ao buscar informações do mundo' });
    }
  });

  // Buscar um desafio aleatório de um mundo
  app.get("/api/challenges/batch/:worldId", async (req, res) => {
    try {
      const worldId = parseInt(req.params.worldId);
      const count = Math.max(1, Math.min(parseInt(req.query.count as string) || 15, 50));

      if (!Number.isFinite(worldId)) {
        return res.status(400).json({ error: 'World ID inválido' });
      }

      const challenges = await gameEngine.getRandomChallenges(worldId, count);
      res.json(challenges);
    } catch (error) {
      console.error('[BATCH_CHALLENGES] Error:', error);
      res.status(500).json({ error: 'Erro ao buscar lote de desafios' });
    }
  });

  // Buscar um desafio aleatório de um mundo
  app.get("/api/challenges/random/:worldId", async (req, res) => {
    try {
      const worldId = parseInt(req.params.worldId);
      const challenge = await gameEngine.getRandomChallenge(worldId);
      
      if (!challenge) {
        return res.status(404).json({ error: 'Nenhum desafio encontrado para este mundo' });
      }
      
      res.json(challenge);
    } catch (error) {
      console.error('[RANDOM_CHALLENGE] Error:', error);
      res.status(500).json({ error: 'Erro ao buscar desafio' });
    }
  });

  // Validar um comando do jogador
  app.post("/api/challenges/validate", async (req, res) => {
    try {
      const { challengeId, currentStateId, command, variables } = req.body;
      
      if (!challengeId || !currentStateId || !command) {
        return res.status(400).json({ error: 'Parâmetros inválidos' });
      }
      
      const result = await gameEngine.validateCommand(
        challengeId,
        currentStateId,
        command,
        variables || {}
      );
      
      res.json(result);
    } catch (error) {
      console.error('[VALIDATE_COMMAND] Error:', error);
      res.status(500).json({ error: 'Erro ao validar comando' });
    }
  });

  // Buscar respostas corretas de um desafio (para mostrar após erro)
  app.get("/api/challenges/:challengeId/answers", async (req, res) => {
    try {
      const challengeId = parseInt(req.params.challengeId);
      
      if (!challengeId) {
        return res.status(400).json({ error: 'Challenge ID inválido' });
      }

      // Buscar o desafio com a resposta correta
      const { data: challenge, error: challengeError } = await supabase
        .from('challenges')
        .select('correct_answer_template, is_multi_step')
        .eq('challenge_id', challengeId)
        .single();

      if (challengeError || !challenge) {
        console.error('[ANSWERS] Challenge Error:', challengeError);
        return res.status(404).json({ error: 'Desafio não encontrado' });
      }

      console.log('[ANSWERS] Challenge data:', challenge);

      // Se tem resposta direta no desafio, usar ela
      if (challenge.correct_answer_template) {
        // Se for multi-step, dividir por && ou quebrar em comandos separados
        let answers = [];
        if (challenge.is_multi_step && challenge.correct_answer_template.includes('&&')) {
          answers = challenge.correct_answer_template.split('&&').map((cmd: string) => cmd.trim());
        } else {
          answers = [challenge.correct_answer_template];
        }

        console.log('[ANSWERS] Returning template answers:', answers);

        return res.json({ 
          answers,
          isMultiStep: challenge.is_multi_step,
          hasTemplate: true
        });
      }

      // Fallback: buscar das transições (método antigo)
      const { data: transitions, error } = await supabase
        .from('valid_transitions')
        .select('answer_pattern, step_order, is_final_step')
        .eq('challenge_id', challengeId)
        .order('step_order', { ascending: true });

      if (error) {
        console.error('[ANSWERS] Transitions Error:', error);
        return res.status(500).json({ error: 'Erro ao buscar respostas' });
      }

      // Extrair patterns de resposta (simplificados)
      const answers = transitions?.map(t => {
        // Remover regex para mostrar formato legível
        let pattern = t.answer_pattern
          .replace(/\^/g, '')
          .replace(/\$/g, '')
          .replace(/\\s\+/g, ' ')
          .replace(/\\/g, '');
        
        return pattern;
      }) || [];

      res.json({ 
        answers,
        isMultiStep: transitions && transitions.length > 1,
        hasTemplate: false
      });
    } catch (error) {
      console.error('[ANSWERS] Error:', error);
      res.status(500).json({ error: 'Erro ao buscar respostas' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
