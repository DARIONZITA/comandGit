import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useAuth } from '@/contexts/AuthContext';

export interface MultiplayerChallenge {
  id: number;
  question: string;
  answer: string;
  category: string;
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
  typing: boolean;
  lastEventTime: number;
}

export function useMultiplayer() {
  const { user } = useAuth();
  const [isSearching, setIsSearching] = useState(false);
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [challenges, setChallenges] = useState<MultiplayerChallenge[]>([]);
  const [opponentActivity, setOpponentActivity] = useState<OpponentActivity>({
    typing: false,
    lastEventTime: 0,
  });
  const [timeRemaining, setTimeRemaining] = useState<number>(120);
  
  const matchChannelRef = useRef<RealtimeChannel | null>(null);
  const queueChannelRef = useRef<RealtimeChannel | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Gerar desafios aleatórios
  const generateRandomChallenges = useCallback(() => {
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
    ];

    // Embaralhar e retornar desafios aleatórios
    return allChallenges.sort(() => Math.random() - 0.5);
  }, []);

  // Entrar na fila de matchmaking
  const joinQueue = useCallback(async () => {
    if (!user) return;

    try {
      setIsSearching(true);

      // Limpar entradas antigas primeiro
      await supabase.rpc('cleanup_old_queue_entries');

      // Verificar se já existe alguém esperando
      const { data: waitingPlayers, error: fetchError } = await supabase
        .from('multiplayer_queue')
        .select('*')
        .eq('status', 'waiting')
        .neq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1);

      if (fetchError) throw fetchError;

      if (waitingPlayers && waitingPlayers.length > 0) {
        // Encontrou um oponente! Criar partida
        const opponent = waitingPlayers[0];
        
        // Marcar ambos como matched
        await supabase
          .from('multiplayer_queue')
          .update({ status: 'matched' })
          .in('user_id', [user.id, opponent.user_id]);

        // Criar partida
        const { data: newMatch, error: matchError } = await supabase
          .from('multiplayer_matches')
          .insert({
            player1_id: opponent.user_id,
            player1_username: opponent.username,
            player2_id: user.id,
            player2_username: user.user_metadata?.username || 'Player',
            status: 'waiting',
          })
          .select()
          .single();

        if (matchError) throw matchError;

        // Configurar o estado da partida
        setMatchState({
          id: newMatch.id,
          player1: {
            id: newMatch.player1_id,
            username: newMatch.player1_username,
            score: 0,
            currentChallenge: 0,
            isReady: false,
          },
          player2: {
            id: newMatch.player2_id,
            username: newMatch.player2_username,
            score: 0,
            currentChallenge: 0,
            isReady: false,
          },
          status: 'waiting',
          gameDuration: newMatch.game_duration,
          scoreLimit: newMatch.score_limit,
        });

        // Gerar desafios
        setChallenges(generateRandomChallenges());
        
        setIsSearching(false);
      } else {
        // Não encontrou ninguém, entrar na fila
        const { error: insertError } = await supabase
          .from('multiplayer_queue')
          .insert({
            user_id: user.id,
            username: user.user_metadata?.username || 'Player',
            status: 'waiting',
          });

        if (insertError) throw insertError;

        // Inscrever-se no canal da fila para ser notificado quando houver match
        queueChannelRef.current = supabase
          .channel('multiplayer_queue')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'multiplayer_queue',
            },
            async (payload) => {
              // Novo jogador entrou na fila, verificar match
              const newPlayer = payload.new as any;
              if (newPlayer.user_id !== user.id && newPlayer.status === 'waiting') {
                // Criar partida com este jogador
                await supabase
                  .from('multiplayer_queue')
                  .update({ status: 'matched' })
                  .in('user_id', [user.id, newPlayer.user_id]);

                const { data: newMatch, error: matchError } = await supabase
                  .from('multiplayer_matches')
                  .insert({
                    player1_id: user.id,
                    player1_username: user.user_metadata?.username || 'Player',
                    player2_id: newPlayer.user_id,
                    player2_username: newPlayer.username,
                    status: 'waiting',
                  })
                  .select()
                  .single();

                if (!matchError && newMatch) {
                  setMatchState({
                    id: newMatch.id,
                    player1: {
                      id: newMatch.player1_id,
                      username: newMatch.player1_username,
                      score: 0,
                      currentChallenge: 0,
                      isReady: false,
                    },
                    player2: {
                      id: newMatch.player2_id,
                      username: newMatch.player2_username,
                      score: 0,
                      currentChallenge: 0,
                      isReady: false,
                    },
                    status: 'waiting',
                    gameDuration: newMatch.game_duration,
                    scoreLimit: newMatch.score_limit,
                  });

                  setChallenges(generateRandomChallenges());
                  setIsSearching(false);
                  queueChannelRef.current?.unsubscribe();
                }
              }
            }
          )
          .subscribe();
      }
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
      setIsSearching(false);
    } catch (error) {
      console.error('Error leaving queue:', error);
    }
  }, [user]);

  // Marcar jogador como pronto
  const setReady = useCallback(async () => {
    if (!matchState || !user) return;

    try {
      const isPlayer1 = matchState.player1.id === user.id;
      
      await supabase
        .from('multiplayer_matches')
        .update({
          [isPlayer1 ? 'player1_is_ready' : 'player2_is_ready']: true,
        })
        .eq('id', matchState.id);

      // Atualizar estado local
      setMatchState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          [isPlayer1 ? 'player1' : 'player2']: {
            ...prev[isPlayer1 ? 'player1' : 'player2'],
            isReady: true,
          },
        };
      });
    } catch (error) {
      console.error('Error setting ready:', error);
    }
  }, [matchState, user]);

  // Enviar evento de digitação
  const sendTypingEvent = useCallback(async () => {
    if (!matchState || !user) return;

    try {
      await supabase
        .from('multiplayer_events')
        .insert({
          match_id: matchState.id,
          user_id: user.id,
          event_type: 'typing',
        });
    } catch (error) {
      console.error('Error sending typing event:', error);
    }
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

      if (isCorrect) {
        // Resposta correta: +1 ponto, próximo desafio
        newScore += 1;
        newChallengeIndex += 1;

        await supabase
          .from('multiplayer_events')
          .insert({
            match_id: matchState.id,
            user_id: user.id,
            event_type: 'submit_correct',
          });
      } else {
        // Resposta errada: oponente ganha +1 ponto
        opponentScore += 1;

        await supabase
          .from('multiplayer_events')
          .insert({
            match_id: matchState.id,
            user_id: user.id,
            event_type: 'submit_wrong',
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
      }

      return { correct: isCorrect, points: isCorrect ? 1 : 0 };
    } catch (error) {
      console.error('Error submitting answer:', error);
      return { correct: false, points: 0 };
    }
  }, [matchState, user, challenges, timeRemaining]);

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

          // Iniciar timer quando ambos estiverem prontos
          if (updated.status === 'active' && !updated.started_at) {
            supabase
              .from('multiplayer_matches')
              .update({ started_at: new Date().toISOString() })
              .eq('id', matchState.id);
          }
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
            if (event.event_type === 'typing') {
              setOpponentActivity({
                typing: true,
                lastEventTime: Date.now(),
              });
            } else if (event.event_type === 'submit_correct' || event.event_type === 'submit_wrong') {
              setOpponentActivity({
                typing: false,
                lastEventTime: Date.now(),
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      matchChannelRef.current?.unsubscribe();
    };
  }, [matchState, user]);

  // Timer do jogo
  useEffect(() => {
    if (matchState?.status === 'active' && matchState.startedAt) {
      const startTime = new Date(matchState.startedAt).getTime();
      
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = Math.max(0, matchState.gameDuration - elapsed);
        
        setTimeRemaining(remaining);

        // Terminar jogo quando o tempo acabar
        if (remaining === 0) {
          const isPlayer1 = matchState.player1.id === user?.id;
          const myScore = isPlayer1 ? matchState.player1.score : matchState.player2.score;
          const opponentScore = isPlayer1 ? matchState.player2.score : matchState.player1.score;
          const winnerId = myScore > opponentScore 
            ? user?.id 
            : (isPlayer1 ? matchState.player2.id : matchState.player1.id);

          supabase
            .from('multiplayer_matches')
            .update({
              status: 'finished',
              winner_id: winnerId,
              winner_reason: 'timeout',
              finished_at: new Date().toISOString(),
            })
            .eq('id', matchState.id);

          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
        }
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [matchState, user]);

  // Limpar typing indicator após 500ms
  useEffect(() => {
    if (opponentActivity.typing) {
      const timeout = setTimeout(() => {
        setOpponentActivity(prev => ({ ...prev, typing: false }));
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [opponentActivity.lastEventTime]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      queueChannelRef.current?.unsubscribe();
      matchChannelRef.current?.unsubscribe();
      if (timerRef.current) {
        clearInterval(timerRef.current);
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
    sendTypingEvent,
    submitAnswer,
  };
}
