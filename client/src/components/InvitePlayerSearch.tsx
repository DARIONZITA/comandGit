import { useState } from 'react';
import { Search, Mail, Loader2, Send, X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { UserSearchResult } from '@/hooks/useMultiplayerInvite';

interface InvitePlayerSearchProps {
  searchResults: UserSearchResult[];
  isSearching: boolean;
  isWaitingForResponse: boolean;
  sentInviteUsername?: string;
  onSearch: (term: string) => void;
  onSelectUser: (user: UserSearchResult) => void;
  onCancelInvite: () => void;
  onBack: () => void;
}

export function InvitePlayerSearch({
  searchResults,
  isSearching,
  isWaitingForResponse,
  sentInviteUsername,
  onSearch,
  onSelectUser,
  onCancelInvite,
  onBack,
}: InvitePlayerSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onSearch(value);
  };

  if (isWaitingForResponse) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 scan-lines">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(16,185,129,0.1),transparent_50%)]" />
        
        <div className="max-w-2xl w-full space-y-8 relative z-10">
          <div className="text-center space-y-4">
            <Send className="w-24 h-24 text-cyan-400 mx-auto mb-4 animate-bounce drop-shadow-[0_0_20px_rgba(6,182,212,0.8)]" />
            <h1 className="text-5xl font-bold tracking-tight">
              CONVITE
              <br />
              <span className="text-cyan-400">ENVIADO!</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Aguardando resposta de <span className="text-cyan-400 font-bold">{sentInviteUsername}</span>
            </p>
          </div>

          <Card className="hover-elevate border-2 border-cyan-500/40 bg-gray-900/80 backdrop-blur-md">
            <CardContent className="pt-6 pb-6">
              <div className="space-y-4 text-center">
                <div className="flex items-center justify-center gap-3">
                  <span className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></span>
                  <span className="text-muted-foreground">Aguardando resposta...</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  O convite expira em 5 minutos
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              onClick={onCancelInvite}
              variant="outline"
              className="flex-1 py-6 text-lg font-bold border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              <X className="w-5 h-5 mr-2" />
              Cancelar Convite
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 scan-lines">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(16,185,129,0.1),transparent_50%)]" />
      
      <div className="max-w-3xl w-full space-y-8 relative z-10">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold tracking-tight">
            BUSCAR
            <br />
            <span className="text-cyan-400">JOGADOR</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Digite o nome de usuário ou email
          </p>
        </div>

        {/* Barra de Busca */}
        <Card className="border-2 border-cyan-500/40 bg-gray-900/80 backdrop-blur-md">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
              <Input
                type="text"
                placeholder="Digite para buscar..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-12 pr-12 py-6 text-lg bg-black/50 border-cyan-500/30 focus:border-cyan-500 text-white placeholder:text-gray-500"
                autoFocus
              />
              {isSearching && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400 animate-spin" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Resultados da Busca */}
        {searchTerm.length >= 2 && (
          <Card className="border-2 border-cyan-500/40 bg-gray-900/80 backdrop-blur-md max-h-96 overflow-y-auto custom-scrollbar">
            <CardContent className="pt-4 pb-4">
              {searchResults.length === 0 && !isSearching && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhum jogador encontrado</p>
                  <p className="text-sm mt-2">Tente outro termo de busca</p>
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((user) => (
                    <button
                      key={user.user_id}
                      onClick={() => onSelectUser(user)}
                      className="w-full p-4 rounded-lg bg-black/30 hover:bg-cyan-500/20 border border-cyan-500/20 hover:border-cyan-500/50 transition-all text-left group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
                            {user.username}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                        </div>
                        <Send className="w-5 h-5 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {searchTerm.length < 2 && (
          <Card className="border-2 border-cyan-500/20 bg-gray-900/50 backdrop-blur-md">
            <CardContent className="pt-6 pb-6">
              <div className="text-center text-muted-foreground space-y-2">
                <p>Digite pelo menos 2 caracteres para buscar</p>
                <p className="text-xs">Os resultados aparecerão aqui</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <Button
            onClick={onBack}
            variant="outline"
            size="lg"
            className="border-cyan-500/50 hover:bg-cyan-500/10 hover:border-cyan-500 text-cyan-400"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    </div>
  );
}
