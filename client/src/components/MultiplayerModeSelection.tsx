import { Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface MultiplayerModeSelectionProps {
  onSelectRandom: () => void;
  onSelectInvite: () => void;
  onCancel: () => void;
}

export function MultiplayerModeSelection({
  onSelectRandom,
  onSelectInvite,
  onCancel,
}: MultiplayerModeSelectionProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 scan-lines mobile-padding mobile-scroll-smooth">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(6,182,212,0.1),transparent_50%)]" />
      
      <div className="max-w-4xl w-full space-y-8 relative z-10 mobile-space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-bold tracking-tight mobile-text-3xl">
            MODO
            <br />
            <span className="text-primary">MULTIPLAYER</span>
          </h1>
          <p className="text-xl text-muted-foreground mobile-text-base">
            Escolha como deseja jogar
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mobile-grid-cols-1 mobile-gap-4">
          {/* Modo Aleatório */}
          <Card 
            className="hover-elevate border-2 border-primary/40 bg-gray-900/80 backdrop-blur-md cursor-pointer group transition-all hover:border-primary hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
            onClick={onSelectRandom}
          >
            <CardContent className="pt-8 pb-8 text-center space-y-6 mobile-card-padding">
              <div className="w-24 h-24 mx-auto rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-all group-hover:scale-110 border-2 border-primary/40">
                <Zap className="w-12 h-12 text-primary drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
              </div>
              
              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-primary mobile-text-2xl">Aleatório</h2>
                <p className="text-muted-foreground text-sm leading-relaxed mobile-text-sm">
                  Encontre um oponente instantaneamente e comece a jogar. 
                  Sistema de matchmaking rápido e equilibrado.
                </p>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground pt-4 border-t border-primary/20">
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                  <span>Matchmaking automático</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                  <span>Início rápido</span>
                </div>
              </div>

              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectRandom();
                }}
                className="w-full py-6 text-lg font-bold bg-primary hover:bg-primary/90 mobile-btn-lg"
              >
                Jogar Agora
              </Button>
            </CardContent>
          </Card>

          {/* Modo Convidar */}
          <Card 
            className="hover-elevate border-2 border-cyan-500/40 bg-gray-900/80 backdrop-blur-md cursor-pointer group transition-all hover:border-cyan-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]"
            onClick={onSelectInvite}
          >
            <CardContent className="pt-8 pb-8 text-center space-y-6 mobile-card-padding">
              <div className="w-24 h-24 mx-auto rounded-full bg-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500/30 transition-all group-hover:scale-110 border-2 border-cyan-500/40">
                <Users className="w-12 h-12 text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
              </div>
              
              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-cyan-400 mobile-text-2xl">Convidar</h2>
                <p className="text-muted-foreground text-sm leading-relaxed mobile-text-sm">
                  Desafie um amigo específico para uma partida privada. 
                  Pesquise por nome de usuário ou email.
                </p>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground pt-4 border-t border-cyan-500/20">
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                  <span>Partida privada</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                  <span>Escolha seu oponente</span>
                </div>
              </div>

              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectInvite();
                }}
                className="w-full py-6 text-lg font-bold bg-cyan-500 hover:bg-cyan-600 text-white mobile-btn-lg"
              >
                Buscar Jogador
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button
            onClick={onCancel}
            variant="outline"
            size="lg"
            className="border-primary/50 hover:bg-primary/10 hover:border-primary text-primary mobile-btn-lg mobile-w-full"
          >
            Voltar ao Menu
          </Button>
        </div>
      </div>
    </div>
  );
}
