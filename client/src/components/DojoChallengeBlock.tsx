import { ChallengeBlock as ChallengeBlockType } from "@shared/schema";
import { Card } from "@/components/ui/card";

interface DojoChallengeBlockProps {
  challenge: ChallengeBlockType;
  position: number;
  isExpiring: boolean;
}

export default function DojoChallengeBlock({ challenge, position, isExpiring }: DojoChallengeBlockProps) {
  const blankText = challenge.blanks?.[0]?.text || challenge.scenario;
  
  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 w-[600px] transition-all duration-100"
      style={{
        top: `${position}px`,
      }}
    >
      <Card 
        className={`p-6 shadow-2xl border-2 ${
          isExpiring 
            ? "border-destructive bg-destructive/10 animate-pulse" 
            : "border-blue-500/50 bg-blue-500/5"
        }`}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Dojo - Preencha a Lacuna
            </span>
            <span className="text-xs font-bold text-primary">
              +{challenge.points} pts
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground mb-2">
            {challenge.scenario}
          </p>

          <div className="font-mono text-lg bg-muted/50 p-4 rounded-md border border-border">
            {blankText.split(/(\[_+\])/g).map((part, idx) => {
              if (part.match(/\[_+\]/)) {
                return (
                  <span key={idx} className="text-yellow-500 font-bold animate-pulse">
                    {part}
                  </span>
                );
              }
              return <span key={idx}>{part}</span>;
            })}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Digite apenas o que falta no comando
          </div>
        </div>
      </Card>
    </div>
  );
}
