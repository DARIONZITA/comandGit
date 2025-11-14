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
    <div className="absolute top-0 left-0 right-0 p-4 mobile-p-2 flex items-start justify-between gap-4 mobile-hud-compact z-10">
      <div className="flex flex-col gap-2 mobile-gap-1">
        <div className="flex items-center gap-3 mobile-gap-1 mobile-hud-item">
          <span className="text-sm font-semibold tracking-wider text-muted-foreground mobile-text-xs">SCORE</span>
          <span className="text-3xl font-bold tabular-nums mobile-text-base" data-testid="text-score">
            {score.toLocaleString()}
          </span>
        </div>
        
        {combo > 1 && (
          <Badge 
            variant="default" 
            className="w-fit pulse-glow mobile-text-xs"
            data-testid="badge-combo"
          >
            <span className="text-base font-bold mobile-text-xs">COMBO x{combo}</span>
          </Badge>
        )}
      </div>

      <div className="flex flex-col items-center gap-2 mobile-hud-row mobile-items-center mobile-hud-item">
        <Badge variant="secondary" className="text-sm font-semibold mobile-text-xs whitespace-nowrap" data-testid="badge-world">
          {worldName} - NÍVEL {level}
        </Badge>
      </div>

      <div className="flex flex-col items-end gap-2 mobile-hud-row mobile-items-center mobile-gap-1">
        <div className="flex items-center gap-2 mobile-gap-1 mobile-hud-item">
          <span className="text-sm font-semibold tracking-wider text-muted-foreground mobile-text-xs">VIDAS</span>
          <div className="flex gap-1" data-testid="container-lives">
            {Array.from({ length: maxLives }).map((_, i) => (
              <Heart
                key={i}
                className={`w-5 h-5 mobile-w-4 mobile-h-4 ${
                  i < lives ? 'fill-destructive text-destructive' : 'text-muted'
                }`}
                data-testid={`icon-life-${i}`}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2 mobile-gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={onToggleMute}
            className="mobile-btn-icon-lg"
            data-testid="button-mute"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onPause}
            className="mobile-text-xs mobile-px-2 mobile-py-2"
            data-testid="button-pause"
          >
            PAUSE
          </Button>
        </div>
      </div>
    </div>
  );
}
