import { Trophy, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import trophyIcon from "@assets/generated_images/Achievement_trophy_pixel_art_5d140558.png";

interface GameOverModalProps {
  score: number;
  combo: number;
  highScore: number;
  isNewHighScore: boolean;
  onRestart: () => void;
  onMainMenu: () => void;
}

export default function GameOverModal({
  score,
  combo,
  highScore,
  isNewHighScore,
  onRestart,
  onMainMenu
}: GameOverModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <Card className="max-w-lg w-full" data-testid="card-gameover">
        <CardHeader className="text-center space-y-4">
          {isNewHighScore && (
            <img 
              src={trophyIcon} 
              alt="New High Score!" 
              className="w-20 h-20 mx-auto"
              data-testid="img-trophy"
            />
          )}
          <CardTitle className="text-4xl">
            {isNewHighScore ? "NOVO RECORDE!" : "GAME OVER"}
          </CardTitle>
          <CardDescription className="text-lg">
            {isNewHighScore 
              ? "Parabéns! Você estabeleceu um novo recorde!" 
              : "Continue praticando para melhorar!"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground mb-1">PONTUAÇÃO FINAL</p>
              <p className="text-3xl font-bold" data-testid="text-final-score">
                {score.toLocaleString()}
              </p>
            </div>
            <div className="text-center p-4 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground mb-1">MAIOR COMBO</p>
              <p className="text-3xl font-bold text-primary" data-testid="text-max-combo">
                x{combo}
              </p>
            </div>
          </div>

          {!isNewHighScore && highScore > 0 && (
            <div className="text-center p-3 bg-accent/50 rounded-md">
              <p className="text-sm text-muted-foreground">
                Recorde Atual: <span className="font-bold text-foreground">{highScore.toLocaleString()}</span>
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onMainMenu} 
              className="flex-1"
              data-testid="button-menu"
            >
              <Home className="w-4 h-4 mr-2" />
              MENU
            </Button>
            <Button 
              variant="default" 
              onClick={onRestart} 
              className="flex-1"
              data-testid="button-restart"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              JOGAR NOVAMENTE
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
