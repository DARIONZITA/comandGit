import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface GameScore {
  id: string;
  user_id: string;
  score: number;
  combo: number;
  world: number;
  mode: string;
  created_at: string;
  users?: {
    username: string;
  };
}

interface InsertGameScore {
  score: number;
  combo: number;
  world: number;
  mode: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: string;
  requirement_value: number;
}

interface UserAchievement {
  id: string;
  achievement_id: string;
  unlocked_at: string;
  achievements: Achievement;
}

export function useGameScores(limit: number = 10) {
  return useQuery({
    queryKey: ['gameScores', limit],
    queryFn: async () => {
      console.log('[useGameScores] Fetching leaderboard with limit:', limit);
      // Use the backend route that exposes only public data
      const response = await fetch(`/api/leaderboard?limit=${limit}`);
      
      console.log('[useGameScores] Response status:', response.status, response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[useGameScores] Error response:', errorText);
        throw new Error('Failed to fetch leaderboard');
      }
      
      const data = await response.json();
      console.log('[useGameScores] Received data:', data);
      
      // Transform to match the expected format
      const transformed = data.map((score: any) => ({
        ...score,
        users: { username: score.username },
      }));
      console.log('[useGameScores] Transformed data:', transformed);
      
      return transformed;
    },
    retry: 2,
    retryDelay: 1000,
  });
}

export function useAddGameScore() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (score: InsertGameScore) => {
      if (!user) throw new Error('User not authenticated');

      const scoreData = {
        ...score,
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from('game_scores')
        .insert([scoreData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameScores'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
    },
  });
}

export function useWorldScores(worldId: number, limit: number = 5) {
  return useQuery({
    queryKey: ['worldScores', worldId, limit],
    queryFn: async () => {
      // Use the backend route for world-specific leaderboard
      const response = await fetch(`/api/worlds/${worldId}/leaderboard?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch world leaderboard');
      }
      
      const data = await response.json();
      
      // Transform to match the expected format
      return data.map((score: any) => ({
        ...score,
        users: { username: score.username },
      }));
    },
  });
}

export function useUserStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['userStats', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // Get user's scores
      const { data: scores, error: scoresError } = await supabase
        .from('game_scores')
        .select('*')
        .eq('user_id', user.id);

      if (scoresError) throw scoresError;

      // Calculate stats
      const totalScore = scores?.reduce((sum, s) => sum + s.score, 0) || 0;
      const totalGames = scores?.length || 0;
      const highestScore = scores?.reduce((max, s) => Math.max(max, s.score), 0) || 0;
      const highestCombo = scores?.reduce((max, s) => Math.max(max, s.combo), 0) || 0;
      const worldsCompleted = new Set(scores?.map(s => s.world)).size;

      return {
        totalScore,
        totalGames,
        highestScore,
        highestCombo,
        worldsCompleted,
        scores,
      };
    },
  });
}

export function useAchievements() {
  return useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('requirement_value', { ascending: true });

      if (error) throw error;
      return data as Achievement[];
    },
  });
}

export function useUserAchievements() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['userAchievements', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievements (
            id,
            name,
            description,
            icon,
            requirement_type,
            requirement_value
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      return data as UserAchievement[];
    },
  });
}
