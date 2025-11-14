import { useQuery } from '@tanstack/react-query';

interface UserStats {
  id: string;
  user_id: string;
  username: string;
  high_score_normal: number;
  high_score_dojo: number;
  high_score_arcade: number;
  total_xp_normal: number;
  total_xp_dojo: number;
  total_xp_arcade: number;
  total_xp: number;
  level: number;
  total_games: number;
  total_combos: number;
  max_combo: number;
}

type GameMode = 'normal' | 'dojo' | 'arcade';

// Leaderboard de Habilidade (High Score por modo)
export function useHighScoreLeaderboard(mode: GameMode, limit: number = 10) {
  return useQuery({
    queryKey: ['highScoreLeaderboard', mode, limit],
    queryFn: async () => {
      const response = await fetch(`/api/leaderboard/high-score/${mode}?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch high score leaderboard');
      }
      
      return response.json() as Promise<UserStats[]>;
    },
    retry: 2,
    retryDelay: 1000,
  });
}

// Leaderboard de Experiência (XP Total)
export function useXpLeaderboard(limit: number = 10) {
  return useQuery({
    queryKey: ['xpLeaderboard', limit],
    queryFn: async () => {
      const response = await fetch(`/api/leaderboard/xp?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch XP leaderboard');
      }
      
      return response.json() as Promise<UserStats[]>;
    },
    retry: 2,
    retryDelay: 1000,
  });
}

// Estatísticas de um usuário específico
export function useUserStats(userId?: string) {
  return useQuery({
    queryKey: ['userStats', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const response = await fetch(`/api/user-stats/${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user stats');
      }
      
      return response.json() as Promise<UserStats>;
    },
    enabled: !!userId,
    retry: 2,
    retryDelay: 1000,
  });
}

// Interface para Rating Multiplayer
interface MultiplayerRating {
  id: string;
  user_id: string;
  username: string;
  rating: number;
  wins: number;
  losses: number;
  total_matches: number;
  win_rate: number;
  updated_at: string;
}

// Leaderboard de Rating Multiplayer
export function useMultiplayerLeaderboard(limit: number = 10) {
  return useQuery({
    queryKey: ['multiplayerLeaderboard', limit],
    queryFn: async () => {
      const response = await fetch(`/api/leaderboard/multiplayer?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch multiplayer leaderboard');
      }
      
      return response.json() as Promise<MultiplayerRating[]>;
    },
    retry: 2,
    retryDelay: 1000,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
  });
}

// Rating Multiplayer de um usuário específico
export function useUserMultiplayerRating(userId?: string) {
  return useQuery({
    queryKey: ['userMultiplayerRating', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const response = await fetch(`/api/user-multiplayer-rating/${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user multiplayer rating');
      }
      
      return response.json() as Promise<MultiplayerRating>;
    },
    enabled: !!userId,
    retry: 2,
    retryDelay: 1000,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}
