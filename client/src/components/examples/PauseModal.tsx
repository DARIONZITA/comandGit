import PauseModal from '../PauseModal'

export default function PauseModalExample() {
  return (
    <div className="relative w-full h-screen bg-background">
      <PauseModal
        onResume={() => console.log('Resume game')}
        onMainMenu={() => console.log('Go to menu')}
        isMuted={false}
        onToggleMute={() => console.log('Toggle mute')}
      />
    </div>
  )
}
