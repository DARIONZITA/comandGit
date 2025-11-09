import GameOverModal from '../GameOverModal'

export default function GameOverModalExample() {
  return (
    <div className="relative w-full h-screen bg-background">
      <GameOverModal
        score={18750}
        combo={12}
        highScore={15420}
        isNewHighScore={true}
        onRestart={() => console.log('Restart game')}
        onMainMenu={() => console.log('Go to menu')}
      />
    </div>
  )
}
