import { Card } from "@/components/ui/card";
import { ChallengeBlock as ChallengeBlockType } from "@shared/schema";

interface ChallengeBlockProps {
  challenge: ChallengeBlockType;
  position: number;
  isExpiring?: boolean;
}

export default function ChallengeBlock({ challenge, position, isExpiring }: ChallengeBlockProps) {
  return (
    <Card
      className={`absolute left-1/2 -translate-x-1/2 w-[90%] max-w-2xl p-6 mobile-challenge-sm mobile-card-compact mobile-challenge-container border-2 ${
        isExpiring ? 'pulse-glow border-destructive' : 'border-primary/30'
      }`}
      style={{
        top: `${position}px`,
      }}
      data-testid={`card-challenge-${challenge.id}`}
    >
      <div className="flex items-start justify-between gap-4 mobile-flex-col mobile-gap-1">
        <p className="text-lg font-semibold leading-relaxed flex-1 mobile-text-sm mobile-w-full" data-testid="text-scenario">
          {challenge.scenario}
        </p>
        <Badge variant="secondary" className="text-xs font-bold shrink-0 mobile-text-xs mobile-w-full mobile-text-center" data-testid="badge-points">
          +{challenge.points}
        </Badge>
      </div>
    </Card>
  );
}

function Badge({ children, variant, className, ...props }: any) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 ${className}`} {...props}>
      {children}
    </span>
  );
}
