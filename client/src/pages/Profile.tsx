import { ArrowLeft, Trophy, Target, Zap, Award, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { useUserStats, useAchievements, useUserAchievements } from "@/hooks/useGameScores";
import { useLocation } from "wouter";

export default function Profile() {
  const [, setLocation] = useLocation();
  const { user, signOut } = useAuth();
  const { data: stats, isLoading: statsLoading } = useUserStats();
  const { data: allAchievements } = useAchievements();
  const { data: userAchievements } = useUserAchievements();

  const username = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Jogador';
  const email = user?.email || '';

  const unlockedAchievementIds = new Set(
    userAchievements?.map(ua => ua.achievements.id) || []
  );

  const handleLogout = async () => {
    await signOut();
    setLocation('/login');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 scan-lines">
      <div className="max-w-4xl w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation('/')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold">Perfil</h1>
              <p className="text-muted-foreground mt-1">
                Suas estatísticas e conquistas
              </p>
            </div>
          </div>
          <Button variant="destructive" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                {username.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-2xl">{username}</p>
                <p className="text-sm text-muted-foreground font-normal">{email}</p>
              </div>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pontuação Total</p>
                  <p className="text-3xl font-bold">
                    {statsLoading ? '...' : stats?.totalScore.toLocaleString()}
                  </p>
                </div>
                <Trophy className="w-10 h-10 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Maior Score</p>
                  <p className="text-3xl font-bold">
                    {statsLoading ? '...' : stats?.highestScore.toLocaleString()}
                  </p>
                </div>
                <Target className="w-10 h-10 text-chart-4" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Maior Combo</p>
                  <p className="text-3xl font-bold">
                    {statsLoading ? '...' : stats?.highestCombo}x
                  </p>
                </div>
                <Zap className="w-10 h-10 text-chart-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Jogos</p>
                  <p className="text-3xl font-bold">
                    {statsLoading ? '...' : stats?.totalGames}
                  </p>
                </div>
                <Award className="w-10 h-10 text-chart-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-6 h-6" />
              Conquistas
            </CardTitle>
            <CardDescription>
              {userAchievements?.length || 0} de {allAchievements?.length || 0} desbloqueadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!allAchievements || allAchievements.length === 0 ? (
              <Alert>
                <AlertDescription>
                  Nenhuma conquista disponível ainda.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {allAchievements.map((achievement) => {
                  const isUnlocked = unlockedAchievementIds.has(achievement.id);
                  return (
                    <div
                      key={achievement.id}
                      className={`flex items-center gap-3 p-4 rounded-md border transition-all ${
                        isUnlocked
                          ? 'bg-primary/5 border-primary/20'
                          : 'bg-muted/30 border-muted opacity-50'
                      }`}
                    >
                      <div className="text-3xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <p className="font-semibold flex items-center gap-2">
                          {achievement.name}
                          {isUnlocked && (
                            <Badge variant="default" className="text-xs">
                              ✓
                            </Badge>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {achievement.description}
                        </p>
                        {!isUnlocked && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Requisito: {achievement.requirement_value}{' '}
                            {achievement.requirement_type === 'score' && 'pontos'}
                            {achievement.requirement_type === 'combo' && 'combo'}
                            {achievement.requirement_type === 'worlds_completed' && 'mundos'}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Scores */}
        {stats && stats.scores && stats.scores.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Jogos Recentes</CardTitle>
              <CardDescription>Suas últimas 5 partidas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.scores.slice(0, 5).map((score, index) => (
                  <div
                    key={score.id}
                    className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                  >
                    <div>
                      <p className="font-semibold">Mundo {score.world}</p>
                      <p className="text-sm text-muted-foreground">
                        Combo x{score.combo}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">{score.score.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(score.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
