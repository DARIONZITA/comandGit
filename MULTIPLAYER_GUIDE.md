# 🎮 Modo Multiplayer 1v1 - Guia de Implementação

## 📋 Visão Geral

O modo multiplayer foi implementado com sucesso no jogo Git Command Runner. Este modo permite que dois jogadores competam em tempo real resolvendo desafios Git aleatórios.

## 🏗️ Arquitetura

### 1. **Sistema de Matchmaking**
- Fila de espera gerenciada pelo Supabase
- Match automático quando dois jogadores estão aguardando
- Sistema de limpeza automática de entradas antigas (5 minutos)

### 2. **Sincronização em Tempo Real**
- Utiliza Supabase Realtime para sincronizar estado do jogo
- Eventos de digitação transmitidos em tempo real
- Atualizações instantâneas de pontuação

### 3. **Lógica de Pontuação**
- **Resposta Correta**: +1 ponto, próximo desafio
- **Resposta Errada**: Oponente ganha +1 ponto (penalidade)
- **Vitória**: Primeiro a ter diferença de ±10 pontos OU tempo esgotado

### 4. **Interface de Usuário**
- **Tela de Matchmaking**: Busca de oponentes com animações
- **Barra de Cabo de Guerra**: Visualização da diferença de pontos
- **Visualizador Fantasma**: Atividade do oponente sem revelar respostas
- **Timer**: Contagem regressiva de 120 segundos

## 📂 Arquivos Criados

### Backend (Banco de Dados)
```
supabase/migrations/20250111_multiplayer_system.sql
```
- Tabelas: `multiplayer_queue`, `multiplayer_matches`, `multiplayer_events`, `multiplayer_history`
- Políticas RLS (Row Level Security)
- Funções de limpeza e timeout

### Frontend (React)

#### Hooks
```
client/src/hooks/useMultiplayer.ts
```
- Gerenciamento de estado do multiplayer
- Matchmaking, sincronização em tempo real
- Lógica de pontuação e eventos

#### Componentes
```
client/src/components/MatchmakingScreen.tsx
client/src/components/TugOfWarBar.tsx
client/src/components/OpponentGhost.tsx
```

#### Páginas
```
client/src/pages/Multiplayer.tsx
```

#### Modificações
- `client/src/App.tsx`: Adicionada rota `/multiplayer`
- `client/src/components/MainMenu.tsx`: Adicionado card do modo multiplayer

## 🚀 Instalação

### Passo 1: Aplicar Migração do Banco de Dados

Você precisa aplicar a migração SQL no seu banco de dados Supabase:

**Opção A: Via Supabase Dashboard**
1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Vá para seu projeto
3. No menu lateral, clique em "SQL Editor"
4. Copie todo o conteúdo de `supabase/migrations/20250111_multiplayer_system.sql`
5. Cole no editor e clique em "Run"

**Opção B: Via CLI do Supabase**
```powershell
# Se você tem o Supabase CLI instalado
supabase db push
```

**Opção C: Via MCP Tool (se disponível)**
```powershell
# Execute o script de migração
# O sistema MCP irá aplicar automaticamente
```

### Passo 2: Habilitar Realtime no Supabase

1. Acesse o Supabase Dashboard
2. Vá para "Database" → "Replication"
3. Habilite realtime para as tabelas:
   - `multiplayer_queue`
   - `multiplayer_matches`
   - `multiplayer_events`

### Passo 3: Configurar Permissões

As políticas RLS já estão incluídas na migração. Verifique se estão ativas:

1. Supabase Dashboard → "Authentication" → "Policies"
2. Confirme que as políticas das tabelas multiplayer estão ativas

### Passo 4: Testar o Sistema

```powershell
# Inicie o servidor de desenvolvimento
npm run dev
```

## 🎮 Como Jogar

### Para Jogadores

1. **Acesse o Menu Principal**: Na tela inicial, clique em "Modo 4: Multiplayer 1v1"

2. **Matchmaking**: O sistema automaticamente procura um oponente
   - Você verá uma tela de "Procurando Oponente..."
   - Pode cancelar a busca a qualquer momento

3. **Preparação**: Quando um oponente é encontrado
   - Ambos os jogadores devem clicar em "Estou Pronto!"
   - O jogo começa quando ambos estão prontos

4. **Durante o Jogo**:
   - **Seu Desafio**: Digite comandos Git para resolver
   - **Atividade do Oponente**: Veja quando ele está digitando (asteriscos)
   - **Barra de Cabo de Guerra**: Mostra a diferença de pontos em tempo real
   - **Timer**: 120 segundos para completar o máximo de desafios

5. **Sistema de Pontuação**:
   - ✓ **Acertou**: +1 ponto para você, próximo desafio
   - ✗ **Errou**: +1 ponto para seu oponente, você fica preso no desafio atual

6. **Condições de Vitória**:
   - Primeiro a ter diferença de **±10 pontos** ganha
   - OU quem tiver mais pontos quando o **tempo acabar**

## 🔧 Mecânicas Especiais

### "O Fantasma" (Feedback de Atividade)
- Você vê asteriscos (`*`) quando o oponente digita
- **NÃO** vê o que ele está digitando (anti-trapaça)
- Vê um flash VERDE quando ele acerta
- Vê um flash VERMELHO quando ele erra

### Barra de Cabo de Guerra
- Centro: Empate (0 pontos de diferença)
- Move para a DIREITA: Você está ganhando
- Move para a ESQUERDA: Oponente está ganhando
- Zonas vermelhas nas extremidades: Perto da vitória/derrota

### Penalidades por Erro
- Errar é CUSTOSO: seu oponente ganha ponto
- Incentiva precisão sobre velocidade
- Evita spam de respostas

## 📊 Banco de Dados

### Estrutura de Tabelas

**`multiplayer_queue`**: Fila de espera
- `user_id`, `username`, `status`, `created_at`

**`multiplayer_matches`**: Partidas ativas/finalizadas
- Dados dos dois jogadores
- Pontuações e progresso
- Status da partida
- Vencedor e razão da vitória

**`multiplayer_events`**: Eventos em tempo real
- Eventos de digitação
- Submissões corretas/incorretas
- Usado para sincronização

**`multiplayer_history`**: Histórico de partidas
- Estatísticas completas
- Vencedor e duração
- Para leaderboards futuros

## 🎨 Design de UI

### Paleta de Cores
- **Você**: Azul (`blue-500`)
- **Oponente**: Roxo/Vermelho (`purple-500`, `red-500`)
- **Correto**: Verde (`green-400`)
- **Incorreto**: Vermelho (`red-400`)
- **Destaque**: Amarelo (`yellow-400`)

### Animações
- Pulso na barra quando há mudança de pontuação
- Flash verde/vermelho no terminal fantasma
- Bounce no ícone de troféu
- Scan line no terminal do oponente

## 🐛 Troubleshooting

### Problema: "Não consigo encontrar oponentes"
**Solução**: 
- Verifique se o Realtime está habilitado no Supabase
- Teste com duas abas do navegador (dois usuários diferentes)
- Limpe o cache do navegador

### Problema: "Pontuação não atualiza"
**Solução**:
- Verifique as políticas RLS no Supabase
- Confirme que os eventos estão sendo gravados na tabela `multiplayer_events`
- Verifique o console do navegador para erros

### Problema: "Conexão perdida durante o jogo"
**Solução**:
- Sistema automaticamente finaliza partidas após timeout
- Jogador pode sair e tentar novamente
- Histórico é preservado no banco de dados

## 📈 Melhorias Futuras

### Planejadas
- [ ] Sistema de ranking/ELO
- [ ] Leaderboard específico para multiplayer
- [ ] Salas privadas (convite por link)
- [ ] Chat de texto durante partida
- [ ] Replays de partidas
- [ ] Torneios automáticos
- [ ] Power-ups e modificadores

### Ideias
- Modo 2v2 (equipes)
- Modo "Batalha Real" (múltiplos jogadores)
- Apostas de pontos virtuais
- Conquistas específicas do multiplayer
- Sistema de clãs/guildas

## 🔒 Segurança

### Implementado
✓ Row Level Security (RLS) em todas as tabelas
✓ Validação de comandos no servidor
✓ Anti-trapaça: comandos não são compartilhados
✓ Timeout automático de partidas

### Recomendações
- Implementar rate limiting para eventos
- Adicionar sistema de reportes
- Detectar padrões de trapaça
- Banimento temporário por comportamento suspeito

## 📝 Notas Técnicas

### Performance
- Eventos de digitação: Máximo 1 por segundo (throttle implementado)
- Limpeza automática de fila: A cada 5 minutos
- Timeout de partidas: Verificado a cada segundo no cliente

### Limitações
- Máximo 2 jogadores por partida
- 30 desafios pré-definidos (aleatorizados)
- Sem reconexão automática se perder conexão

### Dependências
- Supabase Realtime
- React 18+
- Wouter (roteamento)
- TanStack Query
- Tailwind CSS

## 🎯 Conclusão

O modo multiplayer 1v1 está **totalmente funcional** e pronto para uso! A implementação seguiu todas as especificações fornecidas:

✅ Sistema de matchmaking automático
✅ Barra de cabo de guerra com feedback visual
✅ Visualizador "fantasma" do oponente
✅ Sistema de pontuação com penalidades
✅ Condições de vitória por pontos ou tempo
✅ Interface intuitiva e responsiva

**Bom jogo! ⚔️🎮**
