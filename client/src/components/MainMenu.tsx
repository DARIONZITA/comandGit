import { Trophy, Target, BookOpen, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import terminalIcon from "@assets/generated_images/Terminal_icon_retro_style_e79f8591.png";
import { GameMode } from "@shared/schema";

type ModeScoreMap = Record<GameMode, number>;

interface MainMenuProps {
  onSelectMode: (mode: GameMode) => void;
  onViewLeaderboard: () => void;
  highScore: number;
  modeHighScores: ModeScoreMap;
}

export default function MainMenu({ onSelectMode, onViewLeaderboard, highScore, modeHighScores }: MainMenuProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 scan-lines">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4">
          <img 
            src={terminalIcon} 
            alt="Git Command Runner" 
            className="w-24 h-24 mx-auto"
            data-testid="img-logo"
          />
          <h1 className="text-6xl font-bold tracking-tight" data-testid="text-title">
            GIT COMMAND
            <br />
            <span className="text-primary">RUNNER</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Aprenda Git através de um jogo arcade viciante
          </p>
          {highScore > 0 && (
            <p className="text-sm text-muted-foreground" data-testid="text-highscore">
              High Score: <span className="font-bold text-primary">{highScore.toLocaleString()}</span>
            </p>
          )}
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center">Escolha seu Modo de Jogo</h2>
          
          <div className="grid gap-4">
            {/* Modo Normal */}
            <Card className="hover-elevate cursor-pointer border-2 border-primary/50" onClick={() => onSelectMode("normal")} data-testid="card-mode-normal">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="p-3 rounded-md bg-primary/10">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle>Modo 1: Clássico</CardTitle>
                  <CardDescription>
                    Complete os desafios respondendo cenários do Git
                  </CardDescription>
                  <p className="text-xs text-muted-foreground mt-2">
                    Recorde: <span className="font-semibold text-primary">{modeHighScores.normal || 0}</span>
                  </p>
                </div>
                <Button variant="default" data-testid="button-start-normal">
                  JOGAR
                </Button>
              </CardHeader>
            </Card>

            {/* Modo Dojo */}
            <Card className="hover-elevate cursor-pointer border-2 border-blue-500/50" onClick={() => onSelectMode("dojo")} data-testid="card-mode-dojo">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="p-3 rounded-md bg-blue-500/10">
                  <BookOpen className="w-6 h-6 text-blue-500" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-blue-600 dark:text-blue-400">Modo 2: Dojo de Sintaxe</CardTitle>
                  <CardDescription>
                    Preencha as lacunas nos comandos Git (Foco: Memorização)
                  </CardDescription>
                  <p className="text-xs text-muted-foreground mt-2">
                    Recorde: <span className="font-semibold text-blue-500">{modeHighScores.dojo || 0}</span>
                  </p>
                </div>
                <Button variant="outline" className="border-blue-500/50 text-blue-600 hover:bg-blue-500/10" data-testid="button-start-dojo">
                  TREINAR
                </Button>
              </CardHeader>
            </Card>

            {/* Modo Arcade */}
            <Card className="hover-elevate cursor-pointer border-2 border-orange-500/50" onClick={() => onSelectMode("arcade")} data-testid="card-mode-arcade">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="p-3 rounded-md bg-orange-500/10">
                  <Gauge className="w-6 h-6 text-orange-500" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-orange-600 dark:text-orange-400">Modo 3: Arcade (Velocidade)</CardTitle>
                  <CardDescription>
                    Digite comandos completos o mais rápido possível! �
                  </CardDescription>
                  <p className="text-xs text-muted-foreground mt-2">
                    Recorde: <span className="font-semibold text-orange-500">{modeHighScores.arcade || 0}</span>
                  </p>
                </div>
                <Button variant="outline" className="border-orange-500/50 text-orange-600 hover:bg-orange-500/10" data-testid="button-start-arcade">
                  RUSH!
                </Button>
              </CardHeader>
            </Card>
          </div>
        </div>

        <div className="flex justify-center">
          <Button 
            variant="outline" 
            onClick={onViewLeaderboard}
            data-testid="button-leaderboard"
          >
            <Trophy className="w-4 h-4 mr-2" />
            VER PLACAR
          </Button>
        </div>
      </div>
    </div>
  );
}
