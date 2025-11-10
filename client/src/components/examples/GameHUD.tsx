import GameHUD from '../GameHUD'

export default function GameHUDExample() {
  return (
    <div className="relative w-full h-48 bg-background">
      <GameHUD
        score={15420}
        combo={5}
        lives={3}
        maxLives={3}
        level={3}
        worldName="O Básico"
        isMuted={false}
        onToggleMute={() => console.log('Toggle mute')}
        onPause={() => console.log('Pause game')}
      />
    </div>
  )
}
