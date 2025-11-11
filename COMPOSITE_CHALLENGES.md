# Sistema de Desafios Compostos - Multiplayer

## Visão Geral
Sistema que permite criar desafios Git compostos (sequenciais) no modo multiplayer, mantendo a atomicidade de cada passo enquanto apresenta uma progressão visual clara.

**IMPORTANTE**: Os desafios agora são carregados **dinamicamente do banco de dados**, não mais de um array estático.

## Características

### 1. Atomicidade Mantida
- Cada passo é um desafio individual com sua própria pontuação
- Cada acerto/erro é tratado independentemente
- Não há dependência técnica entre os passos (podem ser resolvidos mesmo se errar um anterior)

### 2. Apresentação Sequencial
- Passos do mesmo desafio composto aparecem sempre em sequência
- Ordem predefinida e imutável dentro de cada grupo composto
- Grupos compostos são embaralhados entre si e intercalados com desafios simples

### 3. Feedback Visual
- **Header do Card**: Mostra "Desafio Composto: Passo x/y" quando aplicável
- **Badge com Indicadores**: Bolinhas mostrando progresso visual (passos completados em cyan brilhante, pendentes em cinza)
- **Texto do Badge**: "Passo X de Y"

### 4. Integração com Banco de Dados
- Desafios carregados via `/api/challenges/batch/:worldId`
- Suporta desafios de múltiplos mundos (world_id 1, 2, 3)
- Fallback para desafios estáticos em caso de erro de conexão
- Respostas corretas com variáveis substituídas pelo backend 

## Estrutura de Dados

### Interface `MultiplayerChallenge` (Frontend)
```typescript
interface MultiplayerChallenge {
  id: number;
  question: string;
  answer: string;
  category: string;
  // Metadados para desafios compostos
  compositeId?: string;  // Ex: "composite_1", "composite_2"
  stepNumber?: number;   // 1, 2, 3...
  totalSteps?: number;   // Total de passos no grupo
}
```

### Interface `ChallengeData` (Backend)
```typescript
interface ChallengeData {
  challengeId: number;
  worldId: number;
  worldName: string;
  questionTemplate: string;
  question: string; // Com variáveis substituídas
  isMultiStep: boolean; // Indica se é desafio composto
  points: number;
  difficulty: number;
  timerSeconds: number;
  currentStateId: number;
  currentStatus: string;
  variables: Record<string, string>;
  correctAnswer?: string; // Resposta correta (para multiplayer)
}
```

## Fluxo de Carregamento

1. **Frontend solicita desafios**: `fetch('/api/challenges/batch/:worldId?count=15')`
2. **Backend busca do banco**: `gameEngine.getRandomChallenges(worldId, count)`
3. **Backend substitui variáveis**: Gera valores aleatórios para `[branch_name]`, `[file_name]`, etc.
4. **Backend retorna payload**: Inclui `question`, `correctAnswer`, `isMultiStep`
5. **Frontend converte para `MultiplayerChallenge`**:
   - Se `isMultiStep === true` → adiciona `compositeId`, `stepNumber`, `totalSteps`
   - Usa `correctAnswer` do backend (já com variáveis substituídas)
6. **Frontend embaralha**: Separa simples/compostos, mantém sequência interna dos compostos
7. **Frontend intercala**: 2-3 desafios simples + 1 grupo composto

## Exemplos Implementados

### Composite 1: Inicialização de Repositório (3 passos)
1. `git init` - Inicializar repositório
2. `git add .` - Adicionar arquivos ao stage
3. `git commit -m 'Initial commit'` - Fazer commit inicial

### Composite 2: Trabalho com Branches (4 passos)
1. `git branch feature` - Criar branch
2. `git checkout feature` - Mudar para branch
3. `git merge main` - Fazer merge
4. `git branch -d old-feature` - Deletar branch antiga

### Composite 3: Trabalho com Remotes (3 passos)
1. `git remote add origin` - Adicionar remote
2. `git fetch` - Baixar alterações
3. `git push origin` - Enviar commits

## Como Adicionar Novos Desafios Compostos

**NOTA**: Os desafios agora vêm do banco de dados. Para adicionar novos:

### Via Banco de Dados (Recomendado)

1. **Acesse a tabela `challenges`** no Supabase
2. **Insira novo desafio** com os campos:
   ```sql
   INSERT INTO challenges (
     world_id,
     question_template,
     correct_answer_template,
     is_multi_step,
     difficulty,
     points,
     timer_seconds,
     start_state_id
   ) VALUES (
     1, -- ID do mundo
     'Inicialize um repositório Git', -- Pergunta
     'git init', -- Resposta correta
     true, -- true = desafio composto
     1, -- 1-5 (básico a expert)
     10,
     30,
     1 -- ID do estado inicial
   );
   ```

3. **Se for multi-step**: Configure as transições na tabela `valid_transitions`
4. **Variáveis dinâmicas**: Use `[branch_name]`, `[file_name]`, etc. nas perguntas
5. **Teste**: Reinicie o servidor e entre em partida multiplayer

### Via Fallback Estático (Emergência)

Se o banco estiver indisponível, o sistema usa desafios estáticos em `generateFallbackChallenges()`:

```typescript
// Em client/src/hooks/useMultiplayer.ts
const generateFallbackChallenges = useCallback(() => {
  const allChallenges: MultiplayerChallenge[] = [
    // Adicione desafios aqui como antes
    { 
      id: 41, 
      question: "Passo 1: Descrição", 
      answer: "git comando", 
      category: "intermediate",
      compositeId: "composite_4",
      stepNumber: 1,
      totalSteps: 3
    },
    // ...
  ];
  // ... resto do código de embaralhamento
}, []);
```

## Algoritmo de Embaralhamento

1. **Separação**: Divide desafios simples e compostos
2. **Agrupamento**: Agrupa desafios compostos por `compositeId`
3. **Ordenação Interna**: Ordena cada grupo por `stepNumber`
4. **Embaralhamento**:
   - Desafios simples: ordem aleatória
   - Grupos compostos: ordem aleatória entre si (mas sequência interna preservada)
5. **Intercalação**: Adiciona 2-3 desafios simples, depois 1 grupo composto inteiro, repete

## Arquivos Modificados

### `server/gameEngine.ts`
- Interface `ChallengeData` estendida com campo `correctAnswer?: string`
- Método `buildChallengePayload()` agora inclui resposta correta com variáveis substituídas
- Suporte a variáveis dinâmicas (`[branch_name]`, `[file_name]`, etc.)

### `client/src/hooks/useMultiplayer.ts`
- Função `generateRandomChallenges()` agora é **async** e busca do banco via `/api/challenges/batch`
- Carrega 15 desafios de cada mundo (1, 2, 3) = 45 desafios totais
- Conversão de `ChallengeData` para `MultiplayerChallenge`
- Detecta `isMultiStep` e adiciona metadados `compositeId`, `stepNumber`, `totalSteps`
- Usa `correctAnswer` do backend (prioridade) ou extrai da pergunta (fallback)
- Lógica de embaralhamento inteligente preservando sequência de compostos
- Função `generateFallbackChallenges()` para quando banco estiver indisponível
- Todas as chamadas a `setChallenges` agora usam `await generateRandomChallenges()`

### `client/src/pages/Multiplayer.tsx`
- Header do card mostra "Desafio Composto: Passo x/y" quando `currentChallenge.compositeId` existe
- Badge visual com bolinhas de progresso e texto "Passo X de Y"
- Estilização com cores cyan e efeitos neon para destaque
- Importação de `useGameSounds` para som de digitação

## Regras e Convenções

1. **IDs Únicos**: Cada desafio precisa de um `id` único (não repetir)
2. **Sequência Completa**: Se criar um grupo com `totalSteps: 4`, deve haver 4 desafios com `stepNumber` de 1 a 4
3. **Categorias**: Podem variar dentro de um grupo composto (ex: básico → intermediário)
4. **Não Modificar Existentes**: Desafios simples (sem `compositeId`) não foram alterados

## Testes Recomendados

- [ ] Dois jogadores veem a mesma sequência de desafios compostos?
- [ ] Badge visual aparece corretamente?
- [ ] Bolinhas de progresso acendem conforme avança?
- [ ] Cada passo concede 1 ponto independentemente?
- [ ] Errar um passo não bloqueia o próximo?
- [ ] Grupos compostos estão intercalados com desafios simples?

## Próximas Melhorias (Opcional)

- [ ] Adicionar tooltip com descrição do fluxo completo ao hover no badge
- [ ] Mostrar barra de progresso no painel lateral para o oponente
- [ ] Criar categoria específica "composite" e filtros
- [ ] Persistir progresso em desafios compostos (se jogador reconectar)
- [ ] Animação ao completar todos os passos de um grupo composto
