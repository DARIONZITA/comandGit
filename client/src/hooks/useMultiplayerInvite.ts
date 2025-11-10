import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useAuth } from '@/contexts/AuthContext';

export interface UserSearchResult {
  user_id: string;
  username: string;
  email: string;
}

export interface MultiplayerInvite {
  id: string;
  sender_id: string;
  sender_username: string;
  receiver_id: string;
  receiver_username: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'expired';
  match_id?: string;
  created_at: string;
  responded_at?: string;
  expires_at: string;
}

export function useMultiplayerInvite() {
  const { user } = useAuth();
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sentInvite, setSentInvite] = useState<MultiplayerInvite | null>(null);
  const [receivedInvites, setReceivedInvites] = useState<MultiplayerInvite[]>([]);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  
  const inviteChannelRef = useRef<RealtimeChannel | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Buscar usuários (com debounce)
  const searchUsers = useCallback(async (searchTerm: string) => {
    if (!user || searchTerm.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    // Cancelar busca anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setIsSearching(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('[Invite] 🔍 Searching users:', searchTerm);
        const { data, error } = await supabase
          .rpc('search_users_for_invite', {
            search_term: searchTerm,
            current_user_id: user.id
          });

        if (error) {
          console.error('[Invite] Search error:', error);
          setSearchResults([]);
        } else {
          console.log('[Invite] ✅ Found users:', data);
          setSearchResults(data || []);
        }
      } catch (error) {
        console.error('[Invite] Search exception:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // Debounce de 300ms
  }, [user]);

  // Enviar convite
  const sendInvite = useCallback(async (receiverId: string, receiverUsername: string) => {
    if (!user) return null;

    try {
      // Buscar username do remetente
      const { data: userStats } = await supabase
        .from('user_stats')
        .select('username')
        .eq('user_id', user.id)
        .maybeSingle();

      const senderUsername = userStats?.username 
        || user.user_metadata?.username 
        || user.email?.split('@')[0] 
        || `Jogador${user.id.slice(-4)}`;

      console.log('[Invite] 📤 Sending invite to:', receiverUsername);
      
      const { data: inviteId, error } = await supabase
        .rpc('send_multiplayer_invite', {
          p_receiver_id: receiverId,
          p_sender_username: senderUsername,
          p_receiver_username: receiverUsername
        });

      if (error) {
        console.error('[Invite] Send error:', error);
        throw error;
      }

      console.log('[Invite] ✅ Invite sent:', inviteId);

      // Buscar convite criado
      const { data: invite } = await supabase
        .from('multiplayer_invites')
        .select('*')
        .eq('id', inviteId)
        .single();

      if (invite) {
        setSentInvite(invite);
        setIsWaitingForResponse(true);
      }

      return inviteId;
    } catch (error: any) {
      console.error('[Invite] Send exception:', error);
      throw error;
    }
  }, [user]);

  // Aceitar convite
  const acceptInvite = useCallback(async (inviteId: string) => {
    if (!user) return null;

    try {
      console.log('[Invite] ✅ Accepting invite:', inviteId);
      
      const { data: matchId, error } = await supabase
        .rpc('accept_multiplayer_invite', {
          p_invite_id: inviteId
        });

      if (error) {
        console.error('[Invite] Accept error:', error);
        throw error;
      }

      console.log('[Invite] 🎮 Match created:', matchId);

      // Remover convite da lista de recebidos
      setReceivedInvites(prev => prev.filter(inv => inv.id !== inviteId));

      // Retornar o match ID para que o componente possa buscar a match
      // O useMultiplayer vai detectar a nova match via seu listener
      return matchId;
    } catch (error: any) {
      console.error('[Invite] Accept exception:', error);
      throw error;
    }
  }, [user]);

  // Recusar convite
  const rejectInvite = useCallback(async (inviteId: string) => {
    if (!user) return;

    try {
      console.log('[Invite] ❌ Rejecting invite:', inviteId);
      
      const { error } = await supabase
        .rpc('reject_multiplayer_invite', {
          p_invite_id: inviteId
        });

      if (error) {
        console.error('[Invite] Reject error:', error);
        throw error;
      }

      console.log('[Invite] ✅ Invite rejected');

      // Remover convite da lista de recebidos
      setReceivedInvites(prev => prev.filter(inv => inv.id !== inviteId));
    } catch (error: any) {
      console.error('[Invite] Reject exception:', error);
      throw error;
    }
  }, [user]);

  // Cancelar convite enviado
  const cancelInvite = useCallback(async (inviteId: string) => {
    if (!user) return;

    try {
      console.log('[Invite] 🚫 Cancelling invite:', inviteId);
      
      const { error } = await supabase
        .rpc('cancel_multiplayer_invite', {
          p_invite_id: inviteId
        });

      if (error) {
        console.error('[Invite] Cancel error:', error);
        throw error;
      }

      console.log('[Invite] ✅ Invite cancelled');
      setSentInvite(null);
      setIsWaitingForResponse(false);
    } catch (error: any) {
      console.error('[Invite] Cancel exception:', error);
      throw error;
    }
  }, [user]);

  // Carregar convites recebidos pendentes
  const loadPendingInvites = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('multiplayer_invites')
        .select('*')
        .eq('receiver_id', user.id)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Invite] Load pending error:', error);
      } else {
        console.log('[Invite] 📬 Pending invites:', data?.length || 0);
        setReceivedInvites(data || []);
      }
    } catch (error) {
      console.error('[Invite] Load pending exception:', error);
    }
  }, [user]);

  // Listener de convites em tempo real
  useEffect(() => {
    if (!user) return;

    loadPendingInvites();

    inviteChannelRef.current = supabase
      .channel(`invites:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'multiplayer_invites',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          const newInvite = payload.new as MultiplayerInvite;
          console.log('[Invite] 📨 New invite received:', newInvite);
          if (newInvite.status === 'pending') {
            setReceivedInvites(prev => [newInvite, ...prev]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'multiplayer_invites',
          filter: `sender_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as MultiplayerInvite;
          console.log('[Invite] 📤 Sent invite updated:', updated);
          
          if (sentInvite && updated.id === sentInvite.id) {
            setSentInvite(updated);
            
            // Se foi aceito, parar de esperar e o listener de match do useMultiplayer cuidará do resto
            if (updated.status === 'accepted') {
              console.log('[Invite] ✅ Invite accepted! Match will be detected by useMultiplayer');
              setIsWaitingForResponse(false);
              setSentInvite(null);
            } else if (updated.status !== 'pending') {
              setIsWaitingForResponse(false);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'multiplayer_invites',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as MultiplayerInvite;
          console.log('[Invite] 📬 Received invite updated:', updated);
          
          // Remover da lista se não estiver mais pendente
          if (updated.status !== 'pending') {
            setReceivedInvites(prev => prev.filter(inv => inv.id !== updated.id));
          }
        }
      )
      .subscribe();

    return () => {
      inviteChannelRef.current?.unsubscribe();
    };
  }, [user, sentInvite, loadPendingInvites]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return {
    searchResults,
    isSearching,
    sentInvite,
    receivedInvites,
    isWaitingForResponse,
    searchUsers,
    sendInvite,
    acceptInvite,
    rejectInvite,
    cancelInvite,
    loadPendingInvites,
  };
}
