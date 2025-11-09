import ChallengeBlock from '../ChallengeBlock'

export default function ChallengeBlockExample() {
  const challenge = {
    id: "1-1",
    scenario: "Você criou um novo arquivo 'README.md'. Prepare-o para o commit.",
    correctAnswer: "git add README.md",
    points: 100,
    difficulty: 1
  };

  return (
    <div className="relative w-full h-64 bg-background">
      <ChallengeBlock
        challenge={challenge}
        position={50}
        isExpiring={false}
      />
      <div className="mt-48">
        <ChallengeBlock
          challenge={{ ...challenge, id: "1-2", points: 200 }}
          position={200}
          isExpiring={true}
        />
      </div>
    </div>
  )
}
