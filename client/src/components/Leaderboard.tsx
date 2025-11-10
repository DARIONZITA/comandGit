import { ArrowLeft, Trophy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGameScores } from "@/hooks/useGameScores";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LeaderboardEntry {
  rank: number;
  playerName: string;
  score: number;
  combo: number;
  world: string;
}

interface LeaderboardProps {
  onBack: () => void;
}

export default function Leaderboard({ onBack }: LeaderboardProps) {
  const { data: scores, isLoading, error, refetch, isFetching } = useGameScores(10);

  // Transform data to LeaderboardEntry format
  const entries: LeaderboardEntry[] = scores?.map((score: any, index: number) => ({
    rank: index + 1,
    playerName: score.users?.username || 'Jogador',
    score: score.score,
    combo: score.combo,
    world: `Mundo ${score.world}`,
  })) || [];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 scan-lines">
      <div className="max-w-3xl w-full space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Trophy className="w-8 h-8 text-primary" />
              PLACAR DE LÍDERES
            </h1>
            <p className="text-muted-foreground mt-1">
              Os melhores jogadores de Git Command Runner
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Top 10 Pontuações</CardTitle>
            <CardDescription>Ranking global de todos os tempos</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription className="flex flex-col gap-3">
                  <span>Erro ao carregar o placar. Tente novamente mais tarde.</span>
                  <div className="flex justify-center">
                    <Button onClick={() => refetch()} data-testid="button-retry" disabled={isFetching}>
                      {isFetching ? 'Tentando...' : 'Tentar novamente'}
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {!isLoading && !error && entries.length === 0 && (
              <Alert>
                <AlertDescription className="text-center">
                  Nenhuma pontuação registrada ainda. Seja o primeiro! 🎮
                </AlertDescription>
              </Alert>
            )}

            {!isLoading && !error && entries.length > 0 && (
              <div className="space-y-2">
                {entries.map((entry) => (
                  <div
                    key={entry.rank}
                    className={`flex items-center gap-4 p-4 rounded-md hover-elevate ${
                      entry.rank <= 3 ? 'bg-primary/5' : 'bg-muted/50'
                    }`}
                    data-testid={`row-leaderboard-${entry.rank}`}
                  >
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center font-bold text-lg ${
                      entry.rank === 1 ? 'bg-primary text-primary-foreground' :
                      entry.rank === 2 ? 'bg-chart-4 text-white' :
                      entry.rank === 3 ? 'bg-chart-5 text-white' :
                      'bg-secondary text-secondary-foreground'
                    }`}>
                      {entry.rank}
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-semibold" data-testid={`text-player-${entry.rank}`}>
                        {entry.playerName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {entry.world} • Combo x{entry.combo}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-2xl font-bold tabular-nums" data-testid={`text-score-${entry.rank}`}>
                        {entry.score.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
