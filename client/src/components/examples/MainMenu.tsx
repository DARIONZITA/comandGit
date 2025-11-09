import MainMenu from '../MainMenu'

export default function MainMenuExample() {
  return (
    <MainMenu
      onStartGame={(worldId) => console.log('Start game world:', worldId)}
      onViewLeaderboard={() => console.log('View leaderboard')}
      highScore={15420}
    />
  )
}
