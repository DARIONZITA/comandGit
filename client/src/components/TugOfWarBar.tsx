import { useEffect, useState } from 'react';
import { Trophy, Zap } from 'lucide-react';

interface TugOfWarBarProps {
  player1Username: string;
  player1Score: number;
  player2Username: string;
  player2Score: number;
  scoreLimit: number;
  currentUserId: string;
  player1Id: string;
}

export function TugOfWarBar({
  player1Username,
  player1Score,
  player2Username,
  player2Score,
  scoreLimit,
  currentUserId,
  player1Id,
}: TugOfWarBarProps) {
  const [prevScoreDiff, setPrevScoreDiff] = useState(0);
  const [flashSide, setFlashSide] = useState<'left' | 'right' | null>(null);

  // Diferença bruta (P1 - P2)
  const rawDifference = player1Score - player2Score;

  const isPlayer1 = currentUserId === player1Id;
  const myScore = isPlayer1 ? player1Score : player2Score;
  const opponentScore = isPlayer1 ? player2Score : player1Score;
  const myUsername = isPlayer1 ? player1Username : player2Username;
  const opponentUsername = isPlayer1 ? player2Username : player1Username;

  // Diferença do ponto de vista do jogador atual (sempre positiva quando você está na frente)
  // Se você for P1: myDifference = rawDifference; se for P2: invertido
  const myDifference = isPlayer1 ? rawDifference : -rawDifference;

  // Posição da barra relativa ao jogador atual
  // Convenção: quando VOCÊ está ganhando (myDifference > 0), a barra puxa para a ESQUERDA (seu lado)
  const barPosition = (-(myDifference) / (scoreLimit * 2)) * 100; // negativo puxa para a esquerda
  const clampedPosition = Math.max(-50, Math.min(50, barPosition));

  // Detectar mudanças na pontuação para animação de flash
  useEffect(() => {
    if (myDifference !== prevScoreDiff) {
      // Se a sua vantagem aumentou, destaca SEU lado (esquerda). Caso contrário, oponente (direita)
      if (myDifference > prevScoreDiff) {
        setFlashSide('left');
      } else {
        setFlashSide('right');
      }
      setPrevScoreDiff(myDifference);

      const timeout = setTimeout(() => setFlashSide(null), 500);
      return () => clearTimeout(timeout);
    }
  }, [myDifference, prevScoreDiff]);

  // Calcular cor da barra baseado na posição
  const getBarColor = () => {
    const normalizedPos = clampedPosition / 50; // -1 a 1, negativo = puxando pro seu lado (esquerda)
    
    if (normalizedPos < -0.5) return 'from-green-600 to-green-500'; // você bem à frente
    if (normalizedPos < -0.2) return 'from-lime-600 to-lime-500';
    if (normalizedPos > 0.5) return 'from-red-600 to-red-500'; // oponente bem à frente
    if (normalizedPos > 0.2) return 'from-orange-600 to-orange-500';
    return 'from-yellow-600 to-yellow-500'; // equilibrado
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Placar */}
      <div className="flex justify-between items-center mb-4 mobile-mb-2">
        {/* Jogador (Você) */}
        <div className={`flex items-center space-x-3 mobile-space-x-2 transition-all duration-300 ${
          flashSide === 'left' ? 'scale-110' : ''
        }`}>
          <div className="relative">
            <div className={`w-12 h-12 mobile-w-8 mobile-h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center font-bold text-white text-lg mobile-text-sm ${
              flashSide === 'left' ? 'ring-4 ring-green-400 animate-pulse' : ''
            }`}>
              {myUsername.charAt(0).toUpperCase()}
            </div>
            <Trophy className="w-4 h-4 mobile-w-3 mobile-h-3 text-yellow-400 absolute -top-1 -right-1" />
          </div>
          <div className="text-left mobile-hidden">
            <p className="font-bold text-white text-lg">{myUsername}</p>
            <p className="text-sm text-gray-400">(Você)</p>
          </div>
          <div className="text-3xl mobile-text-xl font-bold text-blue-400 ml-2 mobile-ml-1">
            {myScore}
          </div>
        </div>

        {/* VS */}
        <div className="flex flex-col items-center">
          <Zap className="w-8 h-8 mobile-w-5 mobile-h-5 text-yellow-400 animate-pulse" />
          <span className="text-xs mobile-text-xs text-gray-500 font-semibold">VS</span>
        </div>

        {/* Oponente */}
        <div className={`flex items-center space-x-3 mobile-space-x-2 transition-all duration-300 ${
          flashSide === 'right' ? 'scale-110' : ''
        }`}>
          <div className="text-3xl mobile-text-xl font-bold text-red-400 mr-2 mobile-mr-1">
            {opponentScore}
          </div>
          <div className="text-right mobile-hidden">
            <p className="font-bold text-white text-lg">{opponentUsername}</p>
            <p className="text-sm text-gray-400">(Oponente)</p>
          </div>
          <div className={`w-12 h-12 mobile-w-8 mobile-h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center font-bold text-white text-lg mobile-text-sm ${
            flashSide === 'right' ? 'ring-4 ring-green-400 animate-pulse' : ''
          }`}>
            {opponentUsername.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Barra de Cabo de Guerra */}
      <div className="relative h-16 mobile-h-10 bg-muted rounded-full overflow-hidden border-2 border-border">
        {/* Marcador central */}
        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-foreground/30 z-10 transform -translate-x-1/2"></div>
        
        {/* Barra de progresso */}
        <div
          className={`absolute top-0 bottom-0 left-1/2 transition-all duration-500 ease-out bg-gradient-to-r ${getBarColor()}`}
          style={{
            transform: `translateX(${clampedPosition}%)`,
            width: '50%',
          }}
        >
          {/* Efeito de brilho */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
        </div>

        {/* Indicador de posição */}
        <div
          className="absolute top-1/2 left-1/2 w-6 h-6 mobile-w-4 mobile-h-4 bg-white rounded-full border-4 mobile-border-2 border-yellow-400 shadow-lg z-20 transform -translate-y-1/2 transition-all duration-500 ease-out"
          style={{
            transform: `translateX(calc(${clampedPosition * 4}px - 50%)) translateY(-50%)`,
          }}
        >
          <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 animate-pulse"></div>
        </div>

        {/* Zonas de perigo */}
        <div className="absolute left-0 top-0 bottom-0 w-1/4 bg-red-500/20 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-1/4 bg-red-500/20 pointer-events-none"></div>
      </div>

      {/* Diferença de pontos */}
      <div className="text-center mt-3 mobile-mt-2">
        <p className="text-sm mobile-text-xs text-muted-foreground">
          Diferença (você): <span className={`font-bold ${
            myDifference > 0 ? 'text-green-400' : myDifference < 0 ? 'text-red-400' : 'text-foreground'
          }`}>
            {myDifference > 0 ? '+' : ''}{myDifference}
          </span> pontos
          <span className="ml-2 mobile-ml-1 text-muted-foreground/70">
            (Meta: ±{scoreLimit})
          </span>
        </p>
      </div>

      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
