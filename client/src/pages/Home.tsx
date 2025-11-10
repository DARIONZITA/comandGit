import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import MainMenu from "@/components/MainMenu";
import ModePhaseSelector from "@/components/ModePhaseSelector";
import NewLeaderboard from "@/components/NewLeaderboard";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { GameMode } from "@shared/schema";
import { getModeHighScoreKey, readBestScore } from "@/lib/modePhases";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [modeHighScores, setModeHighScores] = useState<Record<GameMode, number>>(() => ({
    normal: readBestScore("normal"),
    dojo: readBestScore("dojo"),
    arcade: readBestScore("arcade"),
  }));

  const { data: userStatsData } = useQuery({
    queryKey: ["userMenuStats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return null;
      const response = await fetch(`/api/user-stats/${user.id}`);

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch user stats");
      }

      return response.json();
    },
    staleTime: 1000 * 60, // 1 minuto
  });

  useEffect(() => {
    if (!userStatsData) return;

    const updatedScores: Record<GameMode, number> = {
      normal: userStatsData.high_score_normal ?? 0,
      dojo: userStatsData.high_score_dojo ?? 0,
      arcade: userStatsData.high_score_arcade ?? 0,
    };

    setModeHighScores(updatedScores);

    if (typeof window !== "undefined") {
      (Object.entries(updatedScores) as [GameMode, number][]).forEach(([mode, score]) => {
        window.localStorage.setItem(getModeHighScoreKey(mode), score.toString());
      });
    }
  }, [userStatsData]);

  const overallHighScore = Math.max(...Object.values(modeHighScores));

  const handleModeSelect = (mode: GameMode) => {
    setSelectedMode(mode);
  };

  const handleStartPhase = (worldId: number) => {
    if (!selectedMode) return;
    setLocation(`/game/${worldId}?mode=${selectedMode}`);
  };

  return (
    <div className="relative min-h-screen">
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setLocation('/profile')}
          title="Ver Perfil"
        >
          <User className="w-4 h-4" />
        </Button>
        <ThemeToggle />
      </div>
      
      {showLeaderboard ? (
        <NewLeaderboard onBack={() => setShowLeaderboard(false)} />
      ) : selectedMode ? (
        <ModePhaseSelector
          mode={selectedMode}
          bestScore={modeHighScores[selectedMode]}
          onBack={() => setSelectedMode(null)}
          onSelectPhase={handleStartPhase}
        />
      ) : (
        <MainMenu
          onSelectMode={handleModeSelect}
          onViewLeaderboard={() => setShowLeaderboard(true)}
          highScore={overallHighScore}
          modeHighScores={modeHighScores}
        />
      )}
    </div>
  );
}
