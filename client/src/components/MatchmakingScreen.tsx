import { useEffect } from 'react';
import { Loader2, Users, Swords } from 'lucide-react';
import { Button } from './ui/button';

interface MatchmakingScreenProps {
  isSearching: boolean;
  onCancel: () => void;
}

export function MatchmakingScreen({ isSearching, onCancel }: MatchmakingScreenProps) {
  useEffect(() => {
    // Efeito de animação de pulso
    const interval = setInterval(() => {
      const circles = document.querySelectorAll('.pulse-circle');
      circles.forEach((circle, index) => {
        setTimeout(() => {
          circle.classList.add('animate-ping');
          setTimeout(() => {
            circle.classList.remove('animate-ping');
          }, 1000);
        }, index * 200);
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Ícone animado */}
        <div className="relative w-32 h-32 mx-auto">
          <div className="absolute inset-0 flex items-center justify-center">
            <Swords className="w-16 h-16 text-yellow-400 animate-pulse" />
          </div>
          <div className="absolute inset-0 pulse-circle">
            <div className="w-full h-full rounded-full border-4 border-yellow-400 opacity-20"></div>
          </div>
          <div className="absolute inset-4 pulse-circle">
            <div className="w-full h-full rounded-full border-4 border-yellow-400 opacity-30"></div>
          </div>
          <div className="absolute inset-8 pulse-circle">
            <div className="w-full h-full rounded-full border-4 border-yellow-400 opacity-40"></div>
          </div>
        </div>

        {/* Título */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            Procurando Oponente
          </h1>
          <p className="text-gray-400 text-lg">
            Preparando uma batalha épica...
          </p>
        </div>

        {/* Animação de loading */}
        <div className="flex items-center justify-center space-x-2 py-8">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
          <span className="text-xl font-semibold">
            <span className="inline-block animate-pulse">.</span>
            <span className="inline-block animate-pulse animation-delay-200">.</span>
            <span className="inline-block animate-pulse animation-delay-400">.</span>
          </span>
        </div>

        {/* Informações */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Users className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-gray-300">Sistema de Matchmaking Ativo</span>
          </div>
          
          <div className="space-y-3 text-sm text-gray-400">
            <div className="flex items-start space-x-2">
              <span className="text-green-400">✓</span>
              <p className="text-left">Conectando com jogadores do mesmo nível</p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-green-400">✓</span>
              <p className="text-left">Desafios aleatórios preparados</p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-green-400">✓</span>
              <p className="text-left">Sistema de pontuação competitivo ativo</p>
            </div>
          </div>
        </div>

        {/* Dica */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <p className="text-sm text-yellow-200">
            💡 <strong>Dica:</strong> Prepare-se! A batalha começa assim que encontrarmos um oponente.
          </p>
        </div>

        {/* Botão cancelar */}
        <Button
          onClick={onCancel}
          variant="outline"
          className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
        >
          Cancelar Busca
        </Button>
      </div>

      <style>{`
        .animation-delay-200 {
          animation-delay: 200ms;
        }
        .animation-delay-400 {
          animation-delay: 400ms;
        }
      `}</style>
    </div>
  );
}
