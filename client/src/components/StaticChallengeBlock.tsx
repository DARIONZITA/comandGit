import { ChallengeBlock as ChallengeBlockType } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Trophy, CheckCircle2, XCircle } from "lucide-react";
import TimerBar from "./TimerBar";

interface StaticChallengeBlockProps {
  challenge: ChallengeBlockType;
  onTimeout: () => void;
  isPaused: boolean;
  feedbackState?: "idle" | "success" | "failure";
  timeLimit: number;
  onCriticalTime?: () => void; // Callback quando tempo < 3s
  sequenceStep?: number; // Passo atual da sequência (0-indexed)
}

export default function StaticChallengeBlock({ 
  challenge, 
  onTimeout, 
  isPaused,
  feedbackState = "idle",
  timeLimit,
  onCriticalTime,
  sequenceStep = 0
}: StaticChallengeBlockProps) {
  
  const isSequenceChallenge = challenge.commandSequence && challenge.commandSequence.length > 1;
  const totalSteps = challenge.commandSequence?.length || 1;
  
  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] z-10">
      <Card 
        className={`p-8 shadow-2xl border-2 transition-all duration-300 ${
          feedbackState === "success" 
            ? "border-green-500 bg-green-500/20 scale-105 animate-success-pulse" 
            : feedbackState === "failure"
              ? "border-red-500 bg-red-500/20 animate-shake"
              : "border-primary/50 bg-card"
        }`}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className={`w-6 h-6 ${
                feedbackState === "success" ? "text-green-500" : "text-primary"
              }`} />
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">
                Desafio Git
              </span>
              {isSequenceChallenge && (
                <span className="text-xs font-bold text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded">
                  Passo {sequenceStep + 1}/{totalSteps}
                </span>
              )}
            </div>
            <span className="text-sm font-bold text-primary">
              +{challenge.points} pts
            </span>
          </div>

          {/* Cenário */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
              Cenário:
            </p>
            <p className="text-lg font-medium leading-relaxed">
              {challenge.scenario}
            </p>
          </div>

          {/* Timer Bar */}
          {feedbackState === "idle" && (
            <TimerBar 
              duration={timeLimit}
              onTimeout={onTimeout}
              isPaused={isPaused}
              isActive={true}
              onCriticalTime={onCriticalTime}
            />
          )}

          {/* Feedback de Sucesso */}
          {feedbackState === "success" && (
            <div className="flex items-center justify-center gap-3 py-4 animate-fade-in">
              <CheckCircle2 className="w-12 h-12 text-green-500 animate-bounce" />
              <div>
                <p className="text-2xl font-bold text-green-500">CORRETO!</p>
                <p className="text-sm text-muted-foreground">Comando executado com sucesso</p>
              </div>
            </div>
          )}

          {/* Feedback de Falha */}
          {feedbackState === "failure" && (
            <div className="flex items-center justify-center gap-3 py-4 animate-fade-in">
              <XCircle className="w-12 h-12 text-red-500 animate-pulse" />
              <div>
                <p className="text-2xl font-bold text-red-500">TEMPO ESGOTADO!</p>
                <p className="text-sm text-muted-foreground">Você perdeu uma vida</p>
              </div>
            </div>
          )}

          {/* Dica */}
          {feedbackState === "idle" && (
            <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
              💡 Digite o comando Git completo na entrada abaixo
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
