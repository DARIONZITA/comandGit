import { ChallengeBlock as ChallengeBlockType } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { BookOpen, CheckCircle2, XCircle } from "lucide-react";
import TimerBar from "./TimerBar";

interface StaticDojoChallengeBlockProps {
  challenge: ChallengeBlockType;
  onTimeout: () => void;
  isPaused: boolean;
  feedbackState?: "idle" | "success" | "failure";
  timeLimit: number;
  onCriticalTime?: () => void;
  failureReason?: "timeout" | "wrong"; // Razão da falha
}

export default function StaticDojoChallengeBlock({ 
  challenge, 
  onTimeout, 
  isPaused,
  feedbackState = "idle",
  timeLimit,
  onCriticalTime,
  failureReason = "timeout"
}: StaticDojoChallengeBlockProps) {
  const blankText = challenge.blanks?.[0]?.text || challenge.scenario;
  
  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] max-w-[90vw] z-10">
      <Card 
        className={`p-8 mobile-p-3 shadow-2xl border-2 transition-all duration-300 ${
          feedbackState === "success" 
            ? "border-green-500 bg-green-500/20 scale-105 animate-success-pulse" 
            : feedbackState === "failure"
              ? "border-red-500 bg-red-500/20 animate-shake"
              : "border-blue-500/50 bg-blue-500/5"
        }`}
      >
        <div className="space-y-6 mobile-space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between mobile-flex-col mobile-items-start mobile-gap-2">
            <div className="flex items-center gap-3 mobile-gap-2">
              <BookOpen className={`w-6 h-6 mobile-w-5 mobile-h-5 ${
                feedbackState === "success" ? "text-green-500" : "text-blue-500"
              }`} />
              <span className="text-sm mobile-text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Dojo - Preencha a Lacuna
              </span>
            </div>
            <span className="text-sm mobile-text-xs font-bold text-primary">
              +{challenge.points} pts
            </span>
          </div>

          {/* Cenário */}
          <div className="space-y-2 mobile-space-y-1">
            <p className="text-xs mobile-text-xs text-muted-foreground uppercase tracking-wide font-semibold">
              Cenário:
            </p>
            <p className="text-base mobile-text-sm text-muted-foreground mb-4 mobile-mb-2">
              {challenge.scenario}
            </p>

            {/* Comando com Lacuna */}
            <div className="font-mono text-xl mobile-text-base bg-muted/50 p-6 mobile-p-3 rounded-md border border-border">
              {blankText.split(/(\[_+\])/g).map((part, idx) => {
                if (part.match(/\[_+\]/)) {
                  return (
                    <span key={idx} className={`font-bold ${
                      feedbackState === "success" 
                        ? "text-green-500" 
                        : "text-yellow-500 animate-pulse"
                    }`}>
                      {part}
                    </span>
                  );
                }
                return <span key={idx}>{part}</span>;
              })}
            </div>
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
            <div className="flex items-center justify-center gap-3 mobile-gap-2 py-4 mobile-py-2 animate-fade-in">
              <CheckCircle2 className="w-12 h-12 mobile-w-8 mobile-h-8 text-green-500 animate-bounce" />
              <div>
                <p className="text-2xl mobile-text-lg font-bold text-green-500">PERFEITO!</p>
                <p className="text-sm mobile-text-xs text-muted-foreground">Lacuna preenchida corretamente</p>
              </div>
            </div>
          )}

          {/* Feedback de Falha */}
          {feedbackState === "failure" && (
            <div className="flex items-center justify-center gap-3 mobile-gap-2 py-4 mobile-py-2 animate-fade-in">
              <XCircle className="w-12 h-12 mobile-w-8 mobile-h-8 text-red-500 animate-pulse" />
              <div>
                <p className="text-2xl mobile-text-lg font-bold text-red-500">
                  {failureReason === "timeout" ? "TEMPO ESGOTADO!" : "INCORRETO!"}
                </p>
                <p className="text-sm mobile-text-xs text-muted-foreground">
                  {failureReason === "timeout" ? "Você perdeu uma vida" : "Resposta errada! Perdeu uma vida"}
                </p>
              </div>
            </div>
          )}

          {/* Dica */}
          {feedbackState === "idle" && (
            <div className="text-xs mobile-text-xs text-muted-foreground text-center pt-2 mobile-pt-1 border-t border-border">
              💡 Digite apenas o texto que preenche as lacunas [___]
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
