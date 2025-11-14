# Sistema de Rating Multiplayer

## Resumo da Implementação

Sistema completo de pontuação competitiva para o modo multiplayer, com rating inicial de 700 pontos e transferência de 50 pontos por partida.

## Funcionalidades Implementadas

### 1. **Banco de Dados** (`20251115_multiplayer_rating_system.sql`)

#### Tabela `multiplayer_ratings`
- `user_id`: ID único do usuário
- `username`: Nome do jogador
- `rating`: Pontuação competitiva (inicia em 700, permite negativos)
- `wins`: Total de vitórias
- `losses`: Total de derrotas
- `total_matches`: Total de partidas jogadas
- `updated_at`, `created_at`: Timestamps

#### Função `update_multiplayer_rating(winner_id, loser_id)`
- **Vencedor**: +50 pontos
- **Perdedor**: -50 pontos (pode ficar negativo)
- Atualiza estatísticas (wins, losses, total_matches)

#### Trigger Automático
- Quando uma partida é inserida em `multiplayer_history`, o trigger aciona automaticamente `update_multiplayer_rating()`
- Não precisa chamada manual no código

#### Função `get_multiplayer_leaderboard(limit)`
- Retorna ranking ordenado por rating (descendente)
- Calcula win rate automaticamente
- Inclui todas as estatísticas

### 2. **Backend** (`server/routes.ts`)

#### Nova Rota: `/api/leaderboard/multiplayer`
```typescript
GET /api/leaderboard/multiplayer?limit=10
```
- Chama `get_multiplayer_leaderboard()` RPC
- Retorna JSON com rating, wins, losses, win_rate

### 3. **Frontend**

#### Hook `useMultiplayerLeaderboard` (`client/src/hooks/useLeaderboards.ts`)
```typescript
const { data: multiplayerRatings, isLoading } = useMultiplayerLeaderboard(10);
```
- React Query hook para buscar ranking
- Cache automático
- Retorno tipado com `MultiplayerRating[]`

#### Componente `NewLeaderboard.tsx`
- **Aba Multiplayer** como primeira aba (posição prioritária)
- Exibe:
  - Ranking por rating
  - Vitórias e derrotas (ex: `5V - 3D`)
  - Win rate em porcentagem
  - Total de partidas
  - Cor do rating:
    - Verde: ≥ 700 (acima do inicial)
    - Amarelo: 0-699
    - Vermelho: < 0 (negativo)

#### Hook `useMultiplayer.ts`
- Atualizado para inserir no histórico ao fim da partida por **timeout**
- Já inseria no histórico ao fim por **score_limit**
- O trigger é acionado automaticamente em ambos os casos

## Como Funciona

### Fluxo de uma Partida

1. **Partida termina** (por score_limit ou timeout)
2. **Inserção automática** em `multiplayer_history` com `winner_id`
3. **Trigger dispara** `trigger_update_multiplayer_rating()`
4. **Função processa**:
   - Identifica vencedor e perdedor
   - Atualiza `multiplayer_ratings`:
     - Vencedor: rating +50, wins +1
     - Perdedor: rating -50, losses +1
5. **UI atualiza** automaticamente via React Query

### Sistema de Pontos

| Situação | Rating Inicial | Após Vitória | Após Derrota |
|----------|---------------|--------------|--------------|
| Novo jogador | 700 | 750 | 650 |
| Com 800 pontos | 800 | 850 | 750 |
| Com 50 pontos | 50 | 100 | 0 |
| Com 0 pontos | 0 | 50 | **-50** ✓ |
| Com -100 pontos | -100 | -50 | **-150** ✓ |

**Importante**: Números negativos são permitidos e funcionam normalmente.

## Estrutura de Dados

### Response da API `/api/leaderboard/multiplayer`
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "username": "jogador123",
    "rating": 850,
    "wins": 10,
    "losses": 3,
    "total_matches": 13,
    "win_rate": 76.92,
    "updated_at": "2025-11-15T..."
  }
]
```

## Migrações Necessárias

Para ativar o sistema, execute a migration no Supabase:

```bash
# Via CLI do Supabase
supabase db push

# Ou aplique manualmente:
supabase/migrations/20251115_multiplayer_rating_system.sql
```

## Testes

### Testar Localmente

1. Execute a migration no Supabase local/staging
2. Jogue 2-3 partidas multiplayer
3. Verifique na tabela `multiplayer_ratings`:
```sql
SELECT * FROM multiplayer_ratings ORDER BY rating DESC;
```
4. Acesse a UI do placar → Aba "PvP"

### Casos de Teste

- [ ] Primeira partida: usuário deve iniciar com 700 ± 50
- [ ] Vencedor recebe +50
- [ ] Perdedor perde -50
- [ ] Rating pode ficar negativo
- [ ] Win rate é calculado corretamente
- [ ] Ranking ordena por rating (desc)
- [ ] Timeout e score_limit ambos atualizam rating

## Observações Técnicas

- **Trigger AFTER INSERT**: Garante que rating é atualizado após cada partida
- **ON CONFLICT**: Se usuário já existe, faz UPDATE; senão, INSERT
- **SECURITY DEFINER**: Funções RPC têm permissão para modificar dados
- **RLS Habilitado**: Todos podem ver ratings, mas só sistema pode modificar
- **Índices**: Otimização para queries de ranking (`idx_multiplayer_ratings_rating`)

## Melhorias Futuras (Opcional)

- Sistema de ligas/divisões (Bronze, Silver, Gold, etc.)
- Decay de rating por inatividade
- Sistema ELO mais sofisticado (ajuste baseado na diferença de rating)
- Histórico de evolução do rating ao longo do tempo
- Recompensas por ranking (achievements)

## Troubleshooting

**Problema**: Rating não atualiza após partida
- Verifique se a migration foi aplicada
- Confirme que `multiplayer_history` está sendo preenchido
- Cheque logs do Supabase para erros no trigger

**Problema**: Leaderboard vazio
- Verifique se há partidas no `multiplayer_history`
- Confirme que a função `get_multiplayer_leaderboard()` existe
- Teste a rota da API diretamente: `GET /api/leaderboard/multiplayer`

**Problema**: UI não carrega aba Multiplayer
- Verifique console do navegador para erros
- Confirme que o hook `useMultiplayerLeaderboard` está importado
- Cheque se a rota da API está respondendo

---

**Status**: ✅ Sistema completo implementado e pronto para uso
