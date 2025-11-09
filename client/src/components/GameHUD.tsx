import { Heart, Volume2, VolumeX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface GameHUDProps {
  score: number;
  combo: number;
  lives: number;
  maxLives: number;
  level: number;
  worldName: string;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
}

export default function GameHUD({
  score,
  combo,
  lives,
  maxLives,
  level,
  worldName,
  isMuted,
  onToggleMute,
  onPause
}: GameHUDProps) {
  return (
    <div className="absolute top-0 left-0 right-0 p-4 flex items-start justify-between gap-4 z-10">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold tracking-wider text-muted-foreground">SCORE</span>
          <span className="text-3xl font-bold tabular-nums" data-testid="text-score">
            {score.toLocaleString()}
          </span>
        </div>
        
        {combo > 1 && (
          <Badge 
            variant="default" 
            className="w-fit pulse-glow"
            data-testid="badge-combo"
          >
            <span className="text-base font-bold">COMBO x{combo}</span>
          </Badge>
        )}
      </div>

      <div className="flex flex-col items-center gap-2">
        <Badge variant="secondary" className="text-sm font-semibold" data-testid="badge-world">
          {worldName} - NÍVEL {level}
        </Badge>
      </div>

      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-wider text-muted-foreground">VIDAS</span>
          <div className="flex gap-1" data-testid="container-lives">
            {Array.from({ length: maxLives }).map((_, i) => (
              <Heart
                key={i}
                className={`w-5 h-5 ${
                  i < lives ? 'fill-destructive text-destructive' : 'text-muted'
                }`}
                data-testid={`icon-life-${i}`}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={onToggleMute}
            data-testid="button-mute"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onPause}
            data-testid="button-pause"
          >
            PAUSE
          </Button>
        </div>
      </div>
    </div>
  );
}
