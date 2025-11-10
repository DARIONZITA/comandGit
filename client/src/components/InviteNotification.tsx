import { useEffect } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MultiplayerInvite } from '@/hooks/useMultiplayerInvite';
import { useToast } from '@/hooks/use-toast';

interface InviteNotificationProps {
  invites: MultiplayerInvite[];
  onAccept: (inviteId: string) => Promise<void>;
  onReject: (inviteId: string) => Promise<void>;
}

export function InviteNotification({
  invites,
  onAccept,
  onReject,
}: InviteNotificationProps) {
  const { toast } = useToast();

  // Notificar quando receber um novo convite
  useEffect(() => {
    if (invites.length > 0) {
      const latestInvite = invites[0];
      toast({
        title: "🎮 Novo Convite!",
        description: `${latestInvite.sender_username} te desafiou para uma partida!`,
        duration: 10000,
      });
    }
  }, [invites.length, toast]);

  if (invites.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
      {invites.map((invite) => (
        <Card 
          key={invite.id}
          className="border-2 border-cyan-500/50 bg-gray-900/95 backdrop-blur-md shadow-[0_0_30px_rgba(6,182,212,0.5)] animate-in slide-in-from-right"
        >
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 border-2 border-cyan-500/40">
                <Bell className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white mb-1">
                  Convite de Partida
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  <span className="text-cyan-400 font-semibold">{invite.sender_username}</span> te desafiou para uma partida!
                </p>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => onAccept(invite.id)}
                    size="sm"
                    className="flex-1 bg-primary hover:bg-primary/90 text-white"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Aceitar
                  </Button>
                  <Button
                    onClick={() => onReject(invite.id)}
                    size="sm"
                    variant="outline"
                    className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Recusar
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Expira em {Math.max(0, Math.floor((new Date(invite.expires_at).getTime() - Date.now()) / 1000 / 60))} min
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
