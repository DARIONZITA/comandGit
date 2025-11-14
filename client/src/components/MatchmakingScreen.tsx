import { useEffect } from 'react';
import { Users, Swords, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

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
    <div className="min-h-screen flex flex-col items-center justify-center p-8 scan-lines mobile-padding mobile-scroll-smooth">
      <div className="max-w-2xl w-full space-y-8 mobile-space-y-6">
        {/* Ícone animado */}
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <Swords className="w-20 h-20 text-primary animate-pulse" />
          </div>
          <div className="absolute inset-0 pulse-circle">
            <div className="w-full h-full rounded-full border-4 border-primary opacity-20"></div>
          </div>
          <div className="absolute inset-4 pulse-circle">
            <div className="w-full h-full rounded-full border-4 border-primary opacity-30"></div>
          </div>
          <div className="absolute inset-8 pulse-circle">
            <div className="w-full h-full rounded-full border-4 border-primary opacity-40"></div>
          </div>
        </div>

        {/* Título */}
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-bold tracking-tight mobile-text-3xl">
            PROCURANDO
            <br />
            <span className="text-primary">OPONENTE</span>
          </h1>
          <p className="text-xl text-muted-foreground mobile-text-base">
            Preparando uma batalha épica...
          </p>
        </div>

        {/* Animação de loading */}
        <div className="flex items-center justify-center space-x-3 py-8">
          <Zap className="w-8 h-8 text-primary animate-pulse" />
          <span className="text-2xl font-bold font-mono mobile-text-xl">
            <span className="inline-block animate-pulse">.</span>
            <span className="inline-block animate-pulse animation-delay-200">.</span>
            <span className="inline-block animate-pulse animation-delay-400">.</span>
          </span>
        </div>

        {/* Card de informações */}
        <Card className="hover-elevate border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Users className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Sistema de Matchmaking Ativo</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="mobile-card-padding">
            <div className="space-y-3 text-sm mobile-text-sm">
              <div className="flex items-start space-x-3">
                <span className="text-primary font-bold">✓</span>
                <p className="text-left text-muted-foreground">Conectando com jogadores do mesmo nível</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-primary font-bold">✓</span>
                <p className="text-left text-muted-foreground">Desafios aleatórios preparados</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-primary font-bold">✓</span>
                <p className="text-left text-muted-foreground">Sistema de pontuação competitivo ativo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dica */}
        <Card className="border-2 border-primary/30 bg-primary/5">
          <CardContent className="pt-6 mobile-card-padding">
            <p className="text-sm text-center mobile-text-sm">
              💡 <strong>Dica:</strong> Prepare-se! A batalha começa assim que encontrarmos um oponente.
            </p>
          </CardContent>
        </Card>

        {/* Botão cancelar */}
        <Button
          onClick={onCancel}
          variant="outline"
          size="lg"
          className="w-full border-destructive/50 text-destructive hover:bg-destructive/10 mobile-btn-lg"
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
