import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { MatchmakingScreen } from '@/components/MatchmakingScreen';
import { TugOfWarBar } from '@/components/TugOfWarBar';
import { OpponentGhost } from '@/components/OpponentGhost';
import CommandInput from '@/components/CommandInput';
import { Button } from '@/components/ui/button';
import { Trophy, Clock, Zap, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Multiplayer() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    isSearching,
    matchState,
    challenges,
    opponentActivity,
    timeRemaining,
    joinQueue,
    leaveQueue,
    setReady,
    sendTypingEvent,
    submitAnswer,
  } = useMultiplayer();

  const [isReady, setIsReady] = useState(false);
  const [lastOpponentResult, setLastOpponentResult] = useState<'correct' | 'wrong' | null>(null);
  const [inputKey, setInputKey] = useState(0); // Para resetar o CommandInput

  // Redirecionar se não estiver autenticado
  useEffect(() => {
    if (!user) {
      setLocation('/login');
    }
  }, [user, setLocation]);

  // Iniciar busca automaticamente
  useEffect(() => {
    if (user && !isSearching && !matchState) {
      joinQueue();
    }
  }, [user, isSearching, matchState, joinQueue]);

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

  const handleCancel = () => {
    leaveQueue();
    setLocation('/');
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

    // Enviar evento de digitação
    sendTypingEvent();

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

  const getCurrentChallenge = () => {
    if (!matchState || !challenges.length) return null;
    
    const isPlayer1 = matchState.player1.id === user?.id;
    const currentChallengeIndex = isPlayer1 
      ? matchState.player1.currentChallenge 
      : matchState.player2.currentChallenge;

    return challenges[currentChallengeIndex];
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Tela de matchmaking
  if (isSearching || !matchState) {
    return <MatchmakingScreen isSearching={isSearching} onCancel={handleCancel} />;
  }

  // Tela de espera (ambos prontos)
  if (matchState.status === 'waiting') {
    const isPlayer1 = matchState.player1.id === user?.id;
    const myReadyStatus = isPlayer1 ? matchState.player1.isReady : matchState.player2.isReady;
    const opponentReadyStatus = isPlayer1 ? matchState.player2.isReady : matchState.player1.isReady;
    const opponentUsername = isPlayer1 ? matchState.player2.username : matchState.player1.username;

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white p-4">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center">
            <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4 animate-bounce" />
            <h1 className="text-4xl font-bold mb-2">Oponente Encontrado!</h1>
            <p className="text-gray-400 text-lg">
              Você vai enfrentar <span className="text-yellow-400 font-semibold">{opponentUsername}</span>
            </p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 border border-gray-700">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-lg">Você</span>
                {myReadyStatus ? (
                  <span className="text-green-400 font-semibold">✓ Pronto</span>
                ) : (
                  <span className="text-yellow-400">Aguardando...</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg">{opponentUsername}</span>
                {opponentReadyStatus ? (
                  <span className="text-green-400 font-semibold">✓ Pronto</span>
                ) : (
                  <span className="text-yellow-400">Aguardando...</span>
                )}
              </div>
            </div>
          </div>

          {!myReadyStatus ? (
            <Button
              onClick={handleReady}
              className="w-full py-6 text-xl font-bold bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400"
            >
              Estou Pronto!
            </Button>
          ) : (
            <div className="text-center text-gray-400">
              <p>Aguardando {opponentUsername} ficar pronto...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Tela de jogo ativo
  if (matchState.status === 'active') {
    const currentChallenge = getCurrentChallenge();
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
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header com timer */}
          <div className="flex items-center justify-between bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
            <div className="flex items-center space-x-2">
              <Clock className={`w-6 h-6 ${timeRemaining <= 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`} />
              <span className={`text-2xl font-bold font-mono ${timeRemaining <= 30 ? 'text-red-400' : 'text-white'}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <span className="text-gray-400">Modo Multiplayer</span>
            </div>

            <Button
              onClick={() => setLocation('/')}
              variant="outline"
              size="sm"
              className="border-gray-600"
            >
              <Home className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>

          {/* Barra de Cabo de Guerra */}
          <TugOfWarBar
            player1Username={matchState.player1.username}
            player1Score={matchState.player1.score}
            player2Username={matchState.player2.username}
            player2Score={matchState.player2.score}
            scoreLimit={matchState.scoreLimit}
            currentUserId={user?.id || ''}
            player1Id={matchState.player1.id}
          />

          <div className="grid md:grid-cols-2 gap-6">
            {/* Seu desafio */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-blue-400">Seu Desafio</h2>
              
              <div className="bg-gray-800/70 backdrop-blur-sm rounded-lg p-6 border-2 border-blue-500/50">
                <div className="mb-4">
                  <span className="text-sm text-gray-400">Desafio #{(isPlayer1 ? matchState.player1.currentChallenge : matchState.player2.currentChallenge) + 1}</span>
                  <h3 className="text-2xl font-bold text-white mt-2">
                    {currentChallenge.question}
                  </h3>
                </div>

                <CommandInput
                  key={inputKey}
                  onSubmit={handleSubmit}
                  disabled={false}
                />
              </div>
            </div>

            {/* Atividade do oponente */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-purple-400">Oponente</h2>
              
              <OpponentGhost
                opponentUsername={opponentUsername}
                isTyping={opponentActivity.typing}
                lastSubmitResult={lastOpponentResult}
              />

              {/* Estatísticas */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
                <h3 className="text-sm font-semibold text-gray-400 mb-3">Estatísticas</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Seu progresso:</span>
                    <span className="font-semibold text-blue-400">
                      Desafio {(isPlayer1 ? matchState.player1.currentChallenge : matchState.player2.currentChallenge) + 1}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Progresso oponente:</span>
                    <span className="font-semibold text-purple-400">
                      Desafio {(isPlayer1 ? matchState.player2.currentChallenge : matchState.player1.currentChallenge) + 1}
                    </span>
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
  if (matchState.status === 'finished') {
    const isWinner = matchState.winnerId === user?.id;
    const isPlayer1 = matchState.player1.id === user?.id;
    const finalScore = isPlayer1 ? matchState.player1.score : matchState.player2.score;
    const opponentScore = isPlayer1 ? matchState.player2.score : matchState.player1.score;

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white p-4">
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
