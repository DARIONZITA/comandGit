import { ChallengeBlock as ChallengeBlockType } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Zap } from "lucide-react";

interface ArcadeChallengeBlockProps {
  challenge: ChallengeBlockType;
  position: number;
  isExpiring: boolean;
  speed: number;
  left?: number; // Posição horizontal para evitar sobreposição
}

export default function ArcadeChallengeBlock({ challenge, position, isExpiring, speed, left }: ArcadeChallengeBlockProps) {
  const speedLevel = speed < 0.7 ? "LENTO" : speed < 1.0 ? "NORMAL" : speed < 1.5 ? "RÁPIDO" : "EXTREMO";
  const speedColor = speed < 0.7 ? "text-green-500" : speed < 1.0 ? "text-yellow-500" : speed < 1.5 ? "text-orange-500" : "text-red-500";
  
  return (
    <div
      className="absolute w-[500px] transition-all duration-100 select-none"
      style={{
        top: `${position}px`,
        left: left !== undefined ? `${left}px` : '50%',
        transform: left !== undefined ? 'none' : 'translateX(-50%)'
      }}
    >
      <Card 
        className={`p-4 shadow-2xl border-2 select-none ${
          isExpiring 
            ? "border-destructive bg-destructive/10 animate-pulse" 
            : "border-orange-500/50 bg-orange-500/5"
        }`}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-3 h-3 text-orange-500" />
              <span className={`text-xs font-bold ${speedColor}`}>
                {speedLevel}
              </span>
            </div>
            <span className="text-xs font-bold text-orange-500">
              +{challenge.points}
            </span>
          </div>

          <div className="font-mono text-xl font-bold bg-muted/50 p-3 rounded-md border border-orange-500/30 text-center text-orange-600 dark:text-orange-400 select-none">
            {challenge.correctAnswer}
          </div>
        </div>
      </Card>
    </div>
  );
}
