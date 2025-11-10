import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Supabase environment variables missing");
}

const supabase = createClient(supabaseUrl as string, supabaseServiceKey as string);

/**
 * Sistema de Engine de Jogo - Gerencia a lógica de desafios dinâmicos
 */

export interface ChallengeData {
  challengeId: number;
  worldId: number;
  worldName: string;
  questionTemplate: string;
  question: string; // Pergunta com variáveis substituídas
  isMultiStep: boolean;
  points: number;
  difficulty: number;
  timerSeconds: number;
  currentStateId: number;
  currentStatus: string; // Status do git com variáveis substituídas
  variables: Record<string, string>; // Variáveis usadas neste desafio
}

export interface TransitionResult {
  success: boolean;
  commandOutput: string;
  nextStateId: number;
  nextStatus: string;
  isFinalStep: boolean;
  message?: string;
}

type RawChallenge = {
  challenge_id: number;
  world_id: number;
  world_name?: string;
  question_template: string;
  correct_answer_template: string | null;
  is_multi_step: boolean;
  points: number;
  difficulty: number;
  timer_seconds: number;
  start_state_id: number;
};

type RawState = {
  state_id: number;
  status_template: string;
};

type RawWorld = {
  world_id: number;
  world_name: string;
};

/**
 * Classe principal da engine de jogo
 */
export class GameEngine {
  private variableCache: Map<string, string[]> = new Map();
  private currentChallengeVariables: Record<string, string> = {};
  private lastChallengeId: number | null = null; // Para evitar repetições

  /**
   * Carrega todas as variáveis dinâmicas do banco
   */
  async loadDynamicVariables(): Promise<void> {
    const { data: variables, error } = await supabase
      .from('dynamic_variables')
      .select('*');
    
    if (error) {
      console.error("Erro ao carregar variáveis dinâmicas:", error);
      return;
    }

    if (variables) {
      for (const variable of variables) {
        const pool = variable.value_pool as string[];
        this.variableCache.set(variable.variable_name, pool);
      }
    }
  }

  /**
   * Seleciona um valor aleatório de um pool de variáveis
   */
  private getRandomValue(variableName: string): string {
    const pool = this.variableCache.get(variableName);
    if (!pool || pool.length === 0) {
      return variableName; // Retorna o nome da variável se não houver pool
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /**
   * Substitui todas as variáveis em um template
   */
  private replaceVariables(template: string, variables?: Record<string, string>): string {
    let result = template;
    const vars = variables || this.currentChallengeVariables;
    
    for (const [key, value] of Object.entries(vars)) {
      // Se a chave já tem colchetes, usar diretamente
      // Se não tem, adicionar colchetes
      const pattern = key.startsWith('[') ? key : `[${key}]`;
      result = result.replace(new RegExp(pattern.replace(/[[\]]/g, '\\$&'), 'g'), value);
    }
    
    return result;
  }

  /**
   * Extrai todas as variáveis de um template
   */
  private extractVariables(template: string): string[] {
    const matches = template.match(/\[[\w_]+\]/g);
    return matches ? Array.from(new Set(matches)) : [];
  }

  /**
   * Gera valores para todas as variáveis de um desafio
   */
  private generateChallengeVariables(questionTemplate: string, statusTemplate: string): Record<string, string> {
    const allVariables = [
      ...this.extractVariables(questionTemplate),
      ...this.extractVariables(statusTemplate)
    ];
    
    const uniqueVariables = Array.from(new Set(allVariables));
    const variables: Record<string, string> = {};
    
    for (const varName of uniqueVariables) {
      variables[varName] = this.getRandomValue(varName);
    }
    
    return variables;
  }

  private async fetchWorldData(worldId: number): Promise<{ challenges: RawChallenge[]; world: RawWorld; stateMap: Map<number, RawState>; } | null> {
    const [challengesResult, worldResult] = await Promise.all([
      supabase
        .from('challenges')
        .select('*')
        .eq('world_id', worldId),
      supabase
        .from('worlds')
        .select('*')
        .eq('world_id', worldId)
        .single()
    ]);

    const { data: worldChallenges, error: challengesError } = challengesResult;
    const { data: world, error: worldError } = worldResult;

    if (challengesError || !worldChallenges || worldChallenges.length === 0) {
      console.error("Erro ao buscar desafios:", challengesError);
      return null;
    }

    if (worldError || !world) {
      console.error("Erro ao buscar mundo:", worldError);
      return null;
    }

    const stateIds = Array.from(new Set(worldChallenges.map((c: RawChallenge) => c.start_state_id).filter(Boolean)));
    const stateMap: Map<number, RawState> = new Map();

    if (stateIds.length > 0) {
      const { data: states, error: stateError } = await supabase
        .from('git_states')
        .select('*')
        .in('state_id', stateIds);

      if (stateError || !states) {
        console.error("Erro ao buscar estados:", stateError);
        return null;
      }

      states.forEach((state: RawState) => {
        stateMap.set(state.state_id, state);
      });
    }

    return {
      challenges: worldChallenges as RawChallenge[],
      world: world as RawWorld,
      stateMap,
    };
  }

  private buildChallengePayload(challenge: RawChallenge, world: RawWorld, state: RawState): ChallengeData {
    const templates = [challenge.question_template];
    if (challenge.correct_answer_template) {
      templates.push(challenge.correct_answer_template);
    }

    const variables = this.generateChallengeVariables(
      templates.join(' '),
      state.status_template
    );

    return {
      challengeId: challenge.challenge_id,
      worldId: challenge.world_id,
      worldName: world.world_name,
      questionTemplate: challenge.question_template,
      question: this.replaceVariables(challenge.question_template, variables),
      isMultiStep: challenge.is_multi_step,
      points: challenge.points,
      difficulty: challenge.difficulty,
      timerSeconds: challenge.timer_seconds,
      currentStateId: challenge.start_state_id,
      currentStatus: this.replaceVariables((state as RawState).status_template, variables),
      variables,
    };
  }

  /**
   * Busca um desafio aleatório de um mundo específico
   */
  async getRandomChallenge(worldId: number): Promise<ChallengeData | null> {
    const challenges = await this.getRandomChallenges(worldId, 1);
    return challenges[0] || null;
  }

  async getRandomChallenges(worldId: number, count: number): Promise<ChallengeData[]> {
    if (this.variableCache.size === 0) {
      await this.loadDynamicVariables();
    }

    const worldData = await this.fetchWorldData(worldId);
    if (!worldData) {
      return [];
    }

    const { challenges: rawChallenges, world, stateMap } = worldData;
    if (rawChallenges.length === 0) {
      return [];
    }

    const results: ChallengeData[] = [];
    let selectionPool = [...rawChallenges];
    let lastSelectedId = this.lastChallengeId;

    for (let i = 0; i < count; i++) {
      if (selectionPool.length === 0) {
        selectionPool = [...rawChallenges];
      }

      let available = selectionPool;
      if (available.length > 1 && lastSelectedId !== null) {
        const filtered = available.filter(ch => ch.challenge_id !== lastSelectedId);
        if (filtered.length > 0) {
          available = filtered;
        }
      }

      const challenge = available[Math.floor(Math.random() * available.length)];
      const state = stateMap.get(challenge.start_state_id);

      if (!state) {
        console.warn(`[GameEngine] Estado ${challenge.start_state_id} não encontrado para o desafio ${challenge.challenge_id}`);
        selectionPool = selectionPool.filter(ch => ch.challenge_id !== challenge.challenge_id);
        continue;
      }

      const payload = this.buildChallengePayload(challenge, world, state);
      results.push(payload);
      lastSelectedId = challenge.challenge_id;

      selectionPool = selectionPool.filter(ch => ch.challenge_id !== challenge.challenge_id);

      if (results.length >= count) {
        break;
      }
    }

    if (results.length > 0) {
      this.lastChallengeId = results[results.length - 1].challengeId;
    }

    return results;
  }

  /**
   * Valida um comando do jogador
   */
  async validateCommand(
    challengeId: number,
    currentStateId: number,
    command: string,
    variables: Record<string, string>
  ): Promise<TransitionResult> {
    // Atualiza as variáveis do contexto
    this.currentChallengeVariables = variables;

    console.log('='.repeat(60));
    console.log('[GameEngine] 🔍 VALIDATING COMMAND');
    console.log('[GameEngine] Challenge ID:', challengeId);
    console.log('[GameEngine] Current State ID:', currentStateId);
    console.log('[GameEngine] Command:', command);
    console.log('[GameEngine] Variables:', variables);
    console.log('='.repeat(60));

    // Primeiro, tentar validação direta usando o correct_answer_template
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('correct_answer_template, is_multi_step')
      .eq('challenge_id', challengeId)
      .single();

    if (challenge && challenge.correct_answer_template) {
      console.log('[GameEngine] Using correct_answer_template:', challenge.correct_answer_template);
      
      // Se for multi-step, dividir por &&
      let expectedAnswers: string[] = [];
      if (challenge.is_multi_step && challenge.correct_answer_template.includes('&&')) {
        expectedAnswers = challenge.correct_answer_template.split('&&').map((cmd: string) => cmd.trim());
      } else {
        expectedAnswers = [challenge.correct_answer_template];
      }

      // Substituir variáveis nas respostas esperadas
      const substitutedAnswers = expectedAnswers.map(answer => {
        let result = answer;
        if (variables) {
          Object.entries(variables).forEach(([key, value]) => {
            const cleanKey = key.replace(/^\[|\]$/g, '');
            const placeholder = `[${cleanKey}]`;
            result = result.replace(new RegExp(placeholder.replace(/[[\]]/g, '\\$&'), 'g'), value);
          });
        }
        return result;
      });

      console.log('[GameEngine] Substituted answers:', substitutedAnswers);

      // Buscar a transição correspondente ao passo atual
      const { data: transitions, error: transError } = await supabase
        .from('valid_transitions')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('current_state_id', currentStateId)
        .order('step_order', { ascending: true });

      if (transError || !transitions || transitions.length === 0) {
        console.error('[GameEngine] No transitions found');
        return {
          success: false,
          commandOutput: "Comando não esperado neste momento.",
          nextStateId: currentStateId,
          nextStatus: "",
          isFinalStep: false,
          message: "Não há transições válidas para este estado.",
        };
      }

      const currentTransition = transitions[0]; // Primeira transição do estado atual
      const currentStepIndex = currentTransition.step_order - 1;
      const expectedAnswer = substitutedAnswers[currentStepIndex];

      console.log('[GameEngine] Current step:', currentStepIndex + 1);
      console.log('[GameEngine] Expected answer:', expectedAnswer);
      console.log('[GameEngine] User command:', command.trim());

      // Comparação direta (case insensitive, ignorando espaços extras)
      const normalizeCommand = (cmd: string) => cmd.trim().toLowerCase().replace(/\s+/g, ' ');
      
      if (normalizeCommand(command) === normalizeCommand(expectedAnswer)) {
        console.log('[GameEngine] ✅ Direct match!');
        
        // Buscar próximo estado
        const { data: nextState, error: stateError } = await supabase
          .from('git_states')
          .select('*')
          .eq('state_id', currentTransition.next_state_id)
          .single();

        if (stateError || !nextState) {
          console.error("Erro ao buscar próximo estado:", stateError);
          return {
            success: false,
            commandOutput: "Erro interno: próximo estado não encontrado.",
            nextStateId: currentStateId,
            nextStatus: "",
            isFinalStep: false,
          };
        }

        return {
          success: true,
          commandOutput: currentTransition.command_output || "✓ Comando executado com sucesso!",
          nextStateId: nextState.state_id,
          nextStatus: this.replaceVariables(nextState.status_template),
          isFinalStep: currentTransition.is_final_step,
        };
      }
    }

    // Fallback: tentar validação por regex (método antigo)
    console.log('[GameEngine] Direct match failed, trying regex validation...');

    // Busca todas as transições possíveis para este desafio e estado
    const { data: transitions, error } = await supabase
      .from('valid_transitions')
      .select('*')
      .eq('challenge_id', challengeId)
      .eq('current_state_id', currentStateId);

    if (error || !transitions || transitions.length === 0) {
      console.error("Erro ao buscar transições:", error);
      return {
        success: false,
        commandOutput: "Comando não esperado neste momento.",
        nextStateId: currentStateId,
        nextStatus: "",
        isFinalStep: false,
        message: "Não há transições válidas para este estado.",
      };
    }

    // Tenta encontrar uma transição que corresponda ao comando
    console.log('[GameEngine] Available transitions:', transitions.length);
    
    for (const transition of transitions) {
      // Substitui variáveis no pattern
      let pattern = transition.answer_pattern;
      
      console.log('[GameEngine] Original pattern:', transition.answer_pattern);
      
      // Substituir variáveis no pattern (com escape para regex)
      if (variables) {
        Object.entries(variables).forEach(([key, value]) => {
          // Remover colchetes da chave se existirem
          const cleanKey = key.replace(/^\[|\]$/g, '');
          // Procurar por [KEY] ou (KEY) no pattern
          const placeholderBracket = `[${cleanKey}]`;
          const placeholderParen = `(${placeholderBracket})`;
          
          // Escapar caracteres especiais do valor para usar em regex
          const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          
          // Substituir [FILE_NAME] ou ([FILE_NAME])
          pattern = pattern.replace(new RegExp(placeholderBracket.replace(/[[\]]/g, '\\$&'), 'g'), escapedValue);
          pattern = pattern.replace(new RegExp(placeholderParen.replace(/[()[\]]/g, '\\$&'), 'g'), `(${escapedValue})`);
        });
      }
      
      console.log('[GameEngine] Pattern after variable substitution:', pattern);
      
      try {
        const regex = new RegExp(pattern, 'i'); // Case insensitive
        
        console.log('[GameEngine] Testing regex:', regex);
        console.log('[GameEngine] Against command:', command.trim());
        
        const testResult = regex.test(command.trim());
        console.log('[GameEngine] Match result:', testResult);
        
        if (testResult) {
          // Comando válido! Busca o próximo estado
          const { data: nextState, error: stateError } = await supabase
            .from('git_states')
            .select('*')
            .eq('state_id', transition.next_state_id)
            .single();

          if (stateError || !nextState) {
            console.error("Erro ao buscar próximo estado:", stateError);
            return {
              success: false,
              commandOutput: "Erro interno: próximo estado não encontrado.",
              nextStateId: currentStateId,
              nextStatus: "",
              isFinalStep: false,
            };
          }

          return {
            success: true,
            commandOutput: this.replaceVariables(transition.command_output || ""),
            nextStateId: transition.next_state_id,
            nextStatus: this.replaceVariables(nextState.status_template),
            isFinalStep: transition.is_final_step,
            message: transition.is_final_step 
              ? "Desafio completo!" 
              : "Passo correto! Continue...",
          };
        }
      } catch (error) {
        console.error("Erro ao processar regex:", pattern, error);
      }
    }

    // Nenhuma transição correspondeu
    console.log('[GameEngine] ❌ No transitions matched!');
    console.log('[GameEngine] Returning failure response');
    
    return {
      success: false,
      commandOutput: "Comando incorreto. Tente novamente!",
      nextStateId: currentStateId,
      nextStatus: "",
      isFinalStep: false,
      message: "O comando não corresponde ao esperado.",
    };
  }

  /**
   * Busca todos os mundos disponíveis
   */
  async getAvailableWorlds() {
    const { data: worlds, error } = await supabase
      .from('worlds')
      .select('*')
      .order('world_level', { ascending: true });

    if (error) {
      console.error("Erro ao buscar mundos:", error);
      return [];
    }

    return worlds || [];
  }

  /**
   * Busca informações de um mundo específico
   */
  async getWorldInfo(worldId: number) {
    const { data: world, error: worldError } = await supabase
      .from('worlds')
      .select('*')
      .eq('world_id', worldId)
      .single();

    if (worldError || !world) {
      console.error("Erro ao buscar mundo:", worldError);
      return null;
    }

    // Conta quantos desafios existem neste mundo
    const { data: worldChallenges, error: challengesError } = await supabase
      .from('challenges')
      .select('challenge_id')
      .eq('world_id', worldId);

    return {
      ...world,
      totalChallenges: worldChallenges?.length || 0,
    };
  }
}

// Exporta uma instância singleton
export const gameEngine = new GameEngine();
