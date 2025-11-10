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

  const scoreDifference = player1Score - player2Score;
  const barPosition = (scoreDifference / (scoreLimit * 2)) * 100;
  const clampedPosition = Math.max(-50, Math.min(50, barPosition));

  const isPlayer1 = currentUserId === player1Id;
  const myScore = isPlayer1 ? player1Score : player2Score;
  const opponentScore = isPlayer1 ? player2Score : player1Score;
  const myUsername = isPlayer1 ? player1Username : player2Username;
  const opponentUsername = isPlayer1 ? player2Username : player1Username;

  // Detectar mudanças na pontuação para animação de flash
  useEffect(() => {
    if (scoreDifference !== prevScoreDiff) {
      if (scoreDifference > prevScoreDiff) {
        setFlashSide('left');
      } else {
        setFlashSide('right');
      }
      setPrevScoreDiff(scoreDifference);

      const timeout = setTimeout(() => setFlashSide(null), 500);
      return () => clearTimeout(timeout);
    }
  }, [scoreDifference, prevScoreDiff]);

  // Calcular cor da barra baseado na posição
  const getBarColor = () => {
    const normalizedPos = clampedPosition / 50; // -1 a 1
    
    if (normalizedPos < -0.5) return 'from-red-600 to-red-500';
    if (normalizedPos < -0.2) return 'from-orange-600 to-orange-500';
    if (normalizedPos > 0.5) return 'from-green-600 to-green-500';
    if (normalizedPos > 0.2) return 'from-lime-600 to-lime-500';
    return 'from-yellow-600 to-yellow-500';
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Placar */}
      <div className="flex justify-between items-center mb-4">
        {/* Jogador (Você) */}
        <div className={`flex items-center space-x-3 transition-all duration-300 ${
          flashSide === 'left' ? 'scale-110' : ''
        }`}>
          <div className="relative">
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center font-bold text-white text-lg ${
              flashSide === 'left' ? 'ring-4 ring-green-400 animate-pulse' : ''
            }`}>
              {myUsername.charAt(0).toUpperCase()}
            </div>
            <Trophy className="w-4 h-4 text-yellow-400 absolute -top-1 -right-1" />
          </div>
          <div className="text-left">
            <p className="font-bold text-white text-lg">{myUsername}</p>
            <p className="text-sm text-gray-400">(Você)</p>
          </div>
          <div className="text-3xl font-bold text-blue-400 ml-2">
            {myScore}
          </div>
        </div>

        {/* VS */}
        <div className="flex flex-col items-center">
          <Zap className="w-8 h-8 text-yellow-400 animate-pulse" />
          <span className="text-xs text-gray-500 font-semibold">VS</span>
        </div>

        {/* Oponente */}
        <div className={`flex items-center space-x-3 transition-all duration-300 ${
          flashSide === 'right' ? 'scale-110' : ''
        }`}>
          <div className="text-3xl font-bold text-red-400 mr-2">
            {opponentScore}
          </div>
          <div className="text-right">
            <p className="font-bold text-white text-lg">{opponentUsername}</p>
            <p className="text-sm text-gray-400">(Oponente)</p>
          </div>
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center font-bold text-white text-lg ${
            flashSide === 'right' ? 'ring-4 ring-green-400 animate-pulse' : ''
          }`}>
            {opponentUsername.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Barra de Cabo de Guerra */}
      <div className="relative h-16 bg-gray-800 rounded-full overflow-hidden border-2 border-gray-700">
        {/* Marcador central */}
        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-white/30 z-10 transform -translate-x-1/2"></div>
        
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
          className="absolute top-1/2 left-1/2 w-6 h-6 bg-white rounded-full border-4 border-yellow-400 shadow-lg z-20 transform -translate-y-1/2 transition-all duration-500 ease-out"
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
      <div className="text-center mt-3">
        <p className="text-sm text-gray-400">
          Diferença: <span className={`font-bold ${
            scoreDifference > 0 ? 'text-green-400' : scoreDifference < 0 ? 'text-red-400' : 'text-gray-300'
          }`}>
            {scoreDifference > 0 ? '+' : ''}{scoreDifference}
          </span> pontos
          <span className="ml-2 text-gray-500">
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
