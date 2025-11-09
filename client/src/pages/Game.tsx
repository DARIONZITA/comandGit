import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import GameHUD from "@/components/GameHUD";
import ChallengeBlock from "@/components/ChallengeBlock";
import CommandInput from "@/components/CommandInput";
import GameOverModal from "@/components/GameOverModal";
import PauseModal from "@/components/PauseModal";
import { GAME_WORLDS, validateCommand } from "@/lib/gameData";
import { ChallengeBlock as ChallengeBlockType } from "@shared/schema";
import ThemeToggle from "@/components/ThemeToggle";

interface FallingChallenge {
  challenge: ChallengeBlockType;
  position: number;
  speed: number;
  id: string;
}

interface GameProps {
  worldId: number;
}

export default function Game({ worldId }: GameProps) {
  const [, setLocation] = useLocation();
  const world = GAME_WORLDS.find(w => w.id === worldId);
  
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [lives, setLives] = useState(5);
  const [level, setLevel] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [shake, setShake] = useState(false);
  const [fallingChallenges, setFallingChallenges] = useState<FallingChallenge[]>([]);
  const [challengeQueue, setChallengeQueue] = useState<ChallengeBlockType[]>([]);

  const highScore = parseInt(localStorage.getItem('highScore') || '0');

  useEffect(() => {
    if (world) {
      setChallengeQueue([...world.challenges]);
    }
  }, [world]);

  useEffect(() => {
    if (isPaused || isGameOver || !world) return;

    const spawnInterval = setInterval(() => {
      if (challengeQueue.length > 0 && fallingChallenges.length < 3) {
        const nextChallenge = challengeQueue[0];
        const newFalling: FallingChallenge = {
          challenge: nextChallenge,
          position: -100,
          speed: 0.5 + (level * 0.1),
          id: `${nextChallenge.id}-${Date.now()}`
        };
        setFallingChallenges(prev => [...prev, newFalling]);
        setChallengeQueue(prev => prev.slice(1));
      }
    }, 3000);

    return () => clearInterval(spawnInterval);
  }, [isPaused, isGameOver, world, challengeQueue, fallingChallenges.length, level]);

  useEffect(() => {
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
  }, [isPaused, isGameOver]);

  const handleCommandSubmit = useCallback((command: string) => {
    if (fallingChallenges.length === 0) return;

    const bottomChallenge = fallingChallenges.reduce((lowest, current) => 
      current.position > lowest.position ? current : lowest
    );

    const isCorrect = validateCommand(
      command,
      bottomChallenge.challenge.correctAnswer,
      bottomChallenge.challenge.altAnswers
    );

    if (isCorrect) {
      const newCombo = combo + 1;
      const points = bottomChallenge.challenge.points * Math.max(1, Math.floor(newCombo / 3));
      
      setScore(s => s + points);
      setCombo(newCombo);
      setMaxCombo(prev => Math.max(prev, newCombo));
      setFallingChallenges(prev => prev.filter(fc => fc.id !== bottomChallenge.id));

      if (fallingChallenges.length <= 1 && challengeQueue.length === 0) {
        setTimeout(() => {
          setLevel(l => l + 1);
          if (world) {
            setChallengeQueue([...world.challenges]);
          }
        }, 1000);
      }
    } else {
      setCombo(0);
      setShake(true);
      setTimeout(() => setShake(false), 300);
    }
  }, [fallingChallenges, combo, challengeQueue.length, world]);

  const handleRestart = () => {
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setLives(5);
    setLevel(1);
    setIsGameOver(false);
    setFallingChallenges([]);
    if (world) {
      setChallengeQueue([...world.challenges]);
    }
  };

  const handleMainMenu = () => {
    setLocation('/');
  };

  const isNewHighScore = score > highScore;
  if (isNewHighScore && isGameOver) {
    localStorage.setItem('highScore', score.toString());
  }

  if (!world) {
    return <div>Mundo não encontrado</div>;
  }

  return (
    <div className="relative h-screen overflow-hidden bg-background scan-lines">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <GameHUD
        score={score}
        combo={combo}
        lives={lives}
        maxLives={5}
        level={level}
        worldName={world.name}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(!isMuted)}
        onPause={() => setIsPaused(true)}
      />

      <div className="absolute inset-0 pt-32 pb-32">
        {fallingChallenges.map((fc) => (
          <ChallengeBlock
            key={fc.id}
            challenge={fc.challenge}
            position={fc.position}
            isExpiring={fc.position > window.innerHeight - 300}
          />
        ))}
      </div>

      <CommandInput
        onSubmit={handleCommandSubmit}
        disabled={isPaused || isGameOver}
        shake={shake}
      />

      {isPaused && (
        <PauseModal
          onResume={() => setIsPaused(false)}
          onMainMenu={handleMainMenu}
          isMuted={isMuted}
          onToggleMute={() => setIsMuted(!isMuted)}
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
        />
      )}
    </div>
  );
}
