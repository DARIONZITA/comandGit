import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import GameHUD from "@/components/GameHUD";
import ChallengeBlock from "@/components/ChallengeBlock";
import DojoChallengeBlock from "@/components/DojoChallengeBlock";
import ArcadeChallengeBlock from "@/components/ArcadeChallengeBlock";
import StaticChallengeBlock from "@/components/StaticChallengeBlock";
import StaticDojoChallengeBlock from "@/components/StaticDojoChallengeBlock";
import CommandInput from "@/components/CommandInput";
import DojoInput from "@/components/DojoInput";
import GameOverModal from "@/components/GameOverModal";
import PauseModal from "@/components/PauseModal";
import CommandOutput from "@/components/CommandOutput";
import { GAME_WORLDS, validateCommand } from "@/lib/gameData";
import { DOJO_CHALLENGES } from "@/lib/dojoData";
import { ARCADE_CHALLENGES, ARCADE_SPEED_CONFIG } from "@/lib/arcadeData";
import { ChallengeBlock as ChallengeBlockType, GameMode } from "@shared/schema";
import ThemeToggle from "@/components/ThemeToggle";
import { useGameSounds } from "@/hooks/useGameSounds";
import { useGitState } from "@/hooks/useGitState";
import { useDynamicChallenges, type ChallengeData } from "@/hooks/useDynamicChallenges";
import { MODE_PHASES, getPhaseForMode, getModeHighScoreKey, isPhaseUnlocked, readBestScore } from "@/lib/modePhases";
import { toast } from "@/hooks/use-toast";
import { useAddGameScore } from "@/hooks/useGameScores";
import { useAuth } from "@/contexts/AuthContext";

// Função para embaralhar array (Fisher-Yates shuffle)
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

interface FallingChallenge {
  challenge: ChallengeBlockType;
  position: number;
  speed: number;
  id: string;
  left: number; // Posição horizontal para evitar sobreposição
}

interface GameProps {
  worldId: number;
  mode?: GameMode;
}

type ChallengeStatus = "idle" | "success" | "failure";

export default function Game({ worldId, mode = "normal" }: GameProps) {
  const [, setLocation] = useLocation();
  const world = GAME_WORLDS.find(w => w.id === worldId);
  const { user } = useAuth();
  const addGameScore = useAddGameScore();
  
  // Hook do novo sistema de desafios dinâmicos (apenas para modo normal)
  const dynamicChallenges = useDynamicChallenges();
  const [dynamicChallenge, setDynamicChallenge] = useState<ChallengeData | null>(null);
  const [useDynamicSystem, setUseDynamicSystem] = useState(false); // Flag para ativar novo sistema
  const [accessChecked, setAccessChecked] = useState(false);
  
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [shake, setShake] = useState(false);
  const scoreSavedRef = useRef(false); // Flag para evitar salvamento duplicado
  const savedModeRef = useRef<GameMode | null>(null); // Guardar modo salvo
  const gameModeRef = useRef<GameMode>(mode); // Capturar modo no início
  
  // Atualizar ref quando mode mudar
  useEffect(() => {
    gameModeRef.current = mode;
  }, [mode]);
  
  // Sistema de fila para Modos 1 e 2
  const [currentChallenge, setCurrentChallenge] = useState<ChallengeBlockType | null>(null);
  const [challengeStatus, setChallengeStatus] = useState<ChallengeStatus>("idle");
  const [challengeQueue, setChallengeQueue] = useState<ChallengeBlockType[]>([]);
  const [sequenceStep, setSequenceStep] = useState(0); // Índice do comando atual na sequência
  const [failureReason, setFailureReason] = useState<"timeout" | "wrong">("timeout"); // Razão da falha
  
  // Rastreamento de desafios falhados
  const [failedChallenges, setFailedChallenges] = useState<ChallengeBlockType[]>([]);
  
  // Sistema de blocos caindo para Modo Arcade
  const [fallingChallenges, setFallingChallenges] = useState<FallingChallenge[]>([]);

  // Sistema de som
  const sounds = useGameSounds();

  // Sistema de simulação Git - Arcade e Dojo usam 800ms, outros modos 2000ms
  const outputDuration = (mode === "arcade" || mode === "dojo") ? 800 : 2000;
  const gitState = useGitState(outputDuration);

  const initialHighScore = readBestScore(mode);
  const [highScore, setHighScore] = useState(initialHighScore);
  const [phaseAllowed, setPhaseAllowed] = useState(() => isPhaseUnlocked(mode, worldId, initialHighScore));

  // Determinar tempo limite baseado no desafio ou dificuldade (nível)
  const getTimeLimit = () => {
    if (mode === "arcade") return 0; // Arcade não usa timer
    
    // Modo normal com sistema dinâmico: usar timerSeconds do desafio
    if (mode === "normal" && useDynamicSystem && dynamicChallenge) {
      return dynamicChallenge.timerSeconds;
    }
    
    // Modo dojo: usar timerSeconds do desafio estático
    if (mode === "dojo" && currentChallenge?.timerSeconds) {
      return currentChallenge.timerSeconds;
    }
    
    // Fallback: baseado no nível (sistema antigo)
    if (level === 1) return 12; // Easy
    if (level === 2) return 10; // Medium
    return 8; // Hard (level 3+)
  };

  // Selecionar desafios baseado no modo
  const [lastDynamicWorldId, setLastDynamicWorldId] = useState<number | null>(null);

  useEffect(() => {
    const unlocked = isPhaseUnlocked(mode, worldId, highScore);
    setPhaseAllowed(unlocked);
    setAccessChecked(true);

    if (!unlocked) {
      const phase = getPhaseForMode(mode, worldId);
      if (phase) {
        toast({
          title: "Fase bloqueada",
          description: `Alcance ${phase.requiredScore} pontos no modo ${mode.toUpperCase()} para desbloquear.`,
          variant: "destructive"
        });
      }
      if (mode === "arcade" || mode === "dojo") {
        setLocation(`/game/1?mode=${mode}`);
      } else {
        setLocation(`/game/1?mode=normal`);
      }
    }
  }, [mode, worldId, highScore, setLocation]);

  useEffect(() => {
    const storedBest = readBestScore(mode);

    if (storedBest !== highScore) {
      setHighScore(storedBest);
    }

    const unlocked = isPhaseUnlocked(mode, worldId, storedBest);
    setPhaseAllowed(unlocked);
    setAccessChecked(true);

    if (!unlocked) {
      const phase = getPhaseForMode(mode, worldId);
      if (phase) {
        toast({
          title: "Fase bloqueada",
          description: `Alcance ${phase.requiredScore.toLocaleString()} pontos no modo ${mode.toUpperCase()} para desbloquear.`,
          variant: "destructive",
        });
      }

      const fallbackWorld = MODE_PHASES[mode]?.[0]?.worldId ?? 1;
      if (fallbackWorld !== worldId) {
        setLocation(`/game/${fallbackWorld}?mode=${mode}`);
      }
    }
  }, [mode, worldId, highScore, setLocation]);

  useEffect(() => {
    if (!phaseAllowed || !accessChecked) return;

    if (mode === "dojo") {
      setUseDynamicSystem(false);
      setLastDynamicWorldId(null);
      if (challengeQueue.length === 0) {
        const dojoChallengesByWorld = DOJO_CHALLENGES.filter(c => c.worldId === worldId);
        setChallengeQueue(shuffleArray(dojoChallengesByWorld));
      }
      return;
    }

    if (mode === "arcade") {
      setUseDynamicSystem(false);
      setLastDynamicWorldId(null);
      if (challengeQueue.length === 0) {
        const shuffled = [...ARCADE_CHALLENGES].sort(() => Math.random() - 0.5);
        setChallengeQueue(shuffled);
      }
      return;
    }

    if (mode !== "normal") {
      setUseDynamicSystem(false);
      setLastDynamicWorldId(null);
      return;
    }

    // Aguardar carregamento dos mundos dinâmicos antes de decidir o fallback
    if (dynamicChallenges.worlds.length === 0) {
      if (dynamicChallenges.error && world && challengeQueue.length === 0 && !currentChallenge) {
        setUseDynamicSystem(false);
        setLastDynamicWorldId(null);
        setDynamicChallenge(null);
        setChallengeQueue([...world.challenges]);
      }
      return;
    }

    const dynamicWorld = dynamicChallenges.worlds.find(w => w.world_level === worldId);

    if (dynamicWorld) {
      if (!useDynamicSystem) {
        setUseDynamicSystem(true);
        console.log('🎮 Usando sistema de desafios dinâmicos do banco de dados');
        setCurrentChallenge(null);
        setDynamicChallenge(null);
        setChallengeQueue([]);
      }

      if (lastDynamicWorldId !== dynamicWorld.world_id) {
        setLastDynamicWorldId(dynamicWorld.world_id);
        setCurrentChallenge(null);
        setDynamicChallenge(null);
        setChallengeQueue([]);
        dynamicChallenges.fetchRandomChallenge(dynamicWorld.world_id);
        return;
      }

      if ((!dynamicChallenges.currentChallenge || dynamicChallenges.currentChallenge.worldId !== dynamicWorld.world_id) && !dynamicChallenges.loading) {
        dynamicChallenges.fetchRandomChallenge(dynamicWorld.world_id);
      }
      return;
    }

    // Sem mundo dinâmico correspondente: voltar para desafios estáticos
    if (useDynamicSystem) {
      setUseDynamicSystem(false);
      setLastDynamicWorldId(null);
      setDynamicChallenge(null);
    }

    if (world && challengeQueue.length === 0 && !currentChallenge) {
      setChallengeQueue([...world.challenges]);
    }
  }, [
    phaseAllowed,
    accessChecked,
    mode,
    world,
    worldId,
    challengeQueue.length,
    currentChallenge,
    dynamicChallenges.worlds,
    dynamicChallenges.currentChallenge,
    dynamicChallenges.loading,
    dynamicChallenges.error,
    dynamicChallenges.fetchRandomChallenge,
    useDynamicSystem,
    lastDynamicWorldId
  ]);

  // Carregar próximo desafio (Modos Normal e Dojo)
  useEffect(() => {
    if (mode === "arcade") return; // Arcade usa sistema diferente
    if (isPaused || isGameOver) return;
    
    // NOVO: Sistema dinâmico para modo normal
    if (mode === "normal" && useDynamicSystem) {
      if (dynamicChallenges.currentChallenge) {
        const incomingId = dynamicChallenges.currentChallenge.challengeId.toString();
        if (currentChallenge && currentChallenge.id === incomingId) {
          return; // Já sincronizado
        }
        console.log('[Game] Loading new dynamic challenge:', dynamicChallenges.currentChallenge);
        console.log('[Game] Current state from hook:', dynamicChallenges.currentState);
        
        // Converter desafio dinâmico para formato compatível
        const convertedChallenge: ChallengeBlockType = {
          id: dynamicChallenges.currentChallenge.challengeId.toString(),
          scenario: dynamicChallenges.currentChallenge.question,
          correctAnswer: "", // Não usado no sistema dinâmico
          points: dynamicChallenges.currentChallenge.points,
          difficulty: dynamicChallenges.currentChallenge.difficulty,
        };
        setCurrentChallenge(convertedChallenge);
        setDynamicChallenge(dynamicChallenges.currentChallenge);
        setChallengeStatus("idle");
        setSequenceStep(0);
        
        console.log('[Game] Challenge loaded. State should be:', {
          stateId: dynamicChallenges.currentChallenge.currentStateId,
          status: dynamicChallenges.currentChallenge.currentStatus
        });
      }
      return;
    }
    
    if (currentChallenge !== null) return; // Já tem desafio ativo (sistema antigo)
    
    // Sistema antigo para dojo e fallback
    if (challengeQueue.length > 0) {
      setCurrentChallenge(challengeQueue[0]);
      setChallengeQueue(prev => prev.slice(1));
      setChallengeStatus("idle");
      setSequenceStep(0); // Resetar progresso da sequência
    } else {
      // Passou de fase!
      setTimeout(() => {
        setLevel(l => l + 1);
        if (mode === "dojo") {
          const dojoChallengesByWorld = DOJO_CHALLENGES.filter(c => c.worldId === worldId);
          setChallengeQueue(shuffleArray(dojoChallengesByWorld));
        } else if (world) {
          setChallengeQueue([...world.challenges]);
        }
      }, 500);
    }
  }, [currentChallenge, challengeQueue, isPaused, isGameOver, mode, world, level, useDynamicSystem, dynamicChallenges.currentChallenge]);

  // Função compartilhada para lidar com falha (timeout ou erro)
  const handleChallengeFailure = useCallback(async () => {
    sounds.stopTickTock();
    sounds.playFailure();
    
    // Adicionar desafio atual à lista de falhados
    if (currentChallenge) {
      // Criar cópia do desafio com informações extras
      let challengeToAdd = { ...currentChallenge };
      
      // Se estiver usando sistema dinâmico, buscar as respostas corretas
      if (useDynamicSystem && dynamicChallenge && dynamicChallenges.currentState) {
        try {
          console.log('[Game] Calling getCorrectAnswers with variables:', dynamicChallenge.variables);
          
          const answersResult = await dynamicChallenges.getCorrectAnswers(
            dynamicChallenge.challengeId,
            dynamicChallenge.variables
          );
          
          console.log('[Game] Got answers result:', answersResult);
          
          // Atualizar o desafio com as respostas corretas
          challengeToAdd = {
            ...challengeToAdd,
            scenario: dynamicChallenge.question,
            correctAnswer: answersResult.answers[0] || "Comando Git apropriado",
            // Se for multi-step, adicionar sequência
            commandSequence: answersResult.answers.length > 1 ? answersResult.answers : undefined,
          };
        } catch (error) {
          console.error('Erro ao buscar respostas:', error);
          // Fallback para informação genérica
          challengeToAdd = {
            ...challengeToAdd,
            correctAnswer: "Consulte a documentação do Git",
          };
        }
      }
      
      setFailedChallenges(prev => {
        // Verificar se o desafio já existe (evitar duplicatas)
        const isDuplicate = prev.some(challenge => 
          challenge.scenario === challengeToAdd.scenario && 
          challenge.correctAnswer === challengeToAdd.correctAnswer
        );
        
        if (isDuplicate) {
          console.log('[Game] Desafio duplicado, não adicionando novamente');
          return prev;
        }
        
        // Adicionar novo desafio e manter apenas últimos 10
        const updated = [...prev, challengeToAdd];
        return updated.slice(-10);
      });
    }
    
    setChallengeStatus("failure");
    setLives(l => {
      const newLives = l - 1;
      if (newLives <= 0) {
        setIsGameOver(true);
      }
      return newLives;
    });
    setCombo(0);
    setSequenceStep(0); // Resetar progresso da sequência ao falhar
    setShake(true);
    setTimeout(() => setShake(false), 300);
    
    // Próximo desafio após animação
    setTimeout(() => {
      setCurrentChallenge(null);
      setChallengeStatus("idle");

      if (useDynamicSystem) {
        setDynamicChallenge(null);
        const dynamicWorld = dynamicChallenges.worlds.find(w => w.world_level === worldId);
        if (dynamicWorld) {
          console.log('[Game] Fetching next challenge after failure for world:', dynamicWorld.world_id);
          dynamicChallenges.fetchRandomChallenge(dynamicWorld.world_id);
        }
      }
    }, 1500);
  }, [currentChallenge, useDynamicSystem, dynamicChallenge, dynamicChallenges, worldId, sounds]);

  // Timeout handler (Modos Normal e Dojo) - agora usa a função compartilhada
  const handleTimeout = useCallback(async () => {
    if (mode === "arcade") return;
    setFailureReason("timeout"); // Marca como timeout
    await handleChallengeFailure();
  }, [mode, handleChallengeFailure]);

  // Configuração de velocidade para modo arcade
  const getArcadeSpeed = () => {
    const config = ARCADE_SPEED_CONFIG[Math.min(level, 7) as keyof typeof ARCADE_SPEED_CONFIG];
    return config || ARCADE_SPEED_CONFIG[7];
  };

  // Sistema de blocos caindo (APENAS Modo Arcade)
  useEffect(() => {
    if (mode !== "arcade") return; // Não rodar para outros modos
    if (isPaused || isGameOver) return;

    const spawnConfig = getArcadeSpeed();
    
    const spawnInterval = setInterval(() => {
      if (challengeQueue.length > 0 && fallingChallenges.length < 3) {
        const nextChallenge = challengeQueue[0];
        
        // Gerar posição horizontal aleatória para evitar sobreposição
        const usedPositions = fallingChallenges.map(fc => fc.left);
        let randomLeft: number;
        let attempts = 0;
        
        // Detectar se é mobile
        const isMobile = window.innerWidth <= 768;
        const cardWidth = isMobile ? 300 : 500; // Card menor no mobile (max-w-[90vw])
        const minMargin = isMobile ? 20 : 50; // Margem mínima das bordas
        const minSpacing = isMobile ? 320 : 550; // Espaçamento mínimo entre cards
        
        do {
          // Ajustar área disponível para mobile
          randomLeft = Math.random() * (window.innerWidth - cardWidth - minMargin * 2) + minMargin;
          attempts++;
        } while (
          attempts < 10 && 
          usedPositions.some(pos => Math.abs(pos - randomLeft) < minSpacing)
        );
        
        const newFalling: FallingChallenge = {
          challenge: nextChallenge,
          position: -100,
          speed: spawnConfig.baseSpeed,
          id: `${nextChallenge.id}-${Date.now()}`,
          left: randomLeft
        };
        setFallingChallenges(prev => [...prev, newFalling]);
        setChallengeQueue(prev => prev.slice(1));
      }
    }, spawnConfig.spawnInterval || 3000);

    return () => clearInterval(spawnInterval);
  }, [isPaused, isGameOver, challengeQueue, fallingChallenges.length, level, mode]);

  useEffect(() => {
    if (mode !== "arcade") return; // Não rodar para outros modos
    if (isPaused || isGameOver) return;

    const moveInterval = setInterval(() => {
      setFallingChallenges(prev => {
        const updated = prev.map(fc => ({
          ...fc,
          position: fc.position + fc.speed
        }));

        const remaining = updated.filter(fc => {
          if (fc.position > window.innerHeight - 150) {
            setLives(l => {
              const newLives = l - 1;
              if (newLives <= 0) {
                setIsGameOver(true);
              }
              return newLives;
            });
            setCombo(0);
            setShake(true);
            setTimeout(() => setShake(false), 300);
            return false;
          }
          return true;
        });

        return remaining;
      });
    }, 16);

    return () => clearInterval(moveInterval);
  }, [isPaused, isGameOver, mode]);

  const handleCommandSubmit = useCallback(async (command: string) => {
    // Processar comando Git primeiro (simulação de terminal)
    gitState.processGitCommand(command);
    
    // Modo Arcade: usar sistema antigo de blocos caindo
    if (mode === "arcade") {
      if (fallingChallenges.length === 0) return;

      const bottomChallenge = fallingChallenges.reduce((lowest, current) => 
        current.position > lowest.position ? current : lowest
      );

      const isCorrect = command.trim() === bottomChallenge.challenge.correctAnswer.trim();

      if (isCorrect) {
        sounds.playSuccess();
        sounds.playCombo(combo + 1);
        
        const newCombo = combo + 1;
        const multiplier = Math.max(1, Math.floor(newCombo / 2));
        const points = bottomChallenge.challenge.points * multiplier;
        
        setScore(s => s + points);
        setCombo(newCombo);
        setMaxCombo(prev => Math.max(prev, newCombo));
        setFallingChallenges(prev => prev.filter(fc => fc.id !== bottomChallenge.id));

        if (fallingChallenges.length <= 1 && challengeQueue.length === 0) {
          setTimeout(() => {
            setLevel(l => l + 1);
            // Embaralhar desafios ao passar de nível
            const shuffled = [...ARCADE_CHALLENGES].sort(() => Math.random() - 0.5);
            setChallengeQueue(shuffled);
          }, 1000);
        }
      } else {
        sounds.playFailure();
        setCombo(0);
        setShake(true);
        setTimeout(() => setShake(false), 300);
      }
      return;
    }

    // NOVO: Sistema dinâmico para modo normal
    if (mode === "normal" && useDynamicSystem && dynamicChallenge) {
      if (challengeStatus !== "idle") return;

      try {
        console.log('[Game] Validating command:', command);
        const result = await dynamicChallenges.validateCommand(command);
        
        console.log('[Game] Validation result:', result);
        
        if (!result) {
          console.log('[Game] No result returned');
          sounds.playFailure();
          setCombo(0);
          setShake(true);
          setTimeout(() => setShake(false), 300);
          return;
        }

        console.log('[Game] Result success:', result.success);

        if (result.success) {
          console.log('[Game] ✅ Command validated successfully!');
          sounds.stopTickTock();
          
          // Mostrar output do comando se existir (será exibido no CommandOutput)
          if (result.commandOutput) {
            console.log('📤 Output do comando:', result.commandOutput);
          }

          // Verificar se é passo final (desafio completo) ou multi-etapa
          if (result.isFinalStep) {
            console.log('[Game] 🏆 Final step - completing challenge!');
            sounds.playSuccess();
            sounds.playCombo(combo + 1);
            
            setChallengeStatus("success");
            const newCombo = combo + 1;
            const multiplier = Math.max(1, Math.floor(newCombo / 3));
            const points = dynamicChallenge.points * multiplier;
            
            setScore(s => s + points);
            setCombo(newCombo);
            setMaxCombo(prev => Math.max(prev, newCombo));

            // Próximo desafio após animação
            setTimeout(async () => {
              console.log('[Game] Clearing current challenge...');
              setCurrentChallenge(null);
              setDynamicChallenge(null);
              setChallengeStatus("idle");
              
              // Buscar próximo desafio
              const dynamicWorld = dynamicChallenges.worlds.find(w => w.world_level === worldId);
              if (dynamicWorld) {
                console.log('[Game] Fetching next challenge from world:', dynamicWorld.world_id);
                const nextChallenge = await dynamicChallenges.fetchRandomChallenge(dynamicWorld.world_id);
                console.log('[Game] Got next challenge:', nextChallenge);
                
                // O useEffect vai carregar automaticamente quando detectar a mudança
              }
            }, 800);
          } else {
            // Multi-etapa: continue no mesmo desafio
            sounds.playCombo(sequenceStep + 1);
            setSequenceStep(prev => prev + 1);
            
            // Atualizar o status do Git no componente
            if (dynamicChallenges.currentState) {
              // Feedback visual rápido
              setChallengeStatus("success");
              setTimeout(() => {
                setChallengeStatus("idle");
              }, 400);
            }
          }
        } else {
          console.log('[Game] ❌ Command validation failed');
          console.log('[Game] Result message:', result.message);
          // Marcar como resposta errada
          setFailureReason("wrong");
          // Usar função compartilhada para falha
          await handleChallengeFailure();
        }
      } catch (error) {
        console.error('Erro ao validar comando:', error);
        // Marcar como resposta errada
        setFailureReason("wrong");
        // Usar função compartilhada para falha
        await handleChallengeFailure();
      }
      return;
    }

    // Modos Normal (sistema antigo) e Dojo: usar sistema de fila
    if (!currentChallenge || challengeStatus !== "idle") return;

    let isCorrect = false;
    let isSequenceChallenge = false;
    let expectedCommand = "";

    if (mode === "dojo") {
      const expectedAnswer = currentChallenge.blanks?.[0]?.answer || "";
      expectedCommand = expectedAnswer;
      isCorrect = command.trim().toLowerCase() === expectedAnswer.trim().toLowerCase();
    } else {
      // Verificar se é um desafio com sequência de comandos
      if (currentChallenge.commandSequence && currentChallenge.commandSequence.length > 0) {
        isSequenceChallenge = true;
        expectedCommand = currentChallenge.commandSequence[sequenceStep];
        const altAnswers = currentChallenge.sequenceAltAnswers?.[sequenceStep];
        isCorrect = validateCommand(command, expectedCommand, altAnswers);
      } else {
        // Desafio de comando único
        expectedCommand = currentChallenge.correctAnswer;
        isCorrect = validateCommand(command, expectedCommand, currentChallenge.altAnswers);
      }
    }

    if (isCorrect) {
      sounds.stopTickTock();
      sounds.playSuccess();
      
      // Se é sequência e não é o último comando
      if (isSequenceChallenge && sequenceStep < (currentChallenge.commandSequence?.length || 0) - 1) {
        // Avançar para próximo comando da sequência
        setSequenceStep(prev => prev + 1);
        sounds.playCombo(sequenceStep + 1); // Som indica progresso
        
        // Manter desafio ativo, mas dar feedback visual rápido
        setChallengeStatus("success");
        setTimeout(() => {
          setChallengeStatus("idle"); // Volta para idle, mantém mesmo desafio
        }, 400);
      } else {
        // Último comando da sequência OU desafio de comando único: completa o desafio
        sounds.playCombo(combo + 1);
        
        setChallengeStatus("success");
        const newCombo = combo + 1;
        const multiplier = Math.max(1, Math.floor(newCombo / 3));
        const points = currentChallenge.points * multiplier;
        
        setScore(s => s + points);
        setCombo(newCombo);
        setMaxCombo(prev => Math.max(prev, newCombo));
        setSequenceStep(0); // Resetar para próximo desafio

        // Próximo desafio após animação
        setTimeout(() => {
          setCurrentChallenge(null);
          setChallengeStatus("idle");
        }, 800);
      }
    } else {
      // Marcar como resposta errada
      setFailureReason("wrong");
      // Usar função compartilhada para falha
      await handleChallengeFailure();
    }
  }, [
    fallingChallenges, 
    currentChallenge, 
    challengeStatus, 
    combo, 
    challengeQueue.length, 
    mode, 
    sounds, 
    sequenceStep,
    useDynamicSystem,
    dynamicChallenge,
    dynamicChallenges,
    worldId,
    gitState,
    handleChallengeFailure
  ]);

  const handleRestart = async () => {
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setLives(3);
    setLevel(1);
    setIsGameOver(false);
    setCurrentChallenge(null);
    setDynamicChallenge(null);
    setChallengeStatus("idle");
    setSequenceStep(0); // Resetar progresso de sequências
    setFailedChallenges([]); // Limpar lista de desafios falhados
    setFallingChallenges([]);
    scoreSavedRef.current = false; // Resetar flag de salvamento
    savedModeRef.current = null; // Resetar modo salvo
    
    if (mode === "dojo") {
      const dojoChallengesByWorld = DOJO_CHALLENGES.filter(c => c.worldId === worldId);
      setChallengeQueue(shuffleArray(dojoChallengesByWorld));
    } else if (mode === "arcade") {
      // Embaralhar desafios do Arcade ao reiniciar
      setChallengeQueue(shuffleArray(ARCADE_CHALLENGES));
    } else if (mode === "normal" && useDynamicSystem) {
      // Reiniciar sistema dinâmico
      const dynamicWorld = dynamicChallenges.worlds.find(w => w.world_level === worldId);
      if (dynamicWorld) {
        await dynamicChallenges.fetchRandomChallenge(dynamicWorld.world_id);
      }
    } else if (world) {
      setChallengeQueue([...world.challenges]);
    }
  };

  const handleMainMenu = () => {
    setLocation('/');
  };

  const isNewHighScore = score > highScore;

  useEffect(() => {
    if (!isGameOver || !isNewHighScore) return;

    if (typeof window !== "undefined") {
      window.localStorage.setItem(getModeHighScoreKey(mode), score.toString());
    }
    setHighScore(score);
  }, [isGameOver, isNewHighScore, mode, score]);

  // Salvar pontuação no backend quando o jogo terminar
  useEffect(() => {
    const currentMode = gameModeRef.current;
    
    console.log('[Game] Save effect triggered:', { 
      isGameOver, 
      hasUser: !!user, 
      score, 
      scoreSaved: scoreSavedRef.current, 
      currentMode,
      savedMode: savedModeRef.current 
    });
    
    // Verificar se já salvou E se o modo é o mesmo (prevenir duplas por mudança de modo)
    if (!isGameOver || !user || score === 0 || scoreSavedRef.current || savedModeRef.current === currentMode) {
      return;
    }

    const saveScore = async () => {
      try {
        scoreSavedRef.current = true; // Marcar como salvo ANTES da requisição
        savedModeRef.current = currentMode; // Guardar modo salvo
        
        console.log('[Game] Saving score to backend:', { score, combo: maxCombo, worldId, mode: currentMode });
        
        await addGameScore.mutateAsync({
          score,
          combo: maxCombo,
          world: worldId,
          mode: currentMode,
        });
        
        console.log('[Game] Score saved successfully for mode:', currentMode);
      } catch (error) {
        console.error('[Game] Failed to save score:', error);
        scoreSavedRef.current = false; // Resetar flag se falhou
        savedModeRef.current = null;
        
        toast({
          title: "Erro ao salvar pontuação",
          description: "Não foi possível salvar sua pontuação no servidor.",
          variant: "destructive",
        });
      }
    };

    saveScore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGameOver, user?.id, score]);

  const getModeName = () => {
    if (mode === "dojo") return "Dojo de Sintaxe";
    if (mode === "arcade") return "Arcade (Velocidade)";
    return world?.name || "Clássico";
  };

  if (!world && mode === "normal") {
    return <div>Mundo não encontrado</div>;
  }

  if (!accessChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">Verificando progresso para desbloquear a fase…</p>
        </div>
      </div>
    );
  }

  if (!phaseAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">Redirecionando para fases disponíveis…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen overflow-hidden bg-background scan-lines mobile-game-container mobile-game-area-responsive">
      <div className="absolute top-4 right-4 z-20 mobile-top-2 mobile-right-2">
        <ThemeToggle />
      </div>

      <GameHUD
        score={score}
        combo={combo}
        lives={lives}
        maxLives={3}
        level={level}
        worldName={getModeName()}
        isMuted={sounds.isMuted}
        onToggleMute={() => sounds.setMuted(!sounds.isMuted)}
        onPause={() => setIsPaused(true)}
      />

      {/* Output do Comando Git - SOMENTE para Arcade e Dojo */}
      {(mode === "arcade" || mode === "dojo") && (
        <CommandOutput
          output={gitState.commandOutput}
          show={gitState.showOutput}
        />
      )}

      <div className="absolute inset-0 pt-32 pb-32 mobile-game-area mobile-challenge-visible">
        {mode === "arcade" ? (
          // Modo Arcade: blocos caindo (sistema antigo)
          fallingChallenges.map((fc) => (
            <ArcadeChallengeBlock
              key={fc.id}
              challenge={fc.challenge}
              position={fc.position}
              isExpiring={fc.position > window.innerHeight - 300}
              speed={fc.speed}
              left={fc.left}
            />
          ))
        ) : (
          // Modos Normal e Dojo: bloco estático com timer
          currentChallenge && (
            mode === "dojo" ? (
              <StaticDojoChallengeBlock
                key={`dojo-${currentChallenge.id}-${Date.now()}`}
                challenge={currentChallenge}
                onTimeout={handleTimeout}
                isPaused={isPaused}
                feedbackState={challengeStatus}
                timeLimit={getTimeLimit()}
                onCriticalTime={() => sounds.playTickTock()}
                failureReason={failureReason}
              />
            ) : (
              <StaticChallengeBlock
                key={`normal-${currentChallenge.id}-${Date.now()}`}
                challenge={currentChallenge}
                onTimeout={handleTimeout}
                isPaused={isPaused}
                feedbackState={challengeStatus}
                timeLimit={getTimeLimit()}
                onCriticalTime={() => sounds.playTickTock()}
                sequenceStep={sequenceStep}
                commandOutput={gitState.commandOutput}
                showOutput={gitState.showOutput}
                failureReason={failureReason}
              />
            )
          )
        )}
      </div>

      {mode === "dojo" && currentChallenge ? (
        <DojoInput
          blankText={currentChallenge.blanks?.[0]?.text || ""}
          expectedAnswer={currentChallenge.blanks?.[0]?.answer || ""}
          onSubmit={handleCommandSubmit}
          disabled={isPaused || isGameOver || challengeStatus !== "idle"}
          shake={shake}
        />
      ) : mode === "arcade" && fallingChallenges.length > 0 ? (
        <CommandInput
          onSubmit={handleCommandSubmit}
          disabled={isPaused || isGameOver}
          shake={shake}
          currentBranch={gitState.gitState.currentBranch}
          workingDirectory={gitState.gitState.workingDirectory}
          sounds={sounds}
        />
      ) : mode === "normal" && currentChallenge ? (
        <CommandInput
          onSubmit={handleCommandSubmit}
          disabled={isPaused || isGameOver || challengeStatus !== "idle"}
          shake={shake}
          currentBranch={gitState.gitState.currentBranch}
          workingDirectory={gitState.gitState.workingDirectory}
          sounds={sounds}
        />
      ) : null}

      {isPaused && (
        <PauseModal
          onResume={() => setIsPaused(false)}
          onMainMenu={handleMainMenu}
          isMuted={sounds.isMuted}
          onToggleMute={() => sounds.setMuted(!sounds.isMuted)}
        />
      )}

      {isGameOver && (
        <GameOverModal
          score={score}
          combo={maxCombo}
          highScore={highScore}
          isNewHighScore={isNewHighScore}
          onRestart={handleRestart}
          onMainMenu={handleMainMenu}
          failedChallenges={failedChallenges}
        />
      )}
    </div>
  );
}
