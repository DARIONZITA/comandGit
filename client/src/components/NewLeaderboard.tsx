import { ArrowLeft, Trophy, Zap, Target, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHighScoreLeaderboard, useXpLeaderboard } from "@/hooks/useLeaderboards";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface LeaderboardProps {
  onBack: () => void;
}

export default function NewLeaderboard({ onBack }: LeaderboardProps) {
  const [activeTab, setActiveTab] = useState<"normal" | "dojo" | "arcade" | "xp">("normal");
  
  const { data: normalScores, isLoading: loadingNormal } = useHighScoreLeaderboard("normal");
  const { data: dojoScores, isLoading: loadingDojo } = useHighScoreLeaderboard("dojo");
  const { data: arcadeScores, isLoading: loadingArcade } = useHighScoreLeaderboard("arcade");
  const { data: xpLeaderboard, isLoading: loadingXp } = useXpLeaderboard();

  const getMedalColor = (rank: number) => {
    if (rank === 1) return "text-yellow-500";
    if (rank === 2) return "text-gray-400";
    if (rank === 3) return "text-amber-600";
    return "text-muted-foreground";
  };

  const getMedalIcon = (rank: number) => {
    if (rank <= 3) return <Trophy className={`w-5 h-5 ${getMedalColor(rank)}`} />;
    return <span className="text-muted-foreground font-bold">{rank}</span>;
  };

  const renderLeaderboardTable = (data: any[] | undefined, isLoading: boolean, scoreKey: string) => {
    console.log('[Leaderboard] Rendering table:', { data, isLoading, scoreKey });
    
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <Alert>
          <AlertDescription>
            Nenhum jogador no ranking ainda. Seja o primeiro!
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-2">
        {data.map((player, index) => {
          const scoreValue = player[scoreKey as keyof typeof player] || 0;
          console.log('[Leaderboard] Player:', { player, scoreKey, scoreValue });
          
          return (
            <div
              key={player.id}
              className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                index < 3 ? "bg-primary/5 border-primary/20" : "bg-card border-border"
              } hover:bg-muted/50`}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-8 flex items-center justify-center">
                  {getMedalIcon(index + 1)}
                </div>
                
                <div className="flex-1">
                  <p className="font-bold text-lg">{player.username}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Award className="w-3 h-3" />
                    <span>Nível {player.level}</span>
                    {player.max_combo > 0 && (
                      <>
                        <span>•</span>
                        <span>Combo Máx: {player.max_combo}x</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  {scoreValue.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">pontos</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 scan-lines">
      <div className="max-w-4xl w-full space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Trophy className="w-8 h-8 text-primary" />
              RANKINGS
            </h1>
            <p className="text-muted-foreground mt-1">
              Os melhores jogadores de Git Command Runner
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="normal" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Normal
            </TabsTrigger>
            <TabsTrigger value="dojo" className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Dojo
            </TabsTrigger>
            <TabsTrigger value="arcade" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Arcade
            </TabsTrigger>
            <TabsTrigger value="xp" className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              XP Total
            </TabsTrigger>
          </TabsList>

          <TabsContent value="normal" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Modo Normal - High Scores
                </CardTitle>
                <CardDescription>
                  Ranking de Habilidade - Melhor pontuação única
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderLeaderboardTable(normalScores, loadingNormal, "high_score_normal")}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dojo" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Modo Dojo - High Scores
                </CardTitle>
                <CardDescription>
                  Ranking de Habilidade - Melhor pontuação única
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderLeaderboardTable(dojoScores, loadingDojo, "high_score_dojo")}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="arcade" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                  <Zap className="w-5 h-5" />
                  Modo Arcade - High Scores
                </CardTitle>
                <CardDescription>
                  Ranking de Habilidade - Melhor pontuação única
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderLeaderboardTable(arcadeScores, loadingArcade, "high_score_arcade")}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="xp" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                  <Award className="w-5 h-5" />
                  Hall da Fama - XP Total
                </CardTitle>
                <CardDescription>
                  Ranking de Persistência - Soma de todos os pontos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderLeaderboardTable(xpLeaderboard, loadingXp, "total_xp")}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
