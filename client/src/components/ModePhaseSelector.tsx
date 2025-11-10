import { ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GameMode } from "@shared/schema";
import { MODE_PHASES, isPhaseUnlocked } from "@/lib/modePhases";

interface ModePhaseSelectorProps {
  mode: GameMode;
  bestScore: number;
  onBack: () => void;
  onSelectPhase: (worldId: number) => void;
}

const MODE_TITLES: Record<GameMode, string> = {
  normal: "Modo Clássico",
  dojo: "Modo Dojo",
  arcade: "Modo Arcade",
};

export function ModePhaseSelector({ mode, bestScore, onBack, onSelectPhase }: ModePhaseSelectorProps) {
  const phases = MODE_PHASES[mode] ?? [];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <Badge variant="secondary" className="text-sm">
            Melhor pontuação: {bestScore.toLocaleString()}
          </Badge>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">{MODE_TITLES[mode]}</h1>
          <p className="text-muted-foreground">
            Escolha a fase que deseja enfrentar. Fases bloqueadas exigem pontuação mínima no mesmo modo.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {phases.map((phase) => {
            const unlocked = isPhaseUnlocked(mode, phase.worldId, bestScore);

            return (
              <Card
                key={`${mode}-${phase.worldId}`}
                className={`relative transition ${unlocked ? "hover:border-primary/70 cursor-pointer" : "opacity-60"}`}
                onClick={() => unlocked && onSelectPhase(phase.worldId)}
              >
                {!unlocked && (
                  <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                    <Lock className="w-8 h-8" />
                    <p className="text-sm font-medium">
                      Precisa de {phase.requiredScore.toLocaleString()} pts nesse modo
                    </p>
                  </div>
                )}
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle>{phase.title}</CardTitle>
                    <CardDescription>{phase.description}</CardDescription>
                  </div>
                  {phase.badge && (
                    <Badge variant="outline">{phase.badge}</Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Requer {phase.requiredScore.toLocaleString()} pontos para desbloquear.
                  </p>
                  {unlocked && (
                    <Button className="mt-4" variant="secondary">
                      Jogar fase
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ModePhaseSelector;
