import { Trophy, RotateCcw, Home, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import trophyIcon from "@assets/generated_images/Achievement_trophy_pixel_art_5d140558.png";
import { ChallengeBlock } from "@shared/schema";

interface GameOverModalProps {
  score: number;
  combo: number;
  highScore: number;
  isNewHighScore: boolean;
  onRestart: () => void;
  onMainMenu: () => void;
  failedChallenges?: ChallengeBlock[]; // Lista de desafios falhados
}

export default function GameOverModal({
  score,
  combo,
  highScore,
  isNewHighScore,
  onRestart,
  onMainMenu,
  failedChallenges = []
}: GameOverModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 mobile-padding z-50">
      <Card className="max-w-lg w-full mobile-modal-full" data-testid="card-gameover">
        <CardHeader className="text-center space-y-4 mobile-space-y-3 mobile-card-padding">
          {isNewHighScore && (
            <img 
              src={trophyIcon} 
              alt="New High Score!" 
              className="w-20 h-20 mx-auto mobile-text-3xl"
              data-testid="img-trophy"
            />
          )}
          <CardTitle className="text-4xl mobile-text-2xl">
            {isNewHighScore ? "NOVO RECORDE!" : "GAME OVER"}
          </CardTitle>
          <CardDescription className="text-lg mobile-text-base">
            {isNewHighScore 
              ? "Parabéns! Você estabeleceu um novo recorde!" 
              : "Continue praticando para melhorar!"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 mobile-space-y-4 mobile-card-padding">
          <div className="grid grid-cols-2 gap-4 mobile-grid-cols-1 mobile-gap-3">
            <div className="text-center p-4 bg-muted rounded-md mobile-p-3">
              <p className="text-sm text-muted-foreground mb-1 mobile-text-sm">PONTUAÇÃO FINAL</p>
              <p className="text-3xl font-bold mobile-text-2xl" data-testid="text-final-score">
                {score.toLocaleString()}
              </p>
            </div>
            <div className="text-center p-4 bg-muted rounded-md mobile-p-3">
              <p className="text-sm text-muted-foreground mb-1 mobile-text-sm">MAIOR COMBO</p>
              <p className="text-3xl font-bold text-primary mobile-text-2xl" data-testid="text-max-combo">
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

          {/* Desafios Falhados */}
          {failedChallenges.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-bold text-sm uppercase">Desafios que você errou:</h3>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {failedChallenges.map((challenge, index) => (
                  <div key={challenge.id + index} className="p-3 bg-destructive/10 border border-destructive/20 rounded-md space-y-2">
                    <p className="text-sm font-medium text-foreground">{challenge.scenario}</p>
                    <div className="text-xs space-y-1">
                      <p className="text-muted-foreground font-semibold">✅ Resposta correta:</p>
                      {challenge.commandSequence && challenge.commandSequence.length > 1 ? (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground italic mb-1">
                            Sequência de {challenge.commandSequence.length} comandos:
                          </p>
                          {challenge.commandSequence.map((cmd, i) => (
                            <p key={i} className="font-mono text-green-600 dark:text-green-400 bg-muted px-2 py-1 rounded text-xs">
                              {i + 1}. {cmd}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="font-mono text-green-600 dark:text-green-400 bg-muted px-2 py-1 rounded">
                          {challenge.correctAnswer}
                        </p>
                      )}
                      {(challenge.altAnswers && challenge.altAnswers.length > 0) && (
                        <div className="mt-2">
                          <p className="text-muted-foreground font-semibold">💡 Alternativas aceitas:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {challenge.altAnswers.map((alt, i) => (
                              <span key={i} className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                                {alt}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 mobile-flex-col mobile-gap-3">
            <Button 
              variant="outline" 
              onClick={onMainMenu} 
              className="flex-1 mobile-btn-lg mobile-w-full"
              data-testid="button-menu"
            >
              <Home className="w-4 h-4 mr-2" />
              MENU
            </Button>
            <Button 
              variant="default" 
              onClick={onRestart} 
              className="flex-1 mobile-btn-lg mobile-w-full"
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
