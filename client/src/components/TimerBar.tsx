import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";

interface TimerBarProps {
  duration: number; // Duração total em segundos
  onTimeout: () => void;
  isPaused: boolean;
  isActive: boolean;
  onCriticalTime?: () => void; // Callback quando tempo < 3s
}

export default function TimerBar({ duration, onTimeout, isPaused, isActive, onCriticalTime }: TimerBarProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [startTime, setStartTime] = useState(Date.now());
  const [tickTockStarted, setTickTockStarted] = useState(false);

  // Resetar timer quando duration mudar (novo desafio)
  useEffect(() => {
    setTimeLeft(duration);
    setStartTime(Date.now());
    setTickTockStarted(false);
  }, [duration]);

  useEffect(() => {
    if (!isActive) {
      setTimeLeft(duration);
      setTickTockStarted(false);
      return;
    }

    if (isPaused) return;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = Math.max(0, duration - elapsed);
      
      setTimeLeft(remaining);

      // Iniciar tick-tock quando < 3s
      if (remaining <= 3 && remaining > 0 && !tickTockStarted && onCriticalTime) {
        setTickTockStarted(true);
        onCriticalTime();
      }

      if (remaining <= 0) {
        clearInterval(interval);
        onTimeout();
      }
    }, 50); // Atualiza a cada 50ms para animação suave

    return () => clearInterval(interval);
  }, [duration, startTime, onTimeout, isPaused, isActive, tickTockStarted, onCriticalTime]);

  const percentage = (timeLeft / duration) * 100;
  const isCritical = timeLeft <= 3;
  const isVeryLow = timeLeft <= 1;

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className={`font-bold ${isCritical ? 'text-red-500 animate-pulse' : 'text-muted-foreground'}`}>
          Tempo
        </span>
        <span className={`font-mono ${isCritical ? 'text-red-500 font-bold text-lg' : 'text-muted-foreground'}`}>
          {Math.ceil(timeLeft)}s
        </span>
      </div>
      
      <div className={`relative ${isCritical ? 'animate-pulse' : ''}`}>
        <Progress 
          value={percentage} 
          className={`h-3 ${isVeryLow ? 'animate-shake' : ''}`}
        />
        
        {/* Overlay colorido baseado no tempo */}
        <div 
          className={`absolute inset-0 h-3 rounded-full transition-all duration-300 ${
            isCritical 
              ? 'bg-red-500/30 animate-pulse' 
              : percentage < 50 
                ? 'bg-yellow-500/20' 
                : 'bg-green-500/20'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {isCritical && (
        <p className="text-xs text-red-500 font-bold animate-bounce text-center">
          ⚠️ RÁPIDO!
        </p>
      )}
    </div>
  );
}
