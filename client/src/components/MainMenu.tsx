import { Trophy, Zap, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import terminalIcon from "@assets/generated_images/Terminal_icon_retro_style_e79f8591.png";

interface MainMenuProps {
  onStartGame: (worldId: number) => void;
  onViewLeaderboard: () => void;
  highScore: number;
}

export default function MainMenu({ onStartGame, onViewLeaderboard, highScore }: MainMenuProps) {
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

        <div className="grid gap-4">
          <Card className="hover-elevate cursor-pointer" onClick={() => onStartGame(1)} data-testid="card-world-1">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-3 rounded-md bg-primary/10">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle>Mundo 1: O Básico</CardTitle>
                <CardDescription>
                  Aprenda os comandos fundamentais: init, add, commit, status
                </CardDescription>
              </div>
              <Button variant="default" data-testid="button-start-world-1">
                JOGAR
              </Button>
            </CardHeader>
          </Card>

          <Card className="opacity-60 cursor-not-allowed" data-testid="card-world-2">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-3 rounded-md bg-muted">
                <Zap className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-muted-foreground">Mundo 2: Ramificações</CardTitle>
                <CardDescription>
                  Domine branches e merge (🔒 Bloqueado)
                </CardDescription>
              </div>
            </CardHeader>
          </Card>

          <Card className="opacity-60 cursor-not-allowed" data-testid="card-world-3">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-3 rounded-md bg-muted">
                <Trophy className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-muted-foreground">Mundo 3: Trabalho Remoto</CardTitle>
                <CardDescription>
                  Colabore com repositórios remotos (🔒 Bloqueado)
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
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
