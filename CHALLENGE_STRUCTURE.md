# 📚 Estrutura de Desafios - Sistema Git Game

Este documento explica como os desafios são estruturados no sistema, seus campos, particularidades e diferenças entre os modos de jogo.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Desafios Estáticos](#desafios-estáticos)
   - [Modo Dojo](#modo-dojo)
   - [Modo Arcade](#modo-arcade)
3. [Desafios Dinâmicos](#desafios-dinâmicos)
   - [Modo Classic (Normal)](#modo-classic-normal)
   - [Modo Multiplayer](#modo-multiplayer)
4. [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
5. [Como Adicionar Novos Desafios](#como-adicionar-novos-desafios)

---

## 🎯 Visão Geral

O sistema possui **dois tipos de desafios**:

### 1. **Desafios Estáticos** (Hard-coded)
- Definidos diretamente no código TypeScript
- Usados por: **Dojo** e **Arcade**
- Localização: `client/src/lib/dojoData.ts` e `client/src/lib/arcadeData.ts`
- Estrutura: Interface `ChallengeBlock` do `shared/schema.ts`

### 2. **Desafios Dinâmicos** (Banco de Dados)
- Armazenados no PostgreSQL (Supabase)
- Usados por: **Classic (Normal)** e **Multiplayer**
- Sistema de templates com variáveis substituíveis
- Suporte a múltiplos passos e validação de estado Git

---

## 🥋 Desafios Estáticos

### 📦 Interface Base: `ChallengeBlock`

```typescript
type ChallengeBlock = {
  id: string;                    // Identificador único (ex: "dojo-1", "arcade-5")
  scenario: string;              // Texto da pergunta/desafio
  correctAnswer: string;         // Resposta correta principal
  altAnswers?: string[];         // Respostas alternativas aceitas (opcional)
  points: number;                // Pontos ganhos ao acertar
  difficulty: number;            // Dificuldade (1-3)
  timerSeconds?: number;         // Tempo limite em segundos (opcional)
  blanks?: { text: string; answer: string }[];  // Para modo Dojo
  commandSequence?: string[];    // Sequência de comandos (modo Classic)
  sequenceAltAnswers?: string[][]; // Alternativas para cada passo
};
```

---

### 🎯 Modo Dojo

**Objetivo**: Preencher lacunas em comandos Git

**Características**:
- Foco em **sintaxe** e **parâmetros**
- Um campo `blanks` com texto e resposta esperada
- Timer de 8-15 segundos por desafio
- Pontuação: 100-300 pontos

#### 📐 Estrutura

```typescript
{
  id: "dojo-1",
  scenario: "Clone o repositório",
  correctAnswer: "git clone https://github.com/user/repo.git",
  points: 150,
  difficulty: 1,
  timerSeconds: 10,
  blanks: [
    { 
      text: "git clone [________________]",    // Lacuna visual
      answer: "https://github.com/user/repo.git"  // Resposta esperada
    }
  ]
}
```

#### 🔑 Campos Importantes

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| `id` | ✅ | ID único (formato: `"dojo-N"`) |
| `scenario` | ✅ | Descrição do que deve ser feito |
| `correctAnswer` | ✅ | Comando Git completo (usado para referência) |
| `points` | ✅ | Pontos ganhos (100-300) |
| `difficulty` | ✅ | 1 = fácil, 2 = médio, 3 = difícil |
| `timerSeconds` | ✅ | Tempo limite (8-15s recomendado) |
| `blanks` | ✅ | Array com um objeto contendo `text` e `answer` |

#### 💡 Particularidades

1. **Lacunas visuais**: Use `[___]` ou `[________________]` para representar o espaço
2. **Validação**: Compara `input.trim().toLowerCase() === answer.trim().toLowerCase()`
3. **Não aceita alternativas**: Apenas a resposta exata em `blanks[0].answer`
4. **Output rápido**: Cards de output desaparecem em 800ms
5. **Feedback direto**: Mostra imediatamente se acertou ou errou

#### 📝 Exemplo Completo

```typescript
{
  id: "dojo-7",
  scenario: "Faça rebase interativo dos últimos 3 commits",
  correctAnswer: "git rebase -i HEAD~3",
  points: 300,
  difficulty: 3,
  timerSeconds: 15,
  blanks: [
    { 
      text: "git rebase [__] HEAD~3", 
      answer: "-i" 
    }
  ]
}
```

---

### 🕹️ Modo Arcade

**Objetivo**: Digitar comandos Git completos em alta velocidade

**Características**:
- Comandos **completos** (sem lacunas)
- Blocos caindo na tela
- Velocidade aumenta com o nível
- Pontuação: 100-450 pontos

#### 📐 Estrutura

```typescript
{
  id: "arcade-1",
  scenario: "Digite o comando exato:",
  correctAnswer: "git init",
  points: 100,
  difficulty: 1
}
```

#### 🔑 Campos Importantes

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| `id` | ✅ | ID único (formato: `"arcade-N"`) |
| `scenario` | ✅ | Sempre "Digite o comando exato:" |
| `correctAnswer` | ✅ | Comando Git completo e exato |
| `points` | ✅ | Pontos ganhos (100-450) |
| `difficulty` | ✅ | 1 = básico, 2 = intermediário, 3 = avançado |

#### 💡 Particularidades

1. **Validação exata**: `command.trim() === correctAnswer.trim()`
2. **Sem alternativas**: Não usa `altAnswers`
3. **Sem timer individual**: Controlado pela velocidade de queda
4. **Sistema de níveis**: Velocidade aumenta a cada 10 desafios
5. **Penalidade por erro**: Perde combo mas não perde vida
6. **Output rápido**: Cards de output desaparecem em 800ms

#### 📊 Configuração de Velocidade

```typescript
// client/src/lib/arcadeData.ts
export const ARCADE_SPEED_CONFIG = {
  1: { spawnInterval: 4000, fallSpeed: 1.2 },   // Nível 1: 4s entre spawns
  2: { spawnInterval: 3500, fallSpeed: 1.4 },
  3: { spawnInterval: 3000, fallSpeed: 1.6 },
  4: { spawnInterval: 2500, fallSpeed: 1.8 },
  5: { spawnInterval: 2000, fallSpeed: 2.0 },
  6: { spawnInterval: 1800, fallSpeed: 2.2 },
  7: { spawnInterval: 1500, fallSpeed: 2.5 },   // Nível 7+: máximo
};
```

#### 📝 Exemplo Completo

```typescript
{
  id: "arcade-11",
  scenario: "Digite o comando exato:",
  correctAnswer: "git rebase -i HEAD~3",
  points: 300,
  difficulty: 3
}
```

---

## 🔄 Desafios Dinâmicos

### 📦 Sistema de Templates

Os desafios dinâmicos usam um sistema sofisticado com:
- **Templates de perguntas** com variáveis `{{var}}`
- **Estados Git** representando o repositório
- **Transições válidas** entre estados
- **Validação de comandos** com regex patterns

---

### 🎮 Modo Classic (Normal)

**Objetivo**: Resolver desafios contextuais com estado Git simulado

**Características**:
- Desafios buscados do banco de dados
- Suporte a **single-step** e **multi-step**
- Estado Git simulado (branches, commits, files)
- Timer individual por desafio

#### 📐 Estrutura no Banco

**1. Tabela `challenges`**
```sql
CREATE TABLE challenges (
  challenge_id SERIAL PRIMARY KEY,
  world_id INTEGER NOT NULL,
  start_state_id INTEGER NOT NULL,
  question_template TEXT NOT NULL,           -- "Adicione o arquivo {{filename}} ao stage"
  correct_answer_template TEXT,              -- "git add {{filename}}"
  is_multi_step BOOLEAN DEFAULT false,
  points INTEGER DEFAULT 100,
  difficulty INTEGER DEFAULT 1,
  timer_seconds INTEGER DEFAULT 10,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**2. Tabela `git_states`**
```sql
CREATE TABLE git_states (
  state_id SERIAL PRIMARY KEY,
  state_name TEXT UNIQUE NOT NULL,           -- "untracked_file"
  status_template TEXT NOT NULL,             -- "# Untracked files:\n#\t{{filename}}"
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**3. Tabela `valid_transitions`**
```sql
CREATE TABLE valid_transitions (
  transition_id SERIAL PRIMARY KEY,
  challenge_id INTEGER NOT NULL,
  current_state_id INTEGER NOT NULL,
  answer_pattern TEXT NOT NULL,              -- "git add {{filename}}"
  command_output TEXT,                       -- Saída do comando Git
  next_state_id INTEGER NOT NULL,
  is_final_step BOOLEAN DEFAULT false,
  step_order INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**4. Tabela `dynamic_variables`**
```sql
CREATE TABLE dynamic_variables (
  variable_name TEXT PRIMARY KEY,            -- "filename", "branch_name"
  value_pool JSONB NOT NULL,                 -- ["app.py", "index.html", "README.md"]
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 🔑 Campos Importantes

##### **Challenge**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `challenge_id` | INT | ID único auto-incrementado |
| `world_id` | INT | Mundo ao qual pertence (1-3) |
| `start_state_id` | INT | Estado Git inicial |
| `question_template` | TEXT | Pergunta com variáveis `{{var}}` |
| `correct_answer_template` | TEXT | Resposta template (opcional se multi-step) |
| `is_multi_step` | BOOL | True = múltiplos comandos |
| `points` | INT | Pontos base (100-500) |
| `difficulty` | INT | 1-5 (afeta timer) |
| `timer_seconds` | INT | Tempo base (ajustado por dificuldade) |

##### **GitState**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `state_id` | INT | ID único do estado |
| `state_name` | TEXT | Nome único (ex: "staged_file") |
| `status_template` | TEXT | Template do `git status` |
| `description` | TEXT | Descrição do estado |

##### **ValidTransition**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `challenge_id` | INT | Desafio ao qual pertence |
| `current_state_id` | INT | Estado atual necessário |
| `answer_pattern` | TEXT | Regex ou template do comando aceito |
| `command_output` | TEXT | Saída simulada do comando |
| `next_state_id` | INT | Próximo estado após comando |
| `is_final_step` | BOOL | True = desafio completo |
| `step_order` | INT | Ordem no multi-step (1, 2, 3...) |

#### 💡 Particularidades

1. **Substituição de variáveis**: Sistema escolhe valores aleatórios do pool
2. **Validação flexível**: Aceita variações (ex: `git add .` ou `git add -A`)
3. **Estado persistente**: Mantém histórico do Git durante o desafio
4. **Multi-step**: Pode exigir múltiplos comandos sequenciais
5. **Fallback**: Se banco falhar, usa `gameData.ts` estático

#### 📝 Exemplo: Desafio Single-Step

```typescript
// Banco de dados
Challenge {
  challenge_id: 1,
  world_id: 1,
  start_state_id: 1,
  question_template: "Adicione o arquivo {{filename}} ao stage",
  correct_answer_template: "git add {{filename}}",
  is_multi_step: false,
  points: 100,
  difficulty: 1,
  timer_seconds: 10
}

GitState {
  state_id: 1,
  state_name: "untracked_file",
  status_template: "# Untracked files:\n#\t{{filename}}"
}

ValidTransition {
  challenge_id: 1,
  current_state_id: 1,
  answer_pattern: "git add {{filename}}",
  command_output: "",
  next_state_id: 2,  // staged_file
  is_final_step: true,
  step_order: 1
}

DynamicVariable {
  variable_name: "filename",
  value_pool: ["app.py", "index.html", "README.md", "styles.css"]
}

// Renderizado para o jogador
{
  question: "Adicione o arquivo index.html ao stage",
  variables: { filename: "index.html" },
  currentStatus: "# Untracked files:\n#\tindex.html",
  expectedAnswer: "git add index.html"
}
```

#### 📝 Exemplo: Desafio Multi-Step

```typescript
// Banco de dados
Challenge {
  challenge_id: 5,
  world_id: 1,
  start_state_id: 1,
  question_template: "Adicione {{filename}} e faça commit com mensagem '{{commit_msg}}'",
  correct_answer_template: null,  // Multi-step não usa template único
  is_multi_step: true,
  points: 250,
  difficulty: 2,
  timer_seconds: 15
}

ValidTransition [
  {
    challenge_id: 5,
    current_state_id: 1,  // untracked
    answer_pattern: "git add {{filename}}",
    next_state_id: 2,  // staged
    is_final_step: false,
    step_order: 1
  },
  {
    challenge_id: 5,
    current_state_id: 2,  // staged
    answer_pattern: 'git commit -m "{{commit_msg}}"',
    next_state_id: 3,  // committed
    is_final_step: true,
    step_order: 2
  }
]

// Renderizado (passo 1)
{
  question: "Adicione app.py e faça commit com mensagem 'Add feature'",
  currentStatus: "# Untracked files:\n#\tapp.py",
  stepNumber: 1,
  totalSteps: 2
}

// Após git add app.py (passo 2)
{
  question: "Adicione app.py e faça commit com mensagem 'Add feature'",
  currentStatus: "# Changes to be committed:\n#\tapp.py",
  stepNumber: 2,
  totalSteps: 2
}
```

---

### 👥 Modo Multiplayer

**Objetivo**: Competir em tempo real contra outro jogador

**Características**:
- Usa o **mesmo sistema dinâmico** do modo Classic
- Desafios idênticos para ambos os jogadores
- Sincronização em tempo real via Supabase Realtime
- Timer global de 120 segundos

#### 📐 Estrutura da Match

```typescript
interface MatchState {
  id: string;
  player1: {
    id: string;
    username: string;
    score: number;
    currentChallenge: number;  // Índice no array de desafios
    isReady: boolean;
  };
  player2: {
    id: string;
    username: string;
    score: number;
    currentChallenge: number;
    isReady: boolean;
  };
  status: 'waiting' | 'active' | 'finished';
  gameDuration: 120;
  scoreLimit: 10;
  startedAt?: string;
  finishedAt?: string;
}
```

#### 📐 Estrutura dos Desafios

```typescript
interface MultiplayerChallenge {
  id: number;                    // ID único
  question: string;              // Pergunta renderizada
  answer: string;                // Resposta esperada
  category: 'basic' | 'intermediate' | 'advanced';
  compositeId?: string;          // ID do desafio composto
  stepNumber?: number;           // Número do passo (1, 2, 3...)
  totalSteps?: number;           // Total de passos
}
```

#### 🔄 Fluxo de Desafios

1. **Geração inicial**: 45 desafios carregados (15 de cada mundo)
2. **Embaralhamento**: Mistura simples e compostos
3. **Sincronização**: Ambos jogadores recebem mesma sequência
4. **Prefetch**: Busca mais desafios quando restam ≤10

#### 💡 Particularidades

1. **Desafios compostos**: Agrupados por `compositeId`, ordem mantida
2. **Mesmo para ambos**: Array de desafios idêntico
3. **Índice independente**: Cada jogador avança no seu ritmo
4. **Eventos em tempo real**: Digitação e submissão visíveis
5. **Fallback estático**: Se banco falhar, usa desafios hard-coded

#### 📝 Exemplo de Desafios

```typescript
// Desafio simples
{
  id: 1001,
  question: "Inicialize um repositório Git",
  answer: "git init",
  category: "basic"
}

// Desafio composto (3 passos)
[
  {
    id: 2001,
    question: "Crie uma branch chamada 'feature'",
    answer: "git branch feature",
    category: "intermediate",
    compositeId: "composite_2",
    stepNumber: 1,
    totalSteps: 3
  },
  {
    id: 2002,
    question: "Mude para a branch 'feature'",
    answer: "git checkout feature",
    category: "intermediate",
    compositeId: "composite_2",
    stepNumber: 2,
    totalSteps: 3
  },
  {
    id: 2003,
    question: "Faça merge da 'main' na atual",
    answer: "git merge main",
    category: "intermediate",
    compositeId: "composite_2",
    stepNumber: 3,
    totalSteps: 3
  }
]
```

---

## 🗄️ Estrutura do Banco de Dados

### 📊 Diagrama de Relacionamentos

```
┌──────────────┐
│   worlds     │
│──────────────│
│ world_id (PK)│◄────┐
│ world_level  │     │
│ world_name   │     │
└──────────────┘     │
                     │
┌──────────────┐     │      ┌──────────────────┐
│  git_states  │     │      │   challenges     │
│──────────────│     │      │──────────────────│
│ state_id (PK)│◄────┼──────│ challenge_id (PK)│
│ state_name   │     │      │ world_id (FK)    │
│ status_temp. │     │      │ start_state_id   │
└──────────────┘     └──────│ question_temp.   │
                            │ is_multi_step    │
                            │ points           │
                            └──────────────────┘
                                     ▲
                                     │
                            ┌────────┴──────────┐
                            │                   │
                   ┌────────────────┐  ┌─────────────────┐
                   │valid_transitions│  │dynamic_variables│
                   │────────────────│  │─────────────────│
                   │ transition_id  │  │ variable_name   │
                   │ challenge_id   │  │ value_pool      │
                   │ current_state  │  └─────────────────┘
                   │ answer_pattern │
                   │ next_state_id  │
                   │ is_final_step  │
                   └────────────────┘
```

### 🔗 Relacionamentos

1. **challenges.world_id** → **worlds.world_id**
2. **challenges.start_state_id** → **git_states.state_id**
3. **valid_transitions.challenge_id** → **challenges.challenge_id**
4. **valid_transitions.current_state_id** → **git_states.state_id**
5. **valid_transitions.next_state_id** → **git_states.state_id**

---

## ➕ Como Adicionar Novos Desafios

### 🥋 Adicionando Desafio Dojo

**Localização**: `client/src/lib/dojoData.ts`

```typescript
// No array DOJO_CHALLENGES, adicione:
{
  id: "dojo-XX",  // Incremente o número
  scenario: "Descrição do que fazer",
  correctAnswer: "comando git completo",
  points: 100-300,  // Baseado na dificuldade
  difficulty: 1-3,
  timerSeconds: 8-15,
  blanks: [
    { 
      text: "comando [lacuna] aqui", 
      answer: "resposta esperada" 
    }
  ]
}
```

**Checklist**:
- ✅ ID único no formato `"dojo-N"`
- ✅ Scenario claro e objetivo
- ✅ correctAnswer com comando completo
- ✅ Pontos apropriados à dificuldade
- ✅ Timer razoável (não muito curto/longo)
- ✅ Lacuna visual clara com `[___]`
- ✅ Resposta exata sem alternativas

---

### 🕹️ Adicionando Desafio Arcade

**Localização**: `client/src/lib/arcadeData.ts`

```typescript
// No array ARCADE_CHALLENGES, adicione:
{
  id: "arcade-XX",  // Incremente o número
  scenario: "Digite o comando exato:",
  correctAnswer: "comando git completo",
  points: 100-450,  // Aumenta com dificuldade
  difficulty: 1-3
}
```

**Checklist**:
- ✅ ID único no formato `"arcade-N"`
- ✅ Scenario sempre "Digite o comando exato:"
- ✅ correctAnswer exato (será validado caractere por caractere)
- ✅ Pontos: 100-150 (básico), 200-300 (intermediário), 300-450 (avançado)
- ✅ Dificuldade apropriada ao comando

---

### 🎮 Adicionando Desafio Classic (Dinâmico)

**Método 1: SQL Direto**

```sql
-- 1. Inserir o desafio
INSERT INTO challenges (
  world_id,
  start_state_id,
  question_template,
  correct_answer_template,
  is_multi_step,
  points,
  difficulty,
  timer_seconds
) VALUES (
  1,  -- Mundo 1 (O Básico)
  1,  -- Estado inicial (ex: untracked_file)
  'Crie um commit com a mensagem "{{commit_msg}}"',
  'git commit -m "{{commit_msg}}"',
  false,  -- Single-step
  150,
  2,
  12
) RETURNING challenge_id;

-- 2. Inserir transição válida
INSERT INTO valid_transitions (
  challenge_id,
  current_state_id,
  answer_pattern,
  command_output,
  next_state_id,
  is_final_step,
  step_order
) VALUES (
  1,  -- ID do desafio criado acima
  2,  -- Estado staged_file
  'git commit -m "{{commit_msg}}"',
  '[main abc1234] {{commit_msg}}\n 1 file changed',
  3,  -- Estado committed_file
  true,
  1
);

-- 3. Criar variável (se não existir)
INSERT INTO dynamic_variables (variable_name, value_pool)
VALUES ('commit_msg', '["Initial commit", "Add feature", "Fix bug", "Update docs"]'::jsonb)
ON CONFLICT (variable_name) DO NOTHING;
```

**Método 2: Migration (Recomendado)**

```sql
-- supabase/migrations/YYYYMMDD_add_new_challenge.sql
-- Adicionar desafio: "Renomeie o arquivo {{old_file}} para {{new_file}}"

-- 1. Criar variáveis se necessário
INSERT INTO dynamic_variables (variable_name, value_pool, description)
VALUES 
  ('old_file', '["temp.txt", "draft.md", "old_code.py"]'::jsonb, 'Nome do arquivo antigo'),
  ('new_file', '["final.txt", "README.md", "main.py"]'::jsonb, 'Nome do arquivo novo')
ON CONFLICT (variable_name) DO NOTHING;

-- 2. Criar estado Git se necessário
INSERT INTO git_states (state_name, status_template, description)
VALUES (
  'file_to_rename',
  '# On branch main\n# Untracked files:\n#\t{{old_file}}',
  'Arquivo pronto para ser renomeado'
) ON CONFLICT (state_name) DO NOTHING;

-- 3. Criar o desafio
INSERT INTO challenges (
  world_id,
  start_state_id,
  question_template,
  correct_answer_template,
  is_multi_step,
  points,
  difficulty,
  timer_seconds
)
SELECT 
  2,  -- Mundo 2
  state_id,
  'Renomeie o arquivo {{old_file}} para {{new_file}}',
  'git mv {{old_file}} {{new_file}}',
  false,
  200,
  2,
  12
FROM git_states WHERE state_name = 'file_to_rename'
RETURNING challenge_id;

-- 4. Criar transição (usando CTE para pegar IDs)
WITH new_challenge AS (
  SELECT challenge_id FROM challenges 
  WHERE question_template LIKE 'Renomeie o arquivo%'
  ORDER BY challenge_id DESC LIMIT 1
),
states AS (
  SELECT 
    (SELECT state_id FROM git_states WHERE state_name = 'file_to_rename') as current_state,
    (SELECT state_id FROM git_states WHERE state_name = 'staged_rename') as next_state
)
INSERT INTO valid_transitions (
  challenge_id,
  current_state_id,
  answer_pattern,
  command_output,
  next_state_id,
  is_final_step,
  step_order
)
SELECT 
  nc.challenge_id,
  s.current_state,
  'git mv {{old_file}} {{new_file}}',
  'Renaming {{old_file}} to {{new_file}}',
  s.next_state,
  true,
  1
FROM new_challenge nc, states s;
```

**Checklist**:
- ✅ Variáveis criadas em `dynamic_variables`
- ✅ Estado inicial existe em `git_states`
- ✅ Template usa `{{variavel}}` corretamente
- ✅ Transição aponta para próximo estado válido
- ✅ `is_final_step` correto (true = último passo)
- ✅ `step_order` sequencial para multi-step
- ✅ `answer_pattern` aceita variações (ex: `git add .` ou `git add -A`)

---

### 👥 Desafios Multiplayer

**Nota**: Multiplayer usa o **mesmo pool** de desafios do modo Classic!

Para adicionar desafios ao multiplayer:
1. Adicione no banco de dados (método acima)
2. Serão automaticamente incluídos no multiplayer
3. Sistema busca 15 desafios de cada mundo (1, 2, 3)

**Considerações**:
- Desafios compostos são mantidos em sequência
- Dificuldade balanceada entre jogadores
- Evite desafios muito longos (>20s)
- Prefira desafios objetivos e claros

---

## 📋 Boas Práticas

### ✅ DO (Faça)

1. **IDs consistentes**: Use formato `"mode-number"` (ex: `"dojo-15"`)
2. **Pontuação equilibrada**: 100-150 (fácil), 200-300 (médio), 300-500 (difícil)
3. **Timers razoáveis**: 8-12s (fácil), 12-15s (médio), 15-20s (difícil)
4. **Templates claros**: Use nomes de variáveis descritivos `{{filename}}`, não `{{f}}`
5. **Testar variações**: Garanta que alternativas funcionam (`git add .` vs `git add -A`)
6. **Descrever estados**: Adicione `description` em `git_states`
7. **Validação flexível**: Aceite variações comuns de comandos Git
8. **Progressão gradual**: Dificuldade aumenta suavemente

### ❌ DON'T (Não faça)

1. **IDs duplicados**: Nunca reutilize um ID existente
2. **Pontos inconsistentes**: Não dê 500 pontos para comando fácil
3. **Timers muito curtos**: Evite <6s (frustrante)
4. **Variáveis sem pool**: Toda variável deve ter `value_pool`
5. **Estados orfãos**: Todo estado deve ter transição de saída
6. **Hardcoded values**: Use templates, não valores fixos
7. **Perguntas ambíguas**: Seja claro e específico
8. **Sequências quebradas**: `step_order` deve ser 1, 2, 3... sem pulos

---

## 🐛 Debugging

### 🔍 Verificar Desafio Dinâmico

```javascript
// No console do navegador
fetch('/api/challenges/batch/1?count=5')
  .then(r => r.json())
  .then(console.log);
```

### 🔍 Testar Validação

```javascript
// Em Game.tsx ou console
const result = await dynamicChallenges.validateCommand('git add .');
console.log('Resultado:', result);
```

### 🔍 Ver Estado Atual

```javascript
// Durante o jogo
console.log('Current challenge:', dynamicChallenge);
console.log('Git state:', gitState.gitState);
console.log('Current status:', dynamicChallenges.currentState);
```

---

## 📚 Referências

- **Schema TypeScript**: `shared/schema.ts`
- **Desafios Dojo**: `client/src/lib/dojoData.ts`
- **Desafios Arcade**: `client/src/lib/arcadeData.ts`
- **Hook Dinâmico**: `client/src/hooks/useDynamicChallenges.ts`
- **API Routes**: `server/routes.ts` (endpoints `/api/challenges/*`)
- **Migrations**: `supabase/migrations/`
- **Documentação Sistema**: `CHALLENGE_SYSTEM_QUICKSTART.md`

---

## 🎓 Exemplos Práticos

### Exemplo 1: Desafio Dojo Básico

```typescript
{
  id: "dojo-20",
  scenario: "Mostre a versão do Git instalada",
  correctAnswer: "git --version",
  points: 100,
  difficulty: 1,
  timerSeconds: 8,
  blanks: [
    { text: "git [_________]", answer: "--version" }
  ]
}
```

### Exemplo 2: Desafio Arcade Intermediário

```typescript
{
  id: "arcade-25",
  scenario: "Digite o comando exato:",
  correctAnswer: "git log --oneline --all",
  points: 250,
  difficulty: 2
}
```

### Exemplo 3: Desafio Classic Multi-Step

```sql
-- Desafio: "Crie branch {{branch}}, mude para ela e faça merge de {{source}}"

-- Variáveis
INSERT INTO dynamic_variables VALUES
  ('branch', '["feature/auth", "bugfix/login", "hotfix/crash"]'::jsonb),
  ('source', '["main", "develop", "master"]'::jsonb);

-- Desafio
INSERT INTO challenges VALUES (
  DEFAULT,  -- challenge_id
  2,        -- world_id
  (SELECT state_id FROM git_states WHERE state_name = 'main_branch'),
  'Crie a branch {{branch}}, mude para ela e faça merge de {{source}}',
  NULL,     -- Multi-step não usa template único
  true,     -- is_multi_step
  400,
  3,
  20
);

-- Transições
WITH cid AS (SELECT currval('challenges_challenge_id_seq') as id)
INSERT INTO valid_transitions 
  (challenge_id, current_state_id, answer_pattern, next_state_id, is_final_step, step_order)
SELECT id, 1, 'git branch {{branch}}', 2, false, 1 FROM cid
UNION ALL
SELECT id, 2, 'git checkout {{branch}}', 3, false, 2 FROM cid
UNION ALL
SELECT id, 3, 'git merge {{source}}', 4, true, 3 FROM cid;
```

---

**Última atualização**: Novembro 2025
**Versão**: 2.0
