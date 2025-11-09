import { ArrowLeft, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
  const entries: LeaderboardEntry[] = [
    { rank: 1, playerName: "GitMaster", score: 25680, combo: 18, world: "Mundo 2" },
    { rank: 2, playerName: "CodeNinja", score: 22450, combo: 15, world: "Mundo 2" },
    { rank: 3, playerName: "DevPro", score: 19320, combo: 12, world: "Mundo 1" },
    { rank: 4, playerName: "BranchKing", score: 17890, combo: 14, world: "Mundo 2" },
    { rank: 5, playerName: "CommitQueen", score: 15420, combo: 10, world: "Mundo 1" },
  ];

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
            <CardTitle>Top 5 Pontuações</CardTitle>
            <CardDescription>Ranking global de todos os tempos</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
