import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { useMultiplayerInvite } from '@/hooks/useMultiplayerInvite';
import { MatchmakingScreen } from '@/components/MatchmakingScreen';
import { MultiplayerModeSelection } from '@/components/MultiplayerModeSelection';
import { InvitePlayerSearch } from '@/components/InvitePlayerSearch';
import { InviteNotification } from '@/components/InviteNotification';
import { TugOfWarBar } from '@/components/TugOfWarBar';
import { OpponentGhost } from '@/components/OpponentGhost';
import CommandInput from '@/components/CommandInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Clock, Zap, Home, User, Sword, GitBranch, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useGameSounds } from '@/hooks/useGameSounds';

export default function Multiplayer() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Estado do modo de jogo
  const [gameMode, setGameMode] = useState<'select' | 'random' | 'invite'>('select');
  
  // Hook de multiplayer aleatório
  const {
    isSearching,
    matchState,
    challenges,
    opponentActivity,
    timeRemaining,
    joinQueue,
    leaveQueue,
    setReady,
    changeOpponent,
    // novo: cancelar match finalizando conexão
    cancelMatch,
    sendTypingEvent,
    submitAnswer,
  } = useMultiplayer();

  // Sons do jogo (digitação, feedback)
  const sounds = useGameSounds();

  // Hook de convites
  const {
    searchResults,
    isSearching: isSearchingUsers,
    sentInvite,
    receivedInvites,
    isWaitingForResponse,
    searchUsers,
    sendInvite,
    acceptInvite,
    rejectInvite,
    cancelInvite,
  } = useMultiplayerInvite();

  const [isReady, setIsReady] = useState(false);
  const [lastOpponentResult, setLastOpponentResult] = useState<'correct' | 'wrong' | null>(null);
  const [inputKey, setInputKey] = useState(0); // Para resetar o CommandInput

  // Redirecionar se não estiver autenticado
  useEffect(() => {
    if (!user) {
      setLocation('/login');
    }
  }, [user, setLocation]);

  // Iniciar busca automaticamente apenas no modo aleatório
  useEffect(() => {
    if (user && !isSearching && !matchState && gameMode === 'random') {
      joinQueue();
    }
  }, [user, isSearching, matchState, gameMode, joinQueue]);

  // Atualizar resultado do oponente quando a pontuação mudar
  useEffect(() => {
    if (matchState && matchState.status === 'active') {
      const isPlayer1 = matchState.player1.id === user?.id;
      const opponentScore = isPlayer1 ? matchState.player2.score : matchState.player1.score;
      
      // Detectar quando o oponente marca ponto (acertou ou você errou)
      // Isso é uma aproximação; idealmente viria do evento
      setLastOpponentResult(null);
    }
  }, [matchState, user]);

  // Quando o convite for aceito (remetente), mudar para modo random
  useEffect(() => {
    if (sentInvite?.status === 'accepted' && gameMode === 'invite') {
      console.log('[Multiplayer] Convite aceito! Mudando para modo random');
      setGameMode('random');
    }
  }, [sentInvite?.status, gameMode]);

  const handleCancel = () => {
    leaveQueue();
    setGameMode('select');
  };

  const handleCancelToMenu = () => {
    leaveQueue();
    setLocation('/');
  };

  // Handlers de convites
  const handleSelectUser = async (selectedUser: any) => {
    try {
      await sendInvite(selectedUser.user_id, selectedUser.username);
      toast({
        title: "Convite Enviado!",
        description: `Aguardando resposta de ${selectedUser.username}`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao enviar convite",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const handleAcceptInvite = async (inviteId: string) => {
    try {
      const matchId = await acceptInvite(inviteId);
      toast({
        title: "Convite Aceito!",
        description: "Preparando partida...",
      });
      // Mudar para modo "random" para garantir que o fluxo de match funcione
      setGameMode('random');
      // O useMultiplayer detectará a nova match via listener global
    } catch (error: any) {
      toast({
        title: "Erro ao aceitar convite",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const handleRejectInvite = async (inviteId: string) => {
    try {
      await rejectInvite(inviteId);
      toast({
        title: "Convite Recusado",
        description: "O jogador será notificado",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao recusar convite",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const handleCancelInvite = async () => {
    if (!sentInvite) return;
    try {
      await cancelInvite(sentInvite.id);
      toast({
        title: "Convite Cancelado",
        description: "Você pode buscar outro jogador",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao cancelar convite",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const handleReady = () => {
    setIsReady(true);
    setReady();
    
    toast({
      title: "Pronto!",
      description: "Aguardando seu oponente...",
    });
  };

  const handleSubmit = async (command: string) => {
    if (!matchState || matchState.status !== 'active') return;

    const result = await submitAnswer(command);
    
    if (result.correct) {
      toast({
        title: "✓ Correto!",
        description: `+1 ponto! Continue assim!`,
        variant: "default",
      });
      setInputKey(prev => prev + 1); // Resetar input
    } else {
      toast({
        title: "✗ Incorreto",
        description: "Seu oponente ganhou +1 ponto. Tente novamente!",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (value: string) => {
    sendTypingEvent(value.length);
  };

  const getCurrentChallenge = () => {
    if (!matchState || !challenges.length) return null;
    
    const isPlayer1 = matchState.player1.id === user?.id;
    const currentChallengeIndex = isPlayer1 
      ? matchState.player1.currentChallenge 
      : matchState.player2.currentChallenge;

    return challenges[currentChallengeIndex];
  };

  const formattedTime = useMemo(() => {
    const mins = Math.floor(timeRemaining / 60);
    const secs = timeRemaining % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, [timeRemaining]);

  // Calcula o desafio atual SEM usar hooks condicionais (evita erro de ordem de hooks)
  const currentChallenge = useMemo(() => getCurrentChallenge(), [matchState, challenges, user]);

  // RENDERIZAÇÃO: Seleção de modo
  if (gameMode === 'select' && !matchState) {
    return (
      <>
        <InviteNotification
          invites={receivedInvites}
          onAccept={handleAcceptInvite}
          onReject={handleRejectInvite}
        />
        <MultiplayerModeSelection
          onSelectRandom={() => setGameMode('random')}
          onSelectInvite={() => setGameMode('invite')}
          onCancel={handleCancelToMenu}
        />
      </>
    );
  }

  // RENDERIZAÇÃO: Modo Convite (busca de jogador)
  if (gameMode === 'invite' && !matchState) {
    return (
      <>
        <InviteNotification
          invites={receivedInvites}
          onAccept={handleAcceptInvite}
          onReject={handleRejectInvite}
        />
        <InvitePlayerSearch
          searchResults={searchResults}
          isSearching={isSearchingUsers}
          isWaitingForResponse={isWaitingForResponse}
          sentInviteUsername={sentInvite?.receiver_username}
          onSearch={searchUsers}
          onSelectUser={handleSelectUser}
          onCancelInvite={handleCancelInvite}
          onBack={() => setGameMode('select')}
        />
      </>
    );
  }

  // Tela de matchmaking (modo aleatório)
  if (isSearching || (!matchState && gameMode === 'random')) {
    return (
      <>
        <InviteNotification
          invites={receivedInvites}
          onAccept={handleAcceptInvite}
          onReject={handleRejectInvite}
        />
        <MatchmakingScreen isSearching={isSearching} onCancel={handleCancel} />
      </>
    );
  }

  // Se o oponente saiu (finish/opponent_left) e este cliente não é o winner, voltar para matchmaking
  if (
    matchState &&
    matchState.status === 'finished' &&
    matchState.winnerReason === 'opponent_left' &&
    matchState.winnerId !== user?.id
  ) {
    // O hook já tenta reentrar na fila; aqui garantimos UI consistente
    return (
      <>
        <InviteNotification
          invites={receivedInvites}
          onAccept={handleAcceptInvite}
          onReject={handleRejectInvite}
        />
        <MatchmakingScreen isSearching={true} onCancel={handleCancel} />
      </>
    );
  }

  // Tela de espera (ambos prontos)
  if (matchState && matchState.status === 'waiting') {
    const isPlayer1 = matchState.player1.id === user?.id;
    const myReadyStatus = isPlayer1 ? matchState.player1.isReady : matchState.player2.isReady;
    const opponentReadyStatus = isPlayer1 ? matchState.player2.isReady : matchState.player1.isReady;
    const opponentUsername = isPlayer1 ? matchState.player2.username : matchState.player1.username;
    const myUsername = isPlayer1 ? matchState.player1.username : matchState.player2.username;

    const handleCancelMatch = async () => {
      await cancelMatch(); // finaliza a match para liberar o oponente
      setLocation('/'); // vai para o menu
    };

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 scan-lines">
        <InviteNotification
          invites={receivedInvites}
          onAccept={handleAcceptInvite}
          onReject={handleRejectInvite}
        />
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center space-y-4">
            <Trophy className="w-24 h-24 text-primary mx-auto mb-4 animate-bounce" />
            <h1 className="text-6xl font-bold tracking-tight">
              OPONENTE
              <br />
              <span className="text-primary">ENCONTRADO!</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Você vai enfrentar <span className="text-primary font-bold">{opponentUsername}</span>
            </p>
          </div>

          <Card className="hover-elevate border-2 border-primary/20">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-card">
                  <span className="text-lg font-semibold">Você</span>
                  {myReadyStatus ? (
                    <span className="text-primary font-bold flex items-center gap-2">
                      <span className="w-3 h-3 bg-primary rounded-full animate-pulse"></span>
                      Pronto
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Aguardando...</span>
                  )}
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-card">
                  <span className="text-lg font-semibold">{opponentUsername}</span>
                  {opponentReadyStatus ? (
                    <span className="text-primary font-bold flex items-center gap-2">
                      <span className="w-3 h-3 bg-primary rounded-full animate-pulse"></span>
                      Pronto
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Aguardando...</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {!myReadyStatus ? (
            <div className="space-y-3">
              <Button
                onClick={handleReady}
                size="lg"
                className="w-full py-6 text-xl font-bold"
              >
                Estou Pronto!
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={changeOpponent}
                  variant="outline"
                  size="lg"
                  className="w-full border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10"
                >
                  Trocar Oponente
                </Button>
                <Button
                  onClick={handleCancelMatch}
                  variant="outline"
                  size="lg"
                  className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Card className="border-2 border-primary/30 bg-primary/5">
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    ⏳ Aguardando <strong>{opponentUsername}</strong> ficar pronto...
                  </p>
                </CardContent>
              </Card>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={changeOpponent}
                  variant="outline"
                  size="lg"
                  className="w-full border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10"
                >
                  Trocar Oponente
                </Button>
                <Button
                  onClick={handleCancelMatch}
                  variant="outline"
                  size="lg"
                  className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Util helpers para tema
  const gradientTitle = 'bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent';
  const panelClass = 'relative rounded-xl border border-emerald-600/40 bg-neutral-900/70 backdrop-blur-md shadow-[0_0_0_1px_rgba(0,255,170,0.15),0_0_20px_-5px_rgba(0,255,170,0.4)] overflow-hidden';
  const panelHeaderClass = 'px-4 py-2 flex items-center gap-2 text-xs tracking-wide uppercase font-semibold text-emerald-300 bg-gradient-to-r from-emerald-900/60 to-teal-900/30 border-b border-emerald-700/40';
  const scrollAreaClass = 'custom-scrollbar overflow-y-auto pr-2';

  // (mantido acima para não quebrar a ordem de hooks)

  // Tela de jogo ativo
  if (matchState && matchState.status === 'active') {
    const isPlayer1 = matchState.player1.id === user?.id;
    const opponentUsername = isPlayer1 ? matchState.player2.username : matchState.player1.username;

    if (!currentChallenge) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
          <div className="text-center">
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold">Carregando desafios...</h2>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen w-full bg-black text-white relative overflow-hidden scan-lines">
        <InviteNotification
          invites={receivedInvites}
          onAccept={handleAcceptInvite}
          onReject={handleRejectInvite}
        />
        {/* Background tema escuro neon */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(6,182,212,0.1),transparent_50%)]" />
        
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 space-y-4 relative z-10">
          {/* HEADER */}
          <div className="flex items-center justify-between gap-3 bg-gray-900/80 backdrop-blur-md rounded-lg px-4 py-3 border border-primary/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <div className="flex items-center gap-3">
              <Clock className={`w-6 h-6 ${timeRemaining <= 30 ? 'text-red-400 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'text-primary drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]'}`} />
              <span className={`text-2xl sm:text-3xl font-bold font-mono ${timeRemaining <= 30 ? 'text-red-400' : 'text-primary'}`}>
                {formattedTime}
              </span>
            </div>
            
            <div className="hidden sm:flex items-center gap-2 text-xs text-primary/90 uppercase tracking-widest font-semibold">
              <Zap className="w-4 h-4" /> Modo Multiplayer
            </div>
            
            <Button 
              onClick={async () => { await cancelMatch(); setLocation('/'); }} 
              variant="outline" 
              size="sm" 
              className="border-primary/50 hover:bg-primary/10 hover:border-primary text-primary"
            >
              <Home className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>

          {/* BARRA DE CABO DE GUERRA */}
          <TugOfWarBar
            player1Username={matchState.player1.username}
            player1Score={matchState.player1.score}
            player2Username={matchState.player2.username}
            player2Score={matchState.player2.score}
            scoreLimit={matchState.scoreLimit}
            currentUserId={user?.id || ''}
            player1Id={matchState.player1.id}
          />

          {/* GRID PRINCIPAL: Desafio (70%) + Oponente (30%) */}
          <div className="grid lg:grid-cols-10 gap-4">
            {/* PAINEL DO DESAFIO */}
            <div className="lg:col-span-7">
              <div className="bg-gray-900/90 backdrop-blur-md rounded-xl border-2 border-primary/40 shadow-[0_0_20px_rgba(16,185,129,0.3)] overflow-hidden hover-elevate min-h-[400px] flex flex-col">
                <div className="px-4 py-3 bg-gradient-to-r from-primary/20 to-cyan-500/20 border-b border-primary/40 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest">
                    <GitBranch className="w-5 h-5" />
                    {currentChallenge.compositeId ? (
                      <span>Desafio Composto: Passo {currentChallenge.stepNumber}/{currentChallenge.totalSteps}</span>
                    ) : (
                      <span>Seu Desafio</span>
                    )}
                  </div>
                  <span className="text-xs text-primary/70 font-mono bg-black/30 px-2 py-1 rounded">
                    #{(isPlayer1 ? matchState.player1.currentChallenge : matchState.player2.currentChallenge) + 1}
                  </span>
                </div>
                
                <div className="p-8 space-y-8 flex-1 flex flex-col justify-center">
                  <div className="space-y-4">
                    {currentChallenge.compositeId && (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-500/20 border border-cyan-500/40 rounded-lg text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
                        <div className="flex gap-1">
                          {Array.from({ length: currentChallenge.totalSteps || 0 }).map((_, i) => (
                            <div 
                              key={i} 
                              className={`w-2 h-2 rounded-full ${
                                i < (currentChallenge.stepNumber || 0) 
                                  ? 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]' 
                                  : 'bg-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span>Passo {currentChallenge.stepNumber} de {currentChallenge.totalSteps}</span>
                      </div>
                    )}
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary leading-relaxed break-words drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                      {currentChallenge.question}
                    </h2>
                    <div className="w-full h-px bg-gradient-to-r from-primary/60 via-primary/30 to-transparent"></div>
                  </div>
                  
                  <div className="space-y-3 mt-auto">
                    <CommandInput
                      key={inputKey}
                      onSubmit={handleSubmit}
                      onInputChange={handleInputChange}
                      disabled={false}
                      sounds={sounds}
                    />
                    <p className="text-xs text-gray-400 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" />
                      Pressione <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-primary text-xs font-mono">Enter</kbd> para submeter
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* PAINEL LATERAL COMPACTO: Oponente + Stats */}
            <div className="lg:col-span-3 space-y-3">
              {/* Card Oponente */}
              <div className="bg-gray-900/90 backdrop-blur-md rounded-xl border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)] overflow-hidden">
                <div className="px-3 py-2 bg-red-900/30 border-b border-red-700/50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-red-400 font-bold text-xs uppercase">
                    <Sword className="w-4 h-4" />
                    Oponente
                  </div>
                  <div className="flex items-center gap-1 text-xs text-red-300 font-medium">
                    <User className="w-3 h-3" />
                    {opponentUsername}
                  </div>
                </div>
                
                <div className="p-3">
                  <OpponentGhost
                    opponentUsername={opponentUsername}
                    inputLength={opponentActivity.inputLength}
                    lastSubmission={opponentActivity.lastSubmission}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="bg-gray-900/80 backdrop-blur-md rounded-xl border border-cyan-500/40 p-3 space-y-2.5">
                <h3 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Trophy className="w-3 h-3" /> Estatísticas
                </h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1.5 px-2 bg-primary/10 rounded border-l-2 border-primary">
                    <span className="text-xs text-gray-300">Seu progresso:</span>
                    <span className="text-sm font-bold text-primary font-mono">
                      Desafio {(isPlayer1 ? matchState.player1.currentChallenge : matchState.player2.currentChallenge) + 1}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1.5 px-2 bg-red-500/10 rounded border-l-2 border-red-500">
                    <span className="text-xs text-gray-300">Progresso oponente:</span>
                    <span className="text-sm font-bold text-red-400 font-mono">
                      Desafio {(isPlayer1 ? matchState.player2.currentChallenge : matchState.player1.currentChallenge) + 1}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-gray-700/50 text-center">
                    <p className="text-[10px] text-gray-400">
                      Diferença: <span className="font-bold text-yellow-400">{Math.abs(matchState.player1.score - matchState.player2.score)}</span> pts (Meta: +{matchState.scoreLimit})
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tela de resultado final
  if (matchState && matchState.status === 'finished') {
    const isWinner = matchState.winnerId === user?.id;
    const isPlayer1 = matchState.player1.id === user?.id;
    const finalScore = isPlayer1 ? matchState.player1.score : matchState.player2.score;
    const opponentScore = isPlayer1 ? matchState.player2.score : matchState.player1.score;

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white p-4">
        <InviteNotification
          invites={receivedInvites}
          onAccept={handleAcceptInvite}
          onReject={handleRejectInvite}
        />
        <div className="max-w-2xl w-full space-y-8 text-center">
          <div>
            {isWinner ? (
              <>
                <Trophy className="w-32 h-32 text-yellow-400 mx-auto mb-4 animate-bounce" />
                <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent mb-2">
                  Vitória!
                </h1>
                <p className="text-2xl text-gray-300">Você venceu a batalha! 🎉</p>
              </>
            ) : (
              <>
                <div className="w-32 h-32 mx-auto mb-4 flex items-center justify-center text-6xl">😔</div>
                <h1 className="text-5xl font-bold text-gray-400 mb-2">Derrota</h1>
                <p className="text-2xl text-gray-300">Não desista, tente novamente!</p>
              </>
            )}
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Resultado Final</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-lg">Sua pontuação:</span>
                <span className="text-2xl font-bold text-blue-400">{finalScore}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg">Oponente:</span>
                <span className="text-2xl font-bold text-red-400">{opponentScore}</span>
              </div>
              <div className="pt-3 border-t border-gray-700">
                <span className="text-sm text-gray-400">
                  Razão: {matchState.winnerReason === 'timeout' ? 'Tempo esgotado' : 'Limite de pontos'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => window.location.reload()}
              className="w-full py-6 text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400"
            >
              Jogar Novamente
            </Button>
            <Button
              onClick={() => setLocation('/')}
              variant="outline"
              className="w-full py-6 text-xl font-bold border-gray-600"
            >
              Voltar ao Menu
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
