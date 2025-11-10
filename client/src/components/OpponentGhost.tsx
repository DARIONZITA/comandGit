import { useEffect, useState } from 'react';
import { Ghost, CheckCircle2, XCircle } from 'lucide-react';

interface OpponentGhostProps {
  opponentUsername: string;
  isTyping: boolean;
  lastSubmitResult?: 'correct' | 'wrong' | null;
}

export function OpponentGhost({
  opponentUsername,
  isTyping,
  lastSubmitResult,
}: OpponentGhostProps) {
  const [typingIndicator, setTypingIndicator] = useState('');
  const [flashColor, setFlashColor] = useState<'green' | 'red' | null>(null);

  // Animação do indicador de digitação
  useEffect(() => {
    if (isTyping) {
      const interval = setInterval(() => {
        setTypingIndicator(prev => {
          if (prev.length >= 20) return '*';
          return prev + '*';
        });
      }, 100);

      return () => clearInterval(interval);
    } else {
      setTypingIndicator('');
    }
  }, [isTyping]);

  // Animação de flash quando submeter resposta
  useEffect(() => {
    if (lastSubmitResult) {
      setFlashColor(lastSubmitResult === 'correct' ? 'green' : 'red');
      
      const timeout = setTimeout(() => {
        setFlashColor(null);
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [lastSubmitResult]);

  const getFlashClass = () => {
    if (flashColor === 'green') {
      return 'bg-green-500/30 border-green-400 animate-flash-green';
    }
    if (flashColor === 'red') {
      return 'bg-red-500/30 border-red-400 animate-flash-red';
    }
    return 'bg-gray-800/50 border-gray-700';
  };

  return (
    <div className="w-full">
      {/* Cabeçalho */}
      <div className="flex items-center space-x-2 mb-2">
        <Ghost className="w-5 h-5 text-purple-400" />
        <span className="text-sm font-semibold text-gray-300">
          {opponentUsername} está digitando...
        </span>
      </div>

      {/* Terminal fantasma */}
      <div
        className={`relative min-h-[60px] rounded-lg border-2 transition-all duration-300 ${getFlashClass()}`}
      >
        {/* Conteúdo do terminal */}
        <div className="p-4 font-mono text-sm">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-green-400">$</span>
            <span className="text-gray-500">git</span>
          </div>
          
          {/* Indicador de digitação */}
          <div className="min-h-[24px]">
            {isTyping ? (
              <span className="text-purple-400 opacity-70 animate-pulse">
                {typingIndicator}
              </span>
            ) : (
              <span className="text-gray-600 italic">aguardando...</span>
            )}
          </div>
        </div>

        {/* Ícone de resultado */}
        {flashColor && (
          <div className="absolute top-1/2 right-4 transform -translate-y-1/2">
            {flashColor === 'green' ? (
              <CheckCircle2 className="w-8 h-8 text-green-400 animate-bounce" />
            ) : (
              <XCircle className="w-8 h-8 text-red-400 animate-bounce" />
            )}
          </div>
        )}

        {/* Efeito de scan line */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
          <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent animate-scan-line"></div>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
        <span>
          {isTyping ? '⚡ Digitando rapidamente...' : '💤 Pensando...'}
        </span>
        {lastSubmitResult && (
          <span className={`font-semibold ${
            lastSubmitResult === 'correct' ? 'text-green-400' : 'text-red-400'
          }`}>
            {lastSubmitResult === 'correct' ? '✓ Acertou!' : '✗ Errou!'}
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
