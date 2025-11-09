import { useState } from "react";
import { useLocation } from "wouter";
import MainMenu from "@/components/MainMenu";
import Leaderboard from "@/components/Leaderboard";
import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  const [, setLocation] = useLocation();
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const highScore = parseInt(localStorage.getItem('highScore') || '0');

  const handleStartGame = (worldId: number) => {
    setLocation(`/game/${worldId}`);
  };

  return (
    <div className="relative min-h-screen">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      
      {showLeaderboard ? (
        <Leaderboard onBack={() => setShowLeaderboard(false)} />
      ) : (
        <MainMenu
          onStartGame={handleStartGame}
          onViewLeaderboard={() => setShowLeaderboard(true)}
          highScore={highScore}
        />
      )}
    </div>
  );
}
