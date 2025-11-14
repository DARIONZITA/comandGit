import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface OpponentGhostProps {
  opponentUsername: string;
  inputLength: number;
  lastSubmission: {
    result: 'correct' | 'wrong';
    timestamp: number;
  } | null;
}

export function OpponentGhost({
  opponentUsername,
  inputLength,
  lastSubmission,
}: OpponentGhostProps) {
  const [displayLength, setDisplayLength] = useState(0);
  const [flashColor, setFlashColor] = useState<'green' | 'red' | null>(null);

  // Atualizar comprimento do input
  useEffect(() => {
    setDisplayLength(inputLength);
  }, [inputLength]);

  // Animação de flash quando submeter resposta
  useEffect(() => {
    if (lastSubmission) {
      setFlashColor(lastSubmission.result === 'correct' ? 'green' : 'red');
      setDisplayLength(0); // Limpa os asteriscos na submissão
      
      const timeout = setTimeout(() => {
        setFlashColor(null);
      }, 700);

      return () => clearTimeout(timeout);
    }
  }, [lastSubmission]);

  const asterisks = '*'.repeat(displayLength);

  const getFlashClass = () => {
    if (flashColor === 'green') {
      return 'bg-green-500/30 border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.5)] animate-flash-green';
    }
    if (flashColor === 'red') {
      return 'bg-red-500/30 border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-flash-red';
    }
    return 'bg-muted/50 border-border';
  };

  return (
    <div className="w-full">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-muted-foreground">
          Atividade de {opponentUsername}
        </span>
        {displayLength > 0 && (
          <span className="text-xs text-red-400 font-mono">
            {displayLength} chars
          </span>
        )}
      </div>

      {/* Terminal fantasma */}
      <div
        className={`relative min-h-[80px] rounded-lg border-2 transition-all duration-300 ${getFlashClass()}`}
      >
        {/* Conteúdo do terminal */}
        <div className="p-4 font-mono text-sm">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-primary">$</span>
            <span className="text-muted-foreground">git</span>
          </div>
          
          {/* Indicador de digitação com asteriscos */}
          <div className="min-h-[24px] flex items-center">
            {displayLength > 0 ? (
              <div className="flex items-center gap-1">
                <span className="text-red-400 tracking-wider break-all">
                  {asterisks}
                </span>
                <span className="text-red-400 animate-pulse">|</span>
              </div>
            ) : (
              <span className="text-muted-foreground italic text-xs">aguardando...</span>
            )}
          </div>
        </div>

        {/* Ícone de resultado */}
        {flashColor && (
          <div className="absolute top-1/2 right-4 transform -translate-y-1/2 animate-bounce">
            {flashColor === 'green' ? (
              <CheckCircle2 className="w-8 h-8 text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
            ) : (
              <XCircle className="w-8 h-8 text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            )}
          </div>
        )}

        {/* Efeito de scan line */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
          <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-red-500/20 to-transparent animate-scan-line"></div>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
        <span>
          {displayLength > 0 ? '⚡ Digitando rapidamente...' : '💤 Pensando...'}
        </span>
        {lastSubmission && (
          <span className={`font-semibold ${
            lastSubmission.result === 'correct' ? 'text-green-400' : 'text-red-400'
          }`}>
            {lastSubmission.result === 'correct' ? '✓ Acertou!' : '✗ Errou!'}
          </span>
        )}
      </div>

      <style>{`
        @keyframes flash-green {
          0%, 100% { 
            background-color: rgba(34, 197, 94, 0.1);
            border-color: rgba(34, 197, 94, 0.5);
          }
          50% { 
            background-color: rgba(34, 197, 94, 0.3);
            border-color: rgba(34, 197, 94, 1);
          }
        }
        
        @keyframes flash-red {
          0%, 100% { 
            background-color: rgba(239, 68, 68, 0.1);
            border-color: rgba(239, 68, 68, 0.5);
          }
          50% { 
            background-color: rgba(239, 68, 68, 0.3);
            border-color: rgba(239, 68, 68, 1);
          }
        }

        @keyframes scan-line {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(1000%);
          }
        }
        
        .animate-flash-green {
          animation: flash-green 0.5s ease-in-out 2;
        }
        
        .animate-flash-red {
          animation: flash-red 0.5s ease-in-out 2;
        }

        .animate-scan-line {
          animation: scan-line 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
