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
  commandOutput?: string; // Output do comando
  showOutput?: boolean; // Se deve mostrar o output
  failureReason?: "timeout" | "wrong"; // Razão da falha
}

export default function StaticChallengeBlock({ 
  challenge, 
  onTimeout, 
  isPaused,
  feedbackState = "idle",
  timeLimit,
  onCriticalTime,
  sequenceStep = 0,
  commandOutput = "",
  showOutput = false,
  failureReason = "timeout"
}: StaticChallengeBlockProps) {
  
  const isSequenceChallenge = challenge.commandSequence && challenge.commandSequence.length > 1;
  const totalSteps = challenge.commandSequence?.length || 1;
  
  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] max-w-[90vw] z-10">
      <Card 
        className={`p-8 mobile-p-3 shadow-2xl border-2 transition-all duration-300 ${
          feedbackState === "success" 
            ? "border-green-500 bg-green-500/20 scale-105 animate-success-pulse" 
            : feedbackState === "failure"
              ? "border-red-500 bg-red-500/20 animate-shake"
              : "border-primary/50 bg-card"
        }`}
      >
        <div className="space-y-6 mobile-space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between mobile-flex-wrap mobile-gap-2">
            <div className="flex items-center gap-3 mobile-gap-2">
              <Trophy className={`w-6 h-6 mobile-w-5 mobile-h-5 ${
                feedbackState === "success" ? "text-green-500" : "text-primary"
              }`} />
              <span className="text-sm font-semibold text-primary uppercase tracking-wider mobile-text-xs">
                Desafio Git
              </span>
              {isSequenceChallenge && (
                <span className="text-xs font-bold text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded mobile-text-xs">
                  Passo {sequenceStep + 1}/{totalSteps}
                </span>
              )}
            </div>
            <span className="text-sm font-bold text-primary mobile-text-xs">
              +{challenge.points} pts
            </span>
          </div>

          {/* Cenário */}
          <div className="space-y-2 mobile-space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mobile-text-xs">
              Cenário:
            </p>
            <p className="text-lg font-medium leading-relaxed mobile-text-sm mobile-leading-normal">
              {challenge.scenario}
            </p>
          </div>

          {/* Timer Bar */}
          {feedbackState === "idle" && (
            <TimerBar 
              key={`timer-${challenge.id}`}
              duration={timeLimit}
              onTimeout={onTimeout}
              isPaused={isPaused}
              isActive={true}
              onCriticalTime={onCriticalTime}
            />
          )}

          {/* Feedback de Sucesso */}
          {feedbackState === "success" && (
            <div className="flex items-center justify-center gap-3 py-4 animate-fade-in mobile-py-2 mobile-gap-2">
              <CheckCircle2 className="w-12 h-12 text-green-500 animate-bounce mobile-w-8 mobile-h-8" />
              <div>
                <p className="text-2xl font-bold text-green-500 mobile-text-lg">CORRETO!</p>
                <p className="text-sm text-muted-foreground mobile-text-xs">Comando executado com sucesso</p>
              </div>
            </div>
          )}

          {/* Feedback de Falha */}
          {feedbackState === "failure" && (
            <div className="flex items-center justify-center gap-3 py-4 animate-fade-in mobile-py-2 mobile-gap-2">
              <XCircle className="w-12 h-12 text-red-500 animate-pulse mobile-w-8 mobile-h-8" />
              <div>
                <p className="text-2xl font-bold text-red-500 mobile-text-lg">
                  {failureReason === "timeout" ? "TEMPO ESGOTADO!" : "INCORRETO!"}
                </p>
                <p className="text-sm text-muted-foreground mobile-text-xs">
                  {failureReason === "timeout" ? "Você perdeu uma vida" : "Resposta errada! Perdeu uma vida"}
                </p>
              </div>
            </div>
          )}

          {/* Output do Comando - aparece no lugar da dica */}
          {feedbackState === "idle" && showOutput && commandOutput && (
            <div className="pt-2 border-t border-border mobile-pt-1 transition-all duration-300 opacity-100">
              <div className="font-mono text-sm p-3 rounded-lg border bg-muted/95 border-primary/30 text-foreground mobile-text-xs mobile-p-2">
                <div className="whitespace-pre-wrap break-words">
                  {commandOutput.split('\n').map((line, i) => (
                    <div key={i} className="leading-relaxed">
                      {line.includes('\t') ? (
                        <span dangerouslySetInnerHTML={{ __html: line.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;') }} />
                      ) : (
                        line
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
