/**
 * Hook React para usar o Sistema de Desafios Dinâmicos
 * 
 * Este hook substitui o sistema antigo baseado em gameData.ts
 * e usa a API do banco de dados para buscar desafios reais.
 */

import { useState, useCallback, useEffect, useRef } from 'react';

// ========== TIPOS ==========

interface World {
  world_id: number;
  world_level: number;
  world_name: string;
  description: string;
  totalChallenges?: number;
}

interface ChallengeData {
  challengeId: number;
  worldId: number;
  worldName: string;
  questionTemplate: string;
  question: string;
  isMultiStep: boolean;
  points: number;
  difficulty: number;
  timerSeconds: number;
  currentStateId: number;
  currentStatus: string;
  variables: Record<string, string>;
}

interface ValidationResult {
  success: boolean;
  commandOutput: string;
  nextStateId: number;
  nextStatus: string;
  isFinalStep: boolean;
  message?: string;
}

// ========== HOOK ==========

export function useDynamicChallenges() {
  const [worlds, setWorlds] = useState<World[]>([]);
  const [currentChallenge, setCurrentChallenge] = useState<ChallengeData | null>(null);
  const [currentState, setCurrentState] = useState<{
    stateId: number;
    status: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [challengeQueue, setChallengeQueue] = useState<ChallengeData[]>([]);
  const activeWorldRef = useRef<number | null>(null);
  const refillInProgressRef = useRef(false);

  const INITIAL_BATCH_SIZE = 15;
  const REFILL_BATCH_SIZE = 14;

  // ========== FUNÇÕES DE API ==========

  /**
   * Busca todos os mundos disponíveis
   */
  const fetchWorlds = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/worlds');
      if (!response.ok) throw new Error('Erro ao buscar mundos');

      const data = await response.json();
      setWorlds(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Busca informações detalhadas de um mundo
   */
  const fetchWorldInfo = useCallback(async (worldId: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/worlds/${worldId}`);
      if (!response.ok) throw new Error('Erro ao buscar informações do mundo');

      return await response.json();
    } catch (err) {
      refillInProgressRef.current = false;
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Busca um desafio aleatório de um mundo
   */
  const fetchChallengeBatch = useCallback(async (worldId: number, count: number) => {
    console.log('[Hook] Prefetching challenges:', { worldId, count });
    const response = await fetch(`/api/challenges/batch/${worldId}?count=${count}`);
    if (!response.ok) {
      throw new Error('Erro ao buscar lote de desafios');
    }
    const challenges: ChallengeData[] = await response.json();
    console.log('[Hook] Batch received:', challenges.length);
    return challenges;
  }, []);

  const fetchRandomChallenge = useCallback(async (worldId: number) => {
    try {
      setLoading(true);
      setError(null);

      let queue = challengeQueue;

      if (activeWorldRef.current !== worldId) {
        console.log('[Hook] Switching to new world. Resetting queue.');
        activeWorldRef.current = worldId;
        setChallengeQueue([]);
        queue = [];
        refillInProgressRef.current = false;
      }

      // Se não houver desafio atual e a fila estiver vazia, carregar lote inicial
      if (!currentChallenge && queue.length === 0) {
  refillInProgressRef.current = true;
  const batch = await fetchChallengeBatch(worldId, INITIAL_BATCH_SIZE);
  refillInProgressRef.current = false;
        if (batch.length === 0) throw new Error('Nenhum desafio disponível');

        const [first, ...rest] = batch;
        console.log('[Hook] Inicializando desafios. Primeira pergunta:', first);

        setCurrentChallenge(first);
        setCurrentState({
          stateId: first.currentStateId,
          status: first.currentStatus,
        });
        setChallengeQueue(rest);
        return first;
      }

      // Se a fila estiver vazia, buscar novo lote completo
      if (queue.length === 0) {
        console.log('[Hook] Queue empty. Fetching new batch.');
        if (!refillInProgressRef.current) {
          refillInProgressRef.current = true;
        }
        const batch = await fetchChallengeBatch(worldId, INITIAL_BATCH_SIZE);
        refillInProgressRef.current = false;
        if (batch.length === 0) throw new Error('Nenhum desafio disponível');

        const [first, ...rest] = batch;
        setCurrentChallenge(first);
        setCurrentState({
          stateId: first.currentStateId,
          status: first.currentStatus,
        });
        setChallengeQueue(rest);
        return first;
      }

      const [next, ...remaining] = queue;
      console.log('[Hook] Consuming challenge from queue. Remaining after pop:', remaining.length);

      setCurrentChallenge(next);
      setCurrentState({
        stateId: next.currentStateId,
        status: next.currentStatus,
      });
      setChallengeQueue(remaining);

      if (remaining.length <= 1) {
        console.log('[Hook] Queue low (<=1). Scheduling refill of', REFILL_BATCH_SIZE);
        if (!refillInProgressRef.current) {
          refillInProgressRef.current = true;
          fetchChallengeBatch(worldId, REFILL_BATCH_SIZE)
          .then(newBatch => {
            if (newBatch.length > 0) {
              console.log('[Hook] Appending refill batch of', newBatch.length);
              setChallengeQueue(prev => [...prev, ...newBatch]);
            }
          })
          .catch(err => {
            console.error('[Hook] Failed to refill challenge queue:', err);
          })
          .finally(() => {
            refillInProgressRef.current = false;
          })
        }
      }

      return next;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return null;
    } finally {
      setLoading(false);
    }
  }, [challengeQueue, currentChallenge, fetchChallengeBatch]);

  /**
   * Valida um comando do jogador
   */
  const validateCommand = useCallback(async (command: string): Promise<ValidationResult | null> => {
    if (!currentChallenge || !currentState) {
      setError('Nenhum desafio ativo');
      console.error('[Hook] No challenge or state!', { currentChallenge, currentState });
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const requestBody = {
        challengeId: currentChallenge.challengeId,
        currentStateId: currentState.stateId,
        command,
        variables: currentChallenge.variables,
      };

      console.log('[Hook] 🎯 Sending validation request:', requestBody);
      console.log('[Hook] Current challenge:', currentChallenge.challengeId, currentChallenge.question);
      console.log('[Hook] Current state ID:', currentState.stateId);

      const response = await fetch('/api/challenges/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error('Erro ao validar comando');

      const result: ValidationResult = await response.json();
      
      console.log('[Hook] Validation result:', result);

      // Atualiza o estado se o comando foi válido
      if (result.success) {
        console.log('[Hook] ✅ Command accepted! Updating state to:', {
          stateId: result.nextStateId,
          status: result.nextStatus
        });
        
        setCurrentState({
          stateId: result.nextStateId,
          status: result.nextStatus,
        });
        
        console.log('[Hook] Is final step?', result.isFinalStep);
      } else {
        console.log('[Hook] ❌ Command rejected');
      }

      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentChallenge, currentState]);

  /**
   * Busca as respostas corretas de um desafio
   * Útil para mostrar ao jogador após falhar
   */
  const getCorrectAnswers = useCallback(async (
    challengeId: number, 
    variables?: Record<string, string>
  ): Promise<{ answers: string[], isMultiStep: boolean }> => {
    try {
      console.log('[Hook] Fetching correct answers for challenge:', challengeId);
      console.log('[Hook] Variables to substitute:', variables);
      
      const response = await fetch(`/api/challenges/${challengeId}/answers`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch answers: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Hook] Got answers from API:', data);
      console.log('[Hook] Variables provided:', variables);
      console.log('[Hook] Has template?', data.hasTemplate);
      
      // Se temos templates, substituir variáveis com valores fornecidos
      if (data.hasTemplate && data.answers) {
        const substitutedAnswers = data.answers.map((template: string) => {
          let answer = template;
          
          console.log('[Hook] Processing template:', template);
          
          // Substituir variáveis com valores fornecidos
          if (variables) {
            console.log('[Hook] Variables to substitute:', variables);
            Object.entries(variables).forEach(([key, value]) => {
              console.log('[Hook] Processing variable:', key, '=', value);
              // Suporta tanto {{variable}} quanto variable
              const cleanKey = key.replace(/^\{\{|\}\}$/g, '');
              console.log('[Hook] Clean key:', cleanKey);
              // Criar padrão com chaves duplas
              const placeholder = `{{${cleanKey}}}`;
              console.log('[Hook] Looking for placeholder:', placeholder);
              const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
              const beforeReplace = answer;
              answer = answer.replace(regex, String(value));
              console.log('[Hook] Replace:', beforeReplace, '->', answer);
            });
          } else {
            console.log('[Hook] No variables provided for substitution!');
          }
          
          console.log('[Hook] Final answer:', answer);
          return answer;
        });
        
        return { 
          answers: substitutedAnswers, 
          isMultiStep: data.isMultiStep || false 
        };
      }
      
      return { 
        answers: data.answers || [], 
        isMultiStep: data.isMultiStep || false 
      };
    } catch (error) {
      console.error('[Hook] Error fetching correct answers:', error);
      return { answers: ['Comando Git apropriado'], isMultiStep: false };
    }
  }, []);

  // Carrega os mundos ao montar o componente
  useEffect(() => {
    fetchWorlds();
  }, [fetchWorlds]);

  return {
    // Estado
    worlds,
    currentChallenge,
    currentState,
    upcomingChallenges: challengeQueue,
    loading,
    error,

    // Funções
    fetchWorlds,
    fetchWorldInfo,
    fetchRandomChallenge,
    validateCommand,
    getCorrectAnswers,

    // Helpers
    hasChallenge: !!currentChallenge,
    isMultiStep: currentChallenge?.isMultiStep || false,
  };
}

// ========== HELPER PARA MIGRAÇÃO GRADUAL ==========

/**
 * Função adaptadora para manter compatibilidade com código antigo
 * enquanto migra gradualmente para o novo sistema
 * 
 * Migração do sistema antigo (gameData.ts) para o novo:
 * 
 * ANTES (gameData.ts):
 * ```typescript
 * const challenge = gameData[world][index];
 * const isCorrect = challenge.correctAnswer === userCommand;
 * ```
 * 
 * DEPOIS (novo sistema):
 * ```typescript
 * const challenge = await fetchRandomChallenge(worldId);
 * const result = await validateCommand(userCommand);
 * const isCorrect = result.success;
 * ```
 */
export function createLegacyAdapter() {
  const hook = useDynamicChallenges();

  return {
    // Interface antiga
    async getChallengeBlock(worldId: number, index: number) {
      const challenge = await hook.fetchRandomChallenge(worldId);
      if (!challenge) return null;

      // Converte para o formato antigo
      return {
        id: challenge.challengeId.toString(),
        scenario: challenge.question,
        correctAnswer: '', // Não usado no novo sistema
        points: challenge.points,
        difficulty: challenge.difficulty,
      };
    },

    async validateAnswer(answer: string) {
      const result = await hook.validateCommand(answer);
      return {
        correct: result?.success || false,
        message: result?.message || '',
      };
    },

    // Expõe o hook completo para migração gradual
    hook,
  };
}

// Exporta os tipos para uso externo
export type { World, ChallengeData, ValidationResult };

