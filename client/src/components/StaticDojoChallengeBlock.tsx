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
}

export default function StaticDojoChallengeBlock({ 
  challenge, 
  onTimeout, 
  isPaused,
  feedbackState = "idle",
  timeLimit,
  onCriticalTime
}: StaticDojoChallengeBlockProps) {
  const blankText = challenge.blanks?.[0]?.text || challenge.scenario;
  
  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] z-10">
      <Card 
        className={`p-8 shadow-2xl border-2 transition-all duration-300 ${
          feedbackState === "success" 
            ? "border-green-500 bg-green-500/20 scale-105 animate-success-pulse" 
            : feedbackState === "failure"
              ? "border-red-500 bg-red-500/20 animate-shake"
              : "border-blue-500/50 bg-blue-500/5"
        }`}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className={`w-6 h-6 ${
                feedbackState === "success" ? "text-green-500" : "text-blue-500"
              }`} />
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Dojo - Preencha a Lacuna
              </span>
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
            <p className="text-base text-muted-foreground mb-4">
              {challenge.scenario}
            </p>

            {/* Comando com Lacuna */}
            <div className="font-mono text-xl bg-muted/50 p-6 rounded-md border border-border">
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
                <p className="text-2xl font-bold text-green-500">PERFEITO!</p>
                <p className="text-sm text-muted-foreground">Lacuna preenchida corretamente</p>
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
              💡 Digite apenas o texto que preenche as lacunas [___]
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
