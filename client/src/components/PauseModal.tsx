import { Play, Home, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PauseModalProps {
  onResume: () => void;
  onMainMenu: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export default function PauseModal({ onResume, onMainMenu, isMuted, onToggleMute }: PauseModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 mobile-padding z-50">
      <Card className="max-w-md w-full mobile-modal-full" data-testid="card-pause">
        <CardHeader className="text-center mobile-card-padding">
          <CardTitle className="text-3xl mobile-text-2xl">PAUSADO</CardTitle>
          <CardDescription className="mobile-text-base">O jogo está pausado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 mobile-space-y-3 mobile-card-padding">
          <Button 
            variant="default" 
            onClick={onResume} 
            className="w-full mobile-btn-lg"
            data-testid="button-resume"
          >
            <Play className="w-4 h-4 mr-2" />
            CONTINUAR
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onToggleMute} 
            className="w-full mobile-btn-lg"
            data-testid="button-toggle-sound"
          >
            {isMuted ? (
              <>
                <Volume2 className="w-4 h-4 mr-2" />
                ATIVAR SOM
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 mr-2" />
                SILENCIAR
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onMainMenu} 
            className="w-full mobile-btn-lg"
            data-testid="button-quit"
          >
            <Home className="w-4 h-4 mr-2" />
            MENU PRINCIPAL
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
