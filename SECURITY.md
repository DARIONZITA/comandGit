# Arquitetura de Segurança

## Visão Geral

Este projeto implementa uma arquitetura de segurança em camadas para proteger dados sensíveis dos usuários enquanto permite acesso a dados públicos necessários para funcionalidades como placares de líderes.

## Princípios de Segurança

### 1. Backend como Gateway de Dados

- **Rotas de API Controladas**: Todas as consultas a dados de múltiplos usuários passam pelo backend
- **Exposição Seletiva**: Apenas dados públicos são expostos através das rotas
- **Service Role Key**: O backend usa a chave de serviço do Supabase para acessar dados (bypassa RLS)

### 2. Row Level Security (RLS)

As políticas RLS no Supabase garantem que:

- **Tabela `users`**: Usuários só podem ver seus próprios dados diretamente
- **Tabela `game_scores`**: Usuários só podem inserir scores com seu próprio `user_id`
- **Backend**: Service role bypassa RLS, mas só expõe dados públicos através de rotas controladas

### 3. Dados Públicos vs Privados

#### Dados Públicos (expostos via API)
- Username
- Scores do jogo
- Highest combo
- Data de criação do score
- Conquistas desbloqueadas
- Estatísticas agregadas (total score, highest score, etc.)

#### Dados Privados (nunca expostos)
- Email do usuário
- UUID do usuário no auth.users
- Metadados de autenticação
- Informações de perfil não listadas acima

## Rotas de API

### `/api/leaderboard?limit=N`
Retorna o placar de líderes global com apenas dados públicos.

**Resposta:**
```json
[
  {
    "id": "uuid",
    "username": "jogador1",
    "score": 1000,
    "world_id": 1,
    "highest_combo": 50,
    "created_at": "2025-11-09T..."
  }
]
```

### `/api/worlds/:worldId/leaderboard?limit=N`
Retorna o placar de líderes de um mundo específico.

### `/api/users/:userId/public`
Retorna perfil público de um usuário (username, stats, data de criação).

### `/api/users/:userId/achievements`
Retorna conquistas desbloqueadas de um usuário.

## Políticas RLS do Supabase

### Tabela `users`
```sql
-- SELECT: Usuários só podem ver seu próprio perfil
CREATE POLICY "Users can view own profile" 
ON public.users 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- UPDATE: Usuários só podem atualizar seu próprio perfil
CREATE POLICY "Users can update their own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id);
```

### Tabela `game_scores`
```sql
-- INSERT: Usuários só podem inserir scores com seu próprio user_id
-- SELECT: Scores são públicos, mas usernames vêm via rotas de API
```

## Fluxo de Dados

### Frontend → Backend → Supabase

1. **Frontend**: Faz requisição para `/api/leaderboard`
2. **Backend**: Usa service role key para buscar scores + usernames
3. **Backend**: Filtra e retorna apenas campos públicos
4. **Frontend**: Recebe e exibe dados públicos

### Por que não usar RLS permissivo?

❌ **Abordagem Insegura:**
```sql
-- Permite que qualquer usuário veja todos os perfis
CREATE POLICY "Anyone can view all profiles" 
ON users FOR SELECT USING (true);
```
**Problema**: Frontend tem acesso direto a TODOS os campos da tabela `users`, incluindo potencialmente dados sensíveis futuros.

✅ **Abordagem Segura:**
- RLS restritivo (só vê próprio perfil)
- Backend com service role busca dados
- Backend expõe apenas campos públicos específicos
- Frontend não pode acessar campos não expostos

## Variáveis de Ambiente

### Frontend (`.env`)
```env
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
```

### Backend (`.env`)
```env
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...  # Usado apenas no backend!
```

⚠️ **IMPORTANTE**: A service role key NUNCA deve ser exposta ao frontend!

## Benefícios da Arquitetura

1. **Controle Centralizado**: Mudanças em quais dados são públicos só requerem alteração no backend
2. **Auditoria**: Todas as requisições a dados de outros usuários passam por rotas logáveis
3. **Flexibilidade**: Fácil adicionar rate limiting, caching, validação
4. **Segurança por Design**: Dados privados não são acessíveis mesmo que frontend seja comprometido
5. **Escalabilidade**: Backend pode implementar caching Redis, CDN, etc.

## Checklist de Segurança

- [x] RLS habilitado em todas as tabelas
- [x] Políticas RLS restritivas (usuário vê só seus dados)
- [x] Service role key apenas no backend
- [x] Rotas de API expõem apenas dados públicos
- [x] Frontend usa fetch para rotas, não Supabase direto para dados de outros usuários
- [x] Validação de autenticação em rotas sensíveis
- [ ] Rate limiting (futuro)
- [ ] Logging de acessos (futuro)
- [ ] CORS configurado apropriadamente (futuro)

## Manutenção

### Adicionando Novo Campo Público

1. Adicionar campo na tabela (migration)
2. Atualizar rota de API no backend para incluir campo
3. Atualizar tipo TypeScript no frontend
4. Frontend automaticamente recebe novo campo

### Adicionando Novo Campo Privado

1. Adicionar campo na tabela (migration)
2. **NÃO** adicionar nas rotas de API públicas
3. Criar rota específica se usuário precisar acessar seu próprio campo
4. Campo permanece privado e seguro
