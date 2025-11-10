import MainMenu from '../MainMenu'

export default function MainMenuExample() {
  const modeHighScores = {
    normal: 15420,
    dojo: 9400,
    arcade: 12100,
  } as const;

  return (
    <MainMenu
      onSelectMode={(mode) => console.log('Mode selected:', mode)}
      onViewLeaderboard={() => console.log('View leaderboard')}
      highScore={Math.max(...Object.values(modeHighScores))}
      modeHighScores={modeHighScores}
    />
  )
}
