import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useAuth } from '@/contexts/AuthContext';

export interface MultiplayerChallenge {
  id: number;
  question: string;
  answer: string;
  category: string;
  // Metadados para desafios compostos (sequenciais)
  compositeId?: string; // ID único do desafio composto (ex: "composite_1")
  stepNumber?: number;  // Número do passo atual (ex: 1, 2, 3)
  totalSteps?: number;  // Total de passos no desafio composto
}

export interface PlayerState {
  id: string;
  username: string;
  score: number;
  currentChallenge: number;
  isReady: boolean;
}

export interface MatchState {
  id: string;
  player1: PlayerState;
  player2: PlayerState;
  status: 'waiting' | 'active' | 'finished';
  winnerId?: string;
  winnerReason?: string;
  gameDuration: number;
  scoreLimit: number;
  startedAt?: string;
  finishedAt?: string;
}

export interface OpponentActivity {
  inputLength: number;
  lastSubmission: {
    result: 'correct' | 'wrong';
    timestamp: number;
  } | null;
}

export function useMultiplayer() {
  const { user } = useAuth();
  const [isSearching, setIsSearching] = useState(false);
  const queryClient = useQueryClient();
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [challenges, setChallenges] = useState<MultiplayerChallenge[]>([]);
  const [opponentActivity, setOpponentActivity] = useState<OpponentActivity>({
    inputLength: 0,
    lastSubmission: null,
  });
  const [timeRemaining, setTimeRemaining] = useState<number>(120);
  
  const matchChannelRef = useRef<RealtimeChannel | null>(null);
  const queueChannelRef = useRef<RealtimeChannel | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const waitingRefetchRef = useRef<NodeJS.Timeout | null>(null);
  const requeueLockRef = useRef(false);
  const globalMatchChannelRef = useRef<RealtimeChannel | null>(null);
  const isPrefetchingRef = useRef(false);

  // Gerar desafios aleatórios do banco de dados
  const generateRandomChallenges = useCallback(async () => {
    try {
      console.log('[Multiplayer] 🎲 Buscando desafios do banco de dados...');
      
      // Buscar desafios de todos os mundos (world_id 1, 2, 3)
      const worldIds = [1, 2, 3];
      const challengesPerWorld = 15; // 15 de cada mundo = 45 desafios totais
      
  const allChallenges: MultiplayerChallenge[] = [];
  const seenChallengeIds = new Set<number>(); // evita duplicatas entre mundos
      
      for (const worldId of worldIds) {
        try {
          const response = await fetch(`/api/challenges/batch/${worldId}?count=${challengesPerWorld}`);
          if (!response.ok) {
            console.warn(`[Multiplayer] ⚠️ Erro ao buscar desafios do mundo ${worldId}`);
            continue;
          }
          
          const challenges = await response.json();
          console.log(`[Multiplayer] ✅ Mundo ${worldId}: ${challenges.length} desafios carregados`);
          
          // Converter formato do banco para MultiplayerChallenge
          challenges.forEach((ch: any, index: number) => {
            // Pular se esse challenge_id já foi carregado de outro mundo
            if (seenChallengeIds.has(ch.challengeId)) return;
            seenChallengeIds.add(ch.challengeId);
            
            // Verificar se é desafio composto baseado apenas no número de respostas
            console.log(ch.correctAnswer );
            const answers = (ch.correctAnswer || "").split('&&').map((cmd: string) => cmd.trim());
            const isComposite = answers.length > 1;
            
            if (isComposite) {
              // Criar um objeto MultiplayerChallenge para cada passo
              answers.forEach((answer: string, stepIndex: number) => {
                allChallenges.push({
                  id: ch.challengeId * 1000 + stepIndex, // ID único por passo
                  question: ch.question, // A mesma pergunta para todos os passos
                  answer: answer,
                  category: ch.difficulty <= 2 ? 'basic' : ch.difficulty <= 4 ? 'intermediate' : 'advanced',
                  compositeId: `composite_${ch.challengeId}`,
                  stepNumber: stepIndex + 1,
                  totalSteps: answers.length,
                });
              });
            } else {
              // Desafio simples (apenas uma resposta)
              allChallenges.push({
                id: ch.challengeId * 1000 + index, // ID único
                question: ch.question,
                answer: answers[0] || 'git',
                category: ch.difficulty <= 2 ? 'basic' : ch.difficulty <= 4 ? 'intermediate' : 'advanced',
              });
            }
          });
        } catch (err) {
          console.error(`[Multiplayer] ❌ Erro ao processar mundo ${worldId}:`, err);
        }
      }
      
      console.log(`[Multiplayer] 📊 Total de desafios carregados: ${allChallenges.length}`);
      
      // Se não conseguiu carregar nenhum desafio, usar fallback estático
      if (allChallenges.length === 0) {
        console.warn('[Multiplayer] ⚠️ Usando desafios estáticos como fallback');
        return generateFallbackChallenges();
      }

      // Separar desafios simples de compostos
      const simpleChallenges = allChallenges.filter(c => !c.compositeId);
      const compositeChallenges = allChallenges.filter(c => c.compositeId);
      
      // Agrupar desafios compostos por compositeId
      const compositeGroups = new Map<string, MultiplayerChallenge[]>();
      compositeChallenges.forEach(c => {
        if (c.compositeId) {
          if (!compositeGroups.has(c.compositeId)) {
            compositeGroups.set(c.compositeId, []);
          }
          compositeGroups.get(c.compositeId)!.push(c);
        }
      });
      
      // Ordenar cada grupo por stepNumber
      compositeGroups.forEach(group => {
        group.sort((a, b) => (a.stepNumber || 0) - (b.stepNumber || 0));
      });
      
      // Embaralhar desafios simples
      const shuffledSimple = simpleChallenges.sort(() => Math.random() - 0.5);
      
      // Embaralhar a ordem dos grupos compostos (mas manter sequência interna)
      const compositeGroupsArray = Array.from(compositeGroups.values());
      const shuffledCompositeGroups = compositeGroupsArray.sort(() => Math.random() - 0.5);
      
      // Intercalar desafios simples e compostos
      const result: MultiplayerChallenge[] = [];
      let simpleIndex = 0;
      let compositeGroupIndex = 0;
      
      while (simpleIndex < shuffledSimple.length || compositeGroupIndex < shuffledCompositeGroups.length) {
        // Adicionar 2-3 desafios simples
        const simpleCount = Math.floor(Math.random() * 2) + 2; // 2 ou 3
        for (let i = 0; i < simpleCount && simpleIndex < shuffledSimple.length; i++) {
          result.push(shuffledSimple[simpleIndex++]);
        }
        
        // Adicionar um grupo composto inteiro
        if (compositeGroupIndex < shuffledCompositeGroups.length) {
          result.push(...shuffledCompositeGroups[compositeGroupIndex++]);
        }
      }
      
      console.log(`[Multiplayer] ✨ Desafios embaralhados: ${result.length} desafios prontos`);
      return result;
    } catch (error) {
      console.error('[Multiplayer] ❌ Erro ao gerar desafios:', error);
      return generateFallbackChallenges();
    }
  }, []);

  // Prefetch: buscar mais desafios quando restarem poucos
  const fetchMoreChallengesIfNeeded = useCallback(async (currentIndex: number) => {
    const PREFETCH_THRESHOLD = 10; // quando restarem <= 10, buscar mais
    if (!Array.isArray(challenges) || challenges.length === 0) return;
    if (isPrefetchingRef.current) return; // evitar múltiplas requisições simultâneas
    
    const remaining = challenges.length - (currentIndex + 1);
    if (remaining > PREFETCH_THRESHOLD) return;

    try {
      console.log('[Multiplayer] 🔄 Prefetch: restam apenas', remaining, 'desafios, buscando mais...');
      isPrefetchingRef.current = true;
      
      const more = await generateRandomChallenges();
      if (!more || more.length === 0) {
        console.warn('[Multiplayer] ⚠️ Prefetch: nenhum desafio retornado');
        return;
      }

      // Dedupe por id antes de anexar
      const seen = new Set(challenges.map(c => c.id));
      const filtered = more.filter(c => !seen.has(c.id));
      
      if (filtered.length === 0) {
        console.warn('[Multiplayer] ⚠️ Prefetch: todos os desafios já existiam (duplicatas)');
        return;
      }

      setChallenges(prev => {
        const existingIds = new Set(prev.map(c => c.id));
        const toAppend = filtered.filter(c => !existingIds.has(c.id));
        const updated = [...prev, ...toAppend];
        console.log('[Multiplayer] ✅ Prefetch: anexados', toAppend.length, 'desafios. Total agora:', updated.length);
        return updated;
      });
    } catch (err) {
      console.error('[Multiplayer] ❌ Prefetch erro:', err);
    } finally {
      isPrefetchingRef.current = false;
    }
  }, [challenges, generateRandomChallenges]);

  // Fallback: desafios estáticos caso o banco falhe
  const generateFallbackChallenges = useCallback(() => {
    const allChallenges: MultiplayerChallenge[] = [
      // Desafios Git Básicos
      { id: 1, question: "Inicialize um repositório Git", answer: "git init", category: "basic" },
      { id: 2, question: "Adicione todos os arquivos ao stage", answer: "git add .", category: "basic" },
      { id: 3, question: "Faça um commit com a mensagem 'Initial commit'", answer: "git commit -m 'Initial commit'", category: "basic" },
      { id: 4, question: "Verifique o status do repositório", answer: "git status", category: "basic" },
      { id: 5, question: "Veja o histórico de commits", answer: "git log", category: "basic" },
      
      // Desafios Git Intermediários
      { id: 6, question: "Crie uma branch chamada 'feature'", answer: "git branch feature", category: "intermediate" },
      { id: 7, question: "Mude para a branch 'develop'", answer: "git checkout develop", category: "intermediate" },
      { id: 8, question: "Crie e mude para uma branch 'hotfix'", answer: "git checkout -b hotfix", category: "intermediate" },
      { id: 9, question: "Faça merge da branch 'feature' na atual", answer: "git merge feature", category: "intermediate" },
      { id: 10, question: "Delete a branch 'old-feature'", answer: "git branch -d old-feature", category: "intermediate" },
      
      // Desafios Git Avançados
      { id: 11, question: "Faça rebase da branch atual com 'main'", answer: "git rebase main", category: "advanced" },
      { id: 12, question: "Desfaça o último commit mantendo as alterações", answer: "git reset --soft HEAD~1", category: "advanced" },
      { id: 13, question: "Adicione um remote chamado 'origin'", answer: "git remote add origin", category: "advanced" },
      { id: 14, question: "Faça stash das alterações atuais", answer: "git stash", category: "advanced" },
      { id: 15, question: "Aplique o último stash", answer: "git stash pop", category: "advanced" },
      
      // Desafios Git Expert
      { id: 16, question: "Faça cherry-pick do commit abc123", answer: "git cherry-pick abc123", category: "expert" },
      { id: 17, question: "Faça rebase interativo dos últimos 3 commits", answer: "git rebase -i HEAD~3", category: "expert" },
      { id: 18, question: "Altere a mensagem do último commit", answer: "git commit --amend", category: "expert" },
      { id: 19, question: "Limpe branches que não existem mais no remote", answer: "git remote prune origin", category: "expert" },
      { id: 20, question: "Mostre diferenças entre working directory e staging", answer: "git diff", category: "expert" },
      
      // Mais desafios variados
      { id: 21, question: "Clone o repositório remoto", answer: "git clone", category: "basic" },
      { id: 22, question: "Envie commits para o remote 'origin'", answer: "git push origin", category: "basic" },
      { id: 23, question: "Baixe alterações do remote sem fazer merge", answer: "git fetch", category: "intermediate" },
      { id: 24, question: "Baixe e faça merge das alterações do remote", answer: "git pull", category: "intermediate" },
      { id: 25, question: "Liste todas as branches (local e remote)", answer: "git branch -a", category: "intermediate" },
      { id: 26, question: "Mostre quem modificou cada linha do arquivo", answer: "git blame", category: "advanced" },
      { id: 27, question: "Crie uma tag 'v1.0.0'", answer: "git tag v1.0.0", category: "advanced" },
      { id: 28, question: "Envie todas as tags para o remote", answer: "git push --tags", category: "advanced" },
      { id: 29, question: "Desfaça alterações em um arquivo específico", answer: "git checkout -- file", category: "intermediate" },
      { id: 30, question: "Configure seu nome de usuário globalmente", answer: "git config --global user.name", category: "basic" },
      
      // Desafios Compostos - Fluxo de trabalho completo
      // Composite 1: Inicialização de repositório (3 passos)
      { 
        id: 31, 
        question: "Passo 1: Inicialize um novo repositório Git", 
        answer: "git init", 
        category: "basic",
        compositeId: "composite_1",
        stepNumber: 1,
        totalSteps: 3
      },
      { 
        id: 32, 
        question: "Passo 2: Adicione todos os arquivos ao stage", 
        answer: "git add .", 
        category: "basic",
        compositeId: "composite_1",
        stepNumber: 2,
        totalSteps: 3
      },
      { 
        id: 33, 
        question: "Passo 3: Faça o commit inicial com mensagem 'Initial commit'", 
        answer: "git commit -m 'Initial commit'", 
        category: "basic",
        compositeId: "composite_1",
        stepNumber: 3,
        totalSteps: 3
      },
      
      // Composite 2: Trabalho com branches (4 passos)
      { 
        id: 34, 
        question: "Passo 1: Crie uma branch chamada 'feature'", 
        answer: "git branch feature", 
        category: "intermediate",
        compositeId: "composite_2",
        stepNumber: 1,
        totalSteps: 4
      },
      { 
        id: 35, 
        question: "Passo 2: Mude para a branch 'feature'", 
        answer: "git checkout feature", 
        category: "intermediate",
        compositeId: "composite_2",
        stepNumber: 2,
        totalSteps: 4
      },
      { 
        id: 36, 
        question: "Passo 3: Faça merge da branch 'main' na atual", 
        answer: "git merge main", 
        category: "intermediate",
        compositeId: "composite_2",
        stepNumber: 3,
        totalSteps: 4
      },
      { 
        id: 37, 
        question: "Passo 4: Delete a branch 'old-feature'", 
        answer: "git branch -d old-feature", 
        category: "intermediate",
        compositeId: "composite_2",
        stepNumber: 4,
        totalSteps: 4
      },
      
      // Composite 3: Trabalho com remotes (3 passos)
      { 
        id: 38, 
        question: "Passo 1: Adicione um remote chamado 'origin'", 
        answer: "git remote add origin", 
        category: "advanced",
        compositeId: "composite_3",
        stepNumber: 1,
        totalSteps: 3
      },
      { 
        id: 39, 
        question: "Passo 2: Baixe alterações do remote sem fazer merge", 
        answer: "git fetch", 
        category: "advanced",
        compositeId: "composite_3",
        stepNumber: 2,
        totalSteps: 3
      },
      { 
        id: 40, 
        question: "Passo 3: Envie commits para o remote 'origin'", 
        answer: "git push origin", 
        category: "advanced",
        compositeId: "composite_3",
        stepNumber: 3,
        totalSteps: 3
      },
    ];

    // Separar desafios simples de compostos
    const simpleChallenges = allChallenges.filter(c => !c.compositeId);
    const compositeChallenges = allChallenges.filter(c => c.compositeId);
    
    // Agrupar desafios compostos por compositeId
    const compositeGroups = new Map<string, MultiplayerChallenge[]>();
    compositeChallenges.forEach(c => {
      if (c.compositeId) {
        if (!compositeGroups.has(c.compositeId)) {
          compositeGroups.set(c.compositeId, []);
        }
        compositeGroups.get(c.compositeId)!.push(c);
      }
    });
    
    // Ordenar cada grupo por stepNumber
    compositeGroups.forEach(group => {
      group.sort((a, b) => (a.stepNumber || 0) - (b.stepNumber || 0));
    });
    
    // Embaralhar desafios simples
    const shuffledSimple = simpleChallenges.sort(() => Math.random() - 0.5);
    
    // Embaralhar a ordem dos grupos compostos (mas manter sequência interna)
    const compositeGroupsArray = Array.from(compositeGroups.values());
    const shuffledCompositeGroups = compositeGroupsArray.sort(() => Math.random() - 0.5);
    
    // Intercalar desafios simples e compostos
    const result: MultiplayerChallenge[] = [];
    let simpleIndex = 0;
    let compositeGroupIndex = 0;
    
    while (simpleIndex < shuffledSimple.length || compositeGroupIndex < shuffledCompositeGroups.length) {
      // Adicionar 2-3 desafios simples
      const simpleCount = Math.floor(Math.random() * 2) + 2; // 2 ou 3
      for (let i = 0; i < simpleCount && simpleIndex < shuffledSimple.length; i++) {
        result.push(shuffledSimple[simpleIndex++]);
      }
      
      // Adicionar um grupo composto inteiro
      if (compositeGroupIndex < shuffledCompositeGroups.length) {
        result.push(...shuffledCompositeGroups[compositeGroupIndex++]);
      }
    }
    
    return result;
  }, []);

  // Entrar na fila de matchmaking (RPC atômico + fallback)
  const joinQueue = useCallback(async () => {
    if (!user) return;

    try {
      console.log('[Multiplayer] 🚀 joinQueue start, user.id:', user.id);
      setIsSearching(true);

      // Primeiro tentar pegar username da tabela user_stats (onde realmente está!)
      const { data: userStats, error: statsError } = await supabase
        .from('user_stats')
        .select('username')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('[Multiplayer] 📊 user_stats query:', { userStats, statsError });

      let username = userStats?.username;

      // Se não encontrou em user_stats, tentar outras fontes
      if (!username) {
        const { data: userData } = await supabase
          .from('users')
          .select('username')
          .eq('id', user.id)
          .maybeSingle();
        
        if (userData?.username) {
          username = userData.username;
        } else {
          // Fallback para metadata ou email
          username = user.user_metadata?.display_name
            || user.user_metadata?.username
            || user.user_metadata?.full_name
            || (user.email ? user.email.split('@')[0] : null)
            || `Jogador${user.id.slice(-4)}`;
        }
      }

      console.log('[Multiplayer] 👤 Username final para fila:', username);

      // Limpar entradas antigas e garantir estado limpo do usuário
      await supabase.rpc('cleanup_old_queue_entries');
      await supabase.from('multiplayer_queue').delete().eq('user_id', user.id);
      
      // Limpar matches antigas/travadas do usuário
      await supabase
        .from('multiplayer_matches')
        .delete()
        .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
        .in('status', ['waiting', 'finished']);

      // Finalizar partidas ATIVAS possivelmente órfãs do próprio usuário
      // Critérios: (a) sem started_at e criadas há > 2min, ou (b) started_at há mais que game_duration + 60s
      const { data: myActiveMatches } = await supabase
        .from('multiplayer_matches')
        .select('*')
        .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
        .eq('status', 'active');
      if (myActiveMatches && myActiveMatches.length) {
        for (const m of myActiveMatches as any[]) {
          const now = Date.now();
          const createdAt = m.created_at ? new Date(m.created_at).getTime() : 0;
          const startedAt = m.started_at ? new Date(m.started_at).getTime() : null;
          const durationMs = ((m.game_duration ?? 120) + 60) * 1000; // +60s margem
          const isStale = (!startedAt && now - createdAt > 2 * 60 * 1000) || (startedAt && now - startedAt > durationMs);
          if (isStale) {
            await supabase
              .from('multiplayer_matches')
              .update({
                status: 'finished',
                winner_id: m.player1_id, // arbitrário em limpeza
                winner_reason: 'stale_cleanup',
                finished_at: new Date().toISOString(),
              })
              .eq('id', m.id);
          }
        }
      }

      // Inserir própria entrada na fila com username correto
      console.log('[Multiplayer] 📝 Inserindo na fila:', { user_id: user.id, username, status: 'waiting' });
      const { data: insertedRow, error: insertSelfError } = await supabase
        .from('multiplayer_queue')
        .insert({ user_id: user.id, username, status: 'waiting' })
        .select()
        .single();
      
      if (insertSelfError) {
        console.error('[Multiplayer] ❌ Erro ao inserir na fila:', insertSelfError);
        throw insertSelfError;
      }
      
      console.log('[Multiplayer] ✅ Inserido na fila:', insertedRow);

      // Procurar qualquer oponente waiting (apenas filtrar quem está em partida ACTIVE; ignorar waiting para não bloquear corrida)
      const { data: waitingOpponents } = await supabase
        .from('multiplayer_queue')
        .select('*')
        .eq('status', 'waiting')
        .neq('user_id', user.id)
        .order('created_at', { ascending: true });

      let chosenOpponent: any | null = null;
      if (waitingOpponents && waitingOpponents.length) {
        for (const opp of waitingOpponents) {
          // Considerar ocupado apenas se estiver em partida ACTIVE (waiting pode ser resquício antes de cleanup)
            const { data: activeMatch } = await supabase
              .from('multiplayer_matches')
              .select('id')
              .or(`player1_id.eq.${opp.user_id},player2_id.eq.${opp.user_id}`)
              .eq('status', 'active')
              .limit(1)
              .maybeSingle();
            if (!activeMatch) {
              chosenOpponent = opp;
              break;
            } else {
              console.log('[Multiplayer] ⚠️ Oponente em partida ativa, ignorando:', { opp: opp.user_id, match: activeMatch.id });
            }
        }
      }

      if (chosenOpponent) {
        console.log('[Multiplayer] 🤝 Tentando criar match vs', chosenOpponent.user_id);
        const { data: newMatch, error: rpcError } = await supabase
          .rpc('create_match_and_mark_queue', { opponent_id: chosenOpponent.user_id });
        if (rpcError) {
          console.warn('[Multiplayer] create_match RPC error', rpcError);
          if (rpcError.code === 'P0001' && rpcError.message?.includes('Match already exists')) {
            const { data: existingMatch } = await supabase
              .from('multiplayer_matches')
              .select('*')
              .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
              .or(`player1_id.eq.${chosenOpponent.user_id},player2_id.eq.${chosenOpponent.user_id}`)
              .eq('status', 'waiting')
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            if (existingMatch) {
              await supabase.from('multiplayer_queue').delete().eq('user_id', user.id);
              const isPlayer1InExisting = existingMatch.player1_id === user.id;
              const updateData = isPlayer1InExisting
                ? { player1_username: username, player2_username: chosenOpponent.username }
                : { player1_username: chosenOpponent.username, player2_username: username };
              await supabase
                .from('multiplayer_matches')
                .update(updateData)
                .eq('id', existingMatch.id);
              const { data: updatedMatch } = await supabase
                .from('multiplayer_matches')
                .select('*')
                .eq('id', existingMatch.id)
                .single();
              setMatchState({
                id: updatedMatch.id,
                player1: {
                  id: updatedMatch.player1_id,
                  username: updatedMatch.player1_username,
                  score: updatedMatch.player1_score || 0,
                  currentChallenge: updatedMatch.player1_current_challenge || 0,
                  isReady: updatedMatch.player1_is_ready || false,
                },
                player2: {
                  id: updatedMatch.player2_id,
                  username: updatedMatch.player2_username,
                  score: updatedMatch.player2_score || 0,
                  currentChallenge: updatedMatch.player2_current_challenge || 0,
                  isReady: updatedMatch.player2_is_ready || false,
                },
                status: updatedMatch.status,
                gameDuration: updatedMatch.game_duration,
                scoreLimit: updatedMatch.score_limit,
              });
              const challenges = await generateRandomChallenges();
              setChallenges(challenges);
              setIsSearching(false);
              return;
            }
          }
          console.info('[Multiplayer] Continuing com listeners + polling porque RPC falhou/concorrência');
        }
        if (newMatch) {
          setMatchState({
            id: newMatch.id,
            player1: {
              id: newMatch.player1_id,
              username: newMatch.player1_username,
              score: newMatch.player1_score || 0,
              currentChallenge: newMatch.player1_current_challenge || 0,
              isReady: newMatch.player1_is_ready || false,
            },
            player2: {
              id: newMatch.player2_id,
              username: newMatch.player2_username,
              score: newMatch.player2_score || 0,
              currentChallenge: newMatch.player2_current_challenge || 0,
              isReady: newMatch.player2_is_ready || false,
            },
            status: newMatch.status,
            gameDuration: newMatch.game_duration,
            scoreLimit: newMatch.score_limit,
          });
          const challenges = await generateRandomChallenges();
          setChallenges(challenges);
          setIsSearching(false);
          return;
        }
      }

      // Sem oponente imediato: configurar listeners e polling
      console.log('[Multiplayer] ⏳ No opponent yet, setting up listeners and polling...');
      const handleMatchInsert = async (payload: any) => {
        const newMatch = payload.new as any;
        if (newMatch.player1_id !== user.id && newMatch.player2_id !== user.id) {
          return;
        }

        const { data: match } = await supabase
          .from('multiplayer_matches')
          .select('*')
          .eq('id', newMatch.id)
          .single();
        if (!match) {
          return;
        }

        setMatchState({
          id: match.id,
          player1: {
            id: match.player1_id,
            username: match.player1_username,
            score: match.player1_score || 0,
            currentChallenge: match.player1_current_challenge || 0,
            isReady: match.player1_is_ready || false,
          },
          player2: {
            id: match.player2_id,
            username: match.player2_username,
            score: match.player2_score || 0,
            currentChallenge: match.player2_current_challenge || 0,
            isReady: match.player2_is_ready || false,
          },
          status: match.status,
          gameDuration: match.game_duration,
          scoreLimit: match.score_limit,
        });

        const challenges = await generateRandomChallenges();
        setChallenges(challenges);
        setIsSearching(false);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        queueChannelRef.current?.unsubscribe();
      };

      queueChannelRef.current = supabase
        .channel(`queue:${user.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'multiplayer_queue' },
          async (payload) => {
            const newPlayer = payload.new as any;
            if (newPlayer.user_id === user.id || newPlayer.status !== 'waiting') return;
            // Apenas bloquear se estiver em partida ACTIVE (não waiting)
            const { data: activeMatch } = await supabase
              .from('multiplayer_matches')
              .select('id')
              .or(`player1_id.eq.${newPlayer.user_id},player2_id.eq.${newPlayer.user_id}`)
              .eq('status', 'active')
              .limit(1)
              .maybeSingle();
            if (activeMatch) return;
            await supabase.rpc('create_match_and_mark_queue', { opponent_id: newPlayer.user_id });
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'multiplayer_matches', filter: `player1_id=eq.${user.id}` },
          handleMatchInsert
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'multiplayer_matches', filter: `player2_id=eq.${user.id}` },
          handleMatchInsert
        )
        .subscribe();

      // Fallback polling
      pollIntervalRef.current = setInterval(async () => {
        try {
          const { data: match } = await supabase
            .from('multiplayer_matches')
            .select('*')
            .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
            .eq('status', 'waiting')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (match) {
            console.log('[Multiplayer] 🎯 Polling found match:', match.id);
            console.log('[Multiplayer] 🎯 Match details:', {
              player1: { id: match.player1_id, username: match.player1_username },
              player2: { id: match.player2_id, username: match.player2_username }
            });
            
            setMatchState({
              id: match.id,
              player1: {
                id: match.player1_id,
                username: match.player1_username,
                score: match.player1_score || 0,
                currentChallenge: match.player1_current_challenge || 0,
                isReady: match.player1_is_ready || false,
              },
              player2: {
                id: match.player2_id,
                username: match.player2_username,
                score: match.player2_score || 0,
                currentChallenge: match.player2_current_challenge || 0,
                isReady: match.player2_is_ready || false,
              },
              status: match.status,
              gameDuration: match.game_duration,
              scoreLimit: match.score_limit,
            });

            const challenges = await generateRandomChallenges();
            setChallenges(challenges);
            setIsSearching(false);
            if (queueChannelRef.current) queueChannelRef.current.unsubscribe();
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
          }
        } catch {}
      }, 2000);
      console.log('[Multiplayer] 🔄 Starting polling fallback (2s interval)');
    } catch (error) {
      console.error('Error joining queue:', error);
      setIsSearching(false);
    }
  }, [user, generateRandomChallenges]);

  // Sair da fila
  const leaveQueue = useCallback(async () => {
    if (!user) return;

    try {
      await supabase
        .from('multiplayer_queue')
        .delete()
        .eq('user_id', user.id);

      queueChannelRef.current?.unsubscribe();
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      setIsSearching(false);
    } catch (error) {
      console.error('Error leaving queue:', error);
    }
  }, [user]);

  // Trocar de oponente (cancela match atual e volta à fila)
  const changeOpponent = useCallback(async () => {
    if (!matchState || !user) return;
    try {
      // Finalizar a partida para o outro jogador reentrar (reason opponent_left)
      await supabase
        .from('multiplayer_matches')
        .update({
          status: 'finished',
          winner_id: user.id,
          winner_reason: 'opponent_left',
          finished_at: new Date().toISOString(),
        })
        .eq('id', matchState.id);

      // Limpar estado local e voltar para matchmaking
      setMatchState(null);
      matchChannelRef.current?.unsubscribe();
      setIsSearching(true);
      // Voltar à fila automaticamente
      await joinQueue();
    } catch (error) {
      console.error('Error changing opponent:', error);
    }
  }, [matchState, user, joinQueue]);

  // Cancelar match (sair do multiplayer mantendo oponente livre para requeue)
  const cancelMatch = useCallback(async () => {
    if (!matchState || !user) return;
    try {
      await supabase
        .from('multiplayer_matches')
        .update({
          status: 'finished',
          winner_id: user.id,
          winner_reason: 'opponent_left', // reutilizamos a lógica de requeue do outro lado
          finished_at: new Date().toISOString(),
        })
        .eq('id', matchState.id);

      // Remover própria entrada da fila se existir
      await supabase.from('multiplayer_queue').delete().eq('user_id', user.id);

      setMatchState(null);
      matchChannelRef.current?.unsubscribe();
      setIsSearching(false); // não voltar à fila
    } catch (e) {
      console.error('Error cancelling match:', e);
    }
  }, [matchState, user]);

  // Reentrar na fila quando o oponente cancelar (match deletada por outro)
  const requeueAfterOpponentLeft = useCallback(async () => {
    if (requeueLockRef.current) return;
    requeueLockRef.current = true;
    try {
      setMatchState(null);
      matchChannelRef.current?.unsubscribe();
      setIsSearching(true);
      await joinQueue();
    } finally {
      requeueLockRef.current = false;
    }
  }, [joinQueue]);

  // Marcar jogador como pronto
  const setReady = useCallback(async () => {
    if (!matchState || !user) return;

    try {
      console.log('[Multiplayer] 🟢 Marking ready for match:', matchState.id);
      // Chamar RPC atômica que marca pronto e inicia se ambos estiverem prontos
      const { data: updated, error: rerr } = await supabase.rpc('mark_ready_and_start', { p_match_id: matchState.id });
      if (rerr) {
        console.error('[Multiplayer] mark_ready RPC error', rerr);
      }

      console.log('[Multiplayer] 🔍 RPC Response:', {
        hasData: !!updated,
        status: updated?.status,
        started_at: updated?.started_at,
        player1_is_ready: updated?.player1_is_ready,
        player2_is_ready: updated?.player2_is_ready
      });

      // Ajustar estado local imediatamente (além do realtime)
      if (updated) {
        setMatchState(prev => {
          if (!prev) return prev;
          const newState = {
            ...prev,
            player1: {
              ...prev.player1,
              isReady: !!updated.player1_is_ready,
              score: updated.player1_score ?? prev.player1.score,
              currentChallenge: updated.player1_current_challenge ?? prev.player1.currentChallenge,
            },
            player2: {
              ...prev.player2,
              isReady: !!updated.player2_is_ready,
              score: updated.player2_score ?? prev.player2.score,
              currentChallenge: updated.player2_current_challenge ?? prev.player2.currentChallenge,
            },
            status: updated.status,
            startedAt: updated.started_at ?? prev.startedAt,
          };
          console.log('[Multiplayer] 🔄 State update:', {
            prevStatus: prev.status,
            newStatus: newState.status,
            prevStartedAt: prev.startedAt,
            newStartedAt: newState.startedAt,
            updatedStartedAt: updated.started_at
          });
          return newState;
        });
        console.log('[Multiplayer] ✅ Ready state updated:', updated);
      } else {
        // Sem retorno? Forçar refetch
        console.log('[Multiplayer] ℹ️ No updated match returned, forcing refetch');
        const { data: refetched } = await supabase
          .from('multiplayer_matches')
          .select('*')
          .eq('id', matchState.id)
          .single();
        if (refetched) {
          setMatchState(prev => prev ? ({
            ...prev,
            player1: { ...prev.player1, isReady: refetched.player1_is_ready, score: refetched.player1_score, currentChallenge: refetched.player1_current_challenge },
            player2: { ...prev.player2, isReady: refetched.player2_is_ready, score: refetched.player2_score, currentChallenge: refetched.player2_current_challenge },
            status: refetched.status,
            startedAt: refetched.started_at,
          }) : prev);
        }
      }
    } catch (error) {
      console.error('Error setting ready:', error);
    }
  }, [matchState, user]);

  // Enviar evento de digitação (sem logs verbosos)
  const sendTypingEvent = useCallback(async (inputLength: number) => {
    if (!matchState || !user) return;
    try {
      await supabase.from('multiplayer_events').insert({
        match_id: matchState.id,
        user_id: user.id,
        event_type: 'typing',
        payload: { inputLength }
      });
    } catch {}
  }, [matchState, user]);

  // Submeter resposta
  const submitAnswer = useCallback(async (userAnswer: string) => {
    if (!matchState || !user) return { correct: false, points: 0 };

    const isPlayer1 = matchState.player1.id === user.id;
    const currentPlayer = isPlayer1 ? matchState.player1 : matchState.player2;
    const currentChallenge = challenges[currentPlayer.currentChallenge];

    if (!currentChallenge) return { correct: false, points: 0 };

    // Normalizar resposta (remover espaços extras, case insensitive)
    const normalizedAnswer = userAnswer.trim().toLowerCase().replace(/\s+/g, ' ');
    const normalizedCorrect = currentChallenge.answer.toLowerCase().replace(/\s+/g, ' ');
    const isCorrect = normalizedAnswer === normalizedCorrect || normalizedAnswer.includes(normalizedCorrect);

    try {
      let newScore = currentPlayer.score;
      let newChallengeIndex = currentPlayer.currentChallenge;
      let opponentScore = isPlayer1 ? matchState.player2.score : matchState.player1.score;

      // Avançar sempre para próximo desafio (mesmo em erro) para manter ritmo
      if (isCorrect) {
        newScore += 1;
        newChallengeIndex += 1;

        await supabase
          .from('multiplayer_events')
          .insert({
            match_id: matchState.id,
            user_id: user.id,
            event_type: 'submit_correct',
            payload: { result: 'correct' },
          });
      } else {
        opponentScore += 1; // oponente ganha ponto
        newChallengeIndex += 1; // segue para próximo desafio mesmo errando

        await supabase
          .from('multiplayer_events')
          .insert({
            match_id: matchState.id,
            user_id: user.id,
            event_type: 'submit_wrong',
            payload: { result: 'wrong' },
          });
      }

      // Atualizar partida no banco
      await supabase
        .from('multiplayer_matches')
        .update({
          [isPlayer1 ? 'player1_score' : 'player2_score']: newScore,
          [isPlayer1 ? 'player1_current_challenge' : 'player2_current_challenge']: newChallengeIndex,
          [isPlayer1 ? 'player2_score' : 'player1_score']: opponentScore,
        })
        .eq('id', matchState.id);

      // Prefetch de mais desafios se necessário
      await fetchMoreChallengesIfNeeded(newChallengeIndex);

      // Verificar condição de vitória (diferença de pontos)
      const scoreDifference = Math.abs(newScore - opponentScore);
      if (scoreDifference >= matchState.scoreLimit) {
        const winnerId = newScore > opponentScore ? user.id : (isPlayer1 ? matchState.player2.id : matchState.player1.id);
        
        await supabase
          .from('multiplayer_matches')
          .update({
            status: 'finished',
            winner_id: winnerId,
            winner_reason: 'score_limit',
            finished_at: new Date().toISOString(),
          })
          .eq('id', matchState.id);

        // Adicionar ao histórico
        await supabase
          .from('multiplayer_history')
          .insert({
            match_id: matchState.id,
            player1_id: matchState.player1.id,
            player1_username: matchState.player1.username,
            player1_final_score: isPlayer1 ? newScore : opponentScore,
            player2_id: matchState.player2.id,
            player2_username: matchState.player2.username,
            player2_final_score: isPlayer1 ? opponentScore : newScore,
            winner_id: winnerId,
            duration_seconds: matchState.gameDuration - timeRemaining,
          });

        // Invalida caches para refletir mudanças no placar e no rating do usuário
        if (user?.id) {
          queryClient.invalidateQueries({ queryKey: ['userMultiplayerRating', user.id] });
        }
        queryClient.invalidateQueries({ queryKey: ['multiplayerLeaderboard'] });
      }

      return { correct: isCorrect, points: isCorrect ? 1 : 0 };
    } catch (error) {
      console.error('Error submitting answer:', error);
      return { correct: false, points: 0 };
    }
  }, [matchState, user, challenges, timeRemaining]);

  // Fallback polling para eventos caso realtime falhe (checa último evento adversário)
  useEffect(() => {
    if (!matchState || matchState.status !== 'active' || !user) return;
    let stop = false;
    const interval = setInterval(async () => {
      if (stop) return;
      try {
        // Buscar o evento mais recente do oponente
        const { data: events } = await supabase
          .from('multiplayer_events')
          .select('id,event_type,payload,created_at,user_id')
          .eq('match_id', matchState.id)
          .neq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);
        if (events && events.length) {
          const ev = events[0] as any;
          // Atualizar apenas se for novo em relação ao que temos (timestamp simples)
          if (ev.event_type === 'typing' && ev.payload?.inputLength !== undefined) {
            setOpponentActivity(prev => ({ ...prev, inputLength: ev.payload.inputLength }));
          } else if (ev.event_type === 'submit_correct' || ev.event_type === 'submit_wrong') {
            const result = ev.event_type === 'submit_correct' ? 'correct' : 'wrong';
            setOpponentActivity({ inputLength: 0, lastSubmission: { result, timestamp: Date.now() } });
          }
        }
      } catch {}
    }, 800); // intervalo curto para sensação de tempo real
    return () => { stop = true; clearInterval(interval); };
  }, [matchState?.id, matchState?.status, user]);

  // Inscrever-se em atualizações da partida em tempo real
  useEffect(() => {
    if (!matchState) return;

    matchChannelRef.current = supabase
      .channel(`match:${matchState.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'multiplayer_matches',
          filter: `id=eq.${matchState.id}`,
        },
        (payload) => {
          const updated = payload.new as any;
          // Caso especial: opponent_left - queremos requeue imediato SEM mostrar tela de derrota
          if (updated.status === 'finished' && updated.winner_reason === 'opponent_left' && updated.winner_id !== user?.id) {
            console.log('[Multiplayer] 🚪 Oponente deixou a partida. Ignorando estado de derrota e reentrando na fila. Match:', updated.id);
            if (!requeueLockRef.current) {
              requeueAfterOpponentLeft();
            }
            return; // evitar atualizar state para 'finished' e disparar UI de derrota
          }

          // Atualização normal da partida
          setMatchState(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              player1: {
                ...prev.player1,
                score: updated.player1_score,
                currentChallenge: updated.player1_current_challenge,
                isReady: updated.player1_is_ready,
              },
              player2: {
                ...prev.player2,
                score: updated.player2_score,
                currentChallenge: updated.player2_current_challenge,
                isReady: updated.player2_is_ready,
              },
              status: updated.status,
              winnerId: updated.winner_id,
              winnerReason: updated.winner_reason,
              startedAt: updated.started_at,
              finishedAt: updated.finished_at,
            };
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'multiplayer_matches',
          filter: `id=eq.${matchState.id}`,
        },
        async () => {
          // Se a partida foi deletada (oponente clicou cancelar/trocar), voltar imediatamente para a fila
          console.log('[Multiplayer] 🧨 Match deletada por oponente. Reentrando na fila...');
          await requeueAfterOpponentLeft();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'multiplayer_events',
          filter: `match_id=eq.${matchState.id}`,
        },
        (payload) => {
          const event = payload.new as any;
          
          // Atualizar atividade do oponente
          if (event.user_id !== user?.id) {
            if (event.event_type === 'typing' && event.payload?.inputLength !== undefined) {
              setOpponentActivity(prev => ({
                ...prev,
                inputLength: event.payload.inputLength,
              }));
            } else if (event.event_type === 'submit_correct' || event.event_type === 'submit_wrong') {
              const result = event.event_type === 'submit_correct' ? 'correct' : 'wrong';
              setOpponentActivity(prev => ({
                inputLength: 0,
                lastSubmission: {
                  result,
                  timestamp: Date.now(),
                },
              }));
            }
          }
        }
      )
      .subscribe();

    // Refetch inicial para garantir sync após assinar o canal
    (async () => {
      try {
        const { data: m } = await supabase
          .from('multiplayer_matches')
          .select('*')
          .eq('id', matchState.id)
          .single();
        if (m) {
          // Se já chega como finished por opponent_left e este usuário NÃO é o winner_id, não queremos mostrar derrota; requeue imediato
          if (m.status === 'finished' && m.winner_reason === 'opponent_left' && m.winner_id !== user?.id) {
            console.log('[Multiplayer] 🔄 Refetch inicial detectou opponent_left. Reentrando na fila sem mostrar derrota.');
            await requeueAfterOpponentLeft();
          } else {
            setMatchState(prev => prev ? ({
              ...prev,
              player1: { ...prev.player1, score: m.player1_score, currentChallenge: m.player1_current_challenge, isReady: m.player1_is_ready },
              player2: { ...prev.player2, score: m.player2_score, currentChallenge: m.player2_current_challenge, isReady: m.player2_is_ready },
              status: m.status,
              winnerId: m.winner_id,
              winnerReason: m.winner_reason,
              startedAt: m.started_at,
              finishedAt: m.finished_at,
            }) : prev);
          }
        }
      } catch (e) {
        console.warn('[Multiplayer] initial refetch after subscribe failed', e);
      }
    })();

    return () => {
      matchChannelRef.current?.unsubscribe();
    };
  }, [matchState, user]);

  // Enquanto a partida estiver em "waiting", fazer refetch a cada 1s para não depender só do realtime
  useEffect(() => {
    if (!matchState || matchState.status !== 'waiting') {
      if (waitingRefetchRef.current) {
        clearInterval(waitingRefetchRef.current);
        waitingRefetchRef.current = null;
      }
      return;
    }

    let checkCount = 0;
    waitingRefetchRef.current = setInterval(async () => {
      try {
        checkCount++;
        const { data: m } = await supabase
          .from('multiplayer_matches')
          .select('*')
          .eq('id', matchState.id)
          .single();
        // Se a match sumiu, significa que o oponente cancelou/trocou. Reentrar na fila imediatamente.
        if (!m) {
          console.log('[Multiplayer] ❌ Match não encontrada (cancelamento). Reentrando na fila...');
          if (waitingRefetchRef.current) {
            clearInterval(waitingRefetchRef.current);
            waitingRefetchRef.current = null;
          }
          await requeueAfterOpponentLeft();
          return;
        }
        // Detectar finalização por saída do oponente via polling (caso realtime falhe)
        if (m.status === 'finished' && m.winner_reason === 'opponent_left') {
          console.log('[Multiplayer] 🛑 Match marcada opponent_left (poll). Reentrando na fila...');
          if (waitingRefetchRef.current) {
            clearInterval(waitingRefetchRef.current);
            waitingRefetchRef.current = null;
          }
            await requeueAfterOpponentLeft();
            return;
        }
        // Evitar aplicar estado "finished" local se motivo for opponent_left do outro lado (race condition extra)
        if (m.status === 'finished' && m.winner_reason === 'opponent_left' && m.winner_id !== user?.id) {
          console.log('[Multiplayer] ⚠️ Race detectada: finished opponent_left antes de tratamento. Ignorando update e requeue.');
          if (waitingRefetchRef.current) {
            clearInterval(waitingRefetchRef.current);
            waitingRefetchRef.current = null;
          }
          await requeueAfterOpponentLeft();
          return;
        }

        // Após 5s (5 checks de 1s), verificar se oponente ainda está válido
        // Verificar se o oponente está ocupado em outra partida (waiting/active) - feito já desde o primeiro check
        if (m) {
          const isPlayer1 = matchState.player1.id === user?.id;
          const opponentId = isPlayer1 ? m.player2_id : m.player1_id;
          
          const { data: otherMatchCheck } = await supabase
            .from('multiplayer_matches')
            .select('id')
            .or(`player1_id.eq.${opponentId},player2_id.eq.${opponentId}`)
            .eq('status', 'active')
            .neq('id', matchState.id)
            .maybeSingle();

          // Se existe outra partida ATIVA envolvendo o oponente, trocar imediatamente
          if (otherMatchCheck) {
            console.log('[Multiplayer] 🔁 Oponente ocupado em outra match, trocando automaticamente');
            await changeOpponent();
            return;
          }
        }
        
        if (
          m.player1_is_ready !== matchState.player1.isReady ||
          m.player2_is_ready !== matchState.player2.isReady ||
          m.status !== matchState.status
        ) {
          setMatchState(prev => prev ? ({
            ...prev,
            player1: { ...prev.player1, isReady: m.player1_is_ready, score: m.player1_score, currentChallenge: m.player1_current_challenge },
            player2: { ...prev.player2, isReady: m.player2_is_ready, score: m.player2_score, currentChallenge: m.player2_current_challenge },
            status: m.status,
            startedAt: m.started_at ?? prev.startedAt,
          }) : prev);
          if (m.status === 'active' && waitingRefetchRef.current) {
            clearInterval(waitingRefetchRef.current);
            waitingRefetchRef.current = null;
          }
        }
      } catch {}
    }, 1000);

    return () => {
      if (waitingRefetchRef.current) {
        clearInterval(waitingRefetchRef.current);
        waitingRefetchRef.current = null;
      }
    };
  }, [matchState, user, changeOpponent]);

  // Timer do jogo
  useEffect(() => {
    const status = matchState?.status;
    const startedAt = matchState?.startedAt;
    const gameDuration = matchState?.gameDuration;

    console.log('[Multiplayer] 🔍 Verificando condições do timer:', {
      status,
      startedAt,
      shouldStart: status === 'active' && !!startedAt
    });

    if (status === 'active' && startedAt && gameDuration) {
      console.log('[Multiplayer] ⏱️ Timer iniciado:', {
        startedAt,
        duration: gameDuration
      });
      
      const startTime = new Date(startedAt).getTime();
      
      console.log('[Multiplayer] 🕐 Configurando intervalo do timer. startTime:', new Date(startTime).toISOString());
      
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        const remaining = Math.max(0, gameDuration - elapsed);
        
        
        setTimeRemaining(remaining);

        // Terminar jogo quando o tempo acabar
        if (remaining === 0 && timerRef.current) {
          console.log('[Multiplayer] ⏰ Tempo esgotado! Calculando vencedor...');
          
          // Acessar o estado mais recente para o cálculo do vencedor
          setMatchState(currentMatchState => {
            if (!currentMatchState) return null;

            const player1Score = currentMatchState.player1.score;
            const player2Score = currentMatchState.player2.score;
            
            let winnerId: string;
            if (player1Score > player2Score) {
              winnerId = currentMatchState.player1.id;
            } else if (player2Score > player1Score) {
              winnerId = currentMatchState.player2.id;
            } else {
              winnerId = currentMatchState.player1.id; // Empate vai para P1
            }

            console.log('[Multiplayer] 🏆 Vencedor por timeout:', {
              winnerId,
              player1: { id: currentMatchState.player1.id, score: player1Score },
              player2: { id: currentMatchState.player2.id, score: player2Score }
            });

            supabase
              .from('multiplayer_matches')
              .update({
                status: 'finished',
                winner_id: winnerId,
                winner_reason: 'timeout',
                finished_at: new Date().toISOString(),
              })
              .eq('id', currentMatchState.id)
              .then(async () => {
                console.log('[Multiplayer] ✅ Match finalizada por timeout');
                
                // Adicionar ao histórico para acionar trigger de rating
                await supabase
                  .from('multiplayer_history')
                  .insert({
                    match_id: currentMatchState.id,
                    player1_id: currentMatchState.player1.id,
                    player1_username: currentMatchState.player1.username,
                    player1_final_score: player1Score,
                    player2_id: currentMatchState.player2.id,
                    player2_username: currentMatchState.player2.username,
                    player2_final_score: player2Score,
                    winner_id: winnerId,
                    duration_seconds: gameDuration,
                  });

                // Invalida caches para refletir mudanças no placar e no rating do usuário
                if (user?.id) {
                  queryClient.invalidateQueries({ queryKey: ['userMultiplayerRating', user.id] });
                }
                queryClient.invalidateQueries({ queryKey: ['multiplayerLeaderboard'] });
              });
            
            return currentMatchState; // não mudar o estado aqui, deixar o realtime fazer
          });

          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }, 1000);

      return () => {
        if (timerRef.current) {
          console.log('[Multiplayer] 🧹 Limpando timer.');
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    } else {
      console.log('[Multiplayer] ⏱️ Timer não iniciado ou parado.');
       if (timerRef.current) {
          console.log('[Multiplayer] 🧹 Limpando timer porque as condições não são mais atendidas.');
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
    }
  }, [matchState?.status, matchState?.startedAt, matchState?.gameDuration]);

  // Limpar lastSubmission após 3 segundos
  useEffect(() => {
    if (opponentActivity.lastSubmission) {
      const timeout = setTimeout(() => {
        setOpponentActivity(prev => ({ ...prev, lastSubmission: null }));
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [opponentActivity.lastSubmission]);

  // Listener global para detectar novas matches criadas (por convites ou aleatório)
  useEffect(() => {
    if (!user || matchState) return; // Só escutar se não tiver match ativa

    console.log('[Multiplayer] 🔊 Setting up global match listener for user:', user.id);
    
    globalMatchChannelRef.current = supabase
      .channel(`global-match:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'multiplayer_matches',
          filter: `player1_id=eq.${user.id}`,
        },
        async (payload) => {
          const newMatch = payload.new as any;
          console.log('[Multiplayer] 🎮 New match detected (player1):', newMatch.id);
          
          setMatchState({
            id: newMatch.id,
            player1: {
              id: newMatch.player1_id,
              username: newMatch.player1_username,
              score: newMatch.player1_score || 0,
              currentChallenge: newMatch.player1_current_challenge || 0,
              isReady: newMatch.player1_is_ready || false,
            },
            player2: {
              id: newMatch.player2_id,
              username: newMatch.player2_username,
              score: newMatch.player2_score || 0,
              currentChallenge: newMatch.player2_current_challenge || 0,
              isReady: newMatch.player2_is_ready || false,
            },
            status: newMatch.status,
            gameDuration: newMatch.game_duration,
            scoreLimit: newMatch.score_limit,
          });
          
          const challenges = await generateRandomChallenges();
          setChallenges(challenges);
          setIsSearching(false);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'multiplayer_matches',
          filter: `player2_id=eq.${user.id}`,
        },
        async (payload) => {
          const newMatch = payload.new as any;
          console.log('[Multiplayer] 🎮 New match detected (player2):', newMatch.id);
          
          setMatchState({
            id: newMatch.id,
            player1: {
              id: newMatch.player1_id,
              username: newMatch.player1_username,
              score: newMatch.player1_score || 0,
              currentChallenge: newMatch.player1_current_challenge || 0,
              isReady: newMatch.player1_is_ready || false,
            },
            player2: {
              id: newMatch.player2_id,
              username: newMatch.player2_username,
              score: newMatch.player2_score || 0,
              currentChallenge: newMatch.player2_current_challenge || 0,
              isReady: newMatch.player2_is_ready || false,
            },
            status: newMatch.status,
            gameDuration: newMatch.game_duration,
            scoreLimit: newMatch.score_limit,
          });
          
          const challenges = await generateRandomChallenges();
          setChallenges(challenges);
          setIsSearching(false);
        }
      )
      .subscribe();

    return () => {
      globalMatchChannelRef.current?.unsubscribe();
    };
  }, [user, matchState, generateRandomChallenges]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      queueChannelRef.current?.unsubscribe();
      matchChannelRef.current?.unsubscribe();
      globalMatchChannelRef.current?.unsubscribe();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (waitingRefetchRef.current) {
        clearInterval(waitingRefetchRef.current);
        waitingRefetchRef.current = null;
      }
    };
  }, []);

  return {
    isSearching,
    matchState,
    challenges,
    opponentActivity,
    timeRemaining,
    joinQueue,
    leaveQueue,
    setReady,
    changeOpponent,
    cancelMatch,
    sendTypingEvent,
    submitAnswer,
  };
}
