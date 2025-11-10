# 🎮 Sistema de Desafios Dinâmicos - Documentação Completa

## 📋 Visão Geral

Este sistema implementa um **simulador de Git baseado em banco de dados** onde cada desafio é uma "missão" que o jogador deve completar usando comandos Git. O sistema suporta tanto **desafios simples** (um comando) quanto **desafios multi-etapa** (sequências de comandos).

---

## 🗄️ Estrutura do Banco de Dados

### 1. **Tabela: `worlds`**
Define os níveis/mundos do jogo.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `world_id` | SERIAL (PK) | ID único do mundo |
| `world_level` | INTEGER | Ordem de progressão (1, 2, 3...) |
| `world_name` | TEXT | Nome do mundo ("O Básico", "Ramificações") |
| `description` | TEXT | Descrição do que o jogador aprenderá |

**Exemplo:**
```sql
INSERT INTO worlds (world_level, world_name, description) VALUES
(1, 'O Básico', 'Aprenda os comandos fundamentais: init, add, commit, status');
```

---

### 2. **Tabela: `git_states`**
Define os estados do Git que o jogador pode experimentar.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `state_id` | SERIAL (PK) | ID único do estado |
| `state_name` | TEXT | Nome do estado ("Clean", "Untracked", "Staged") |
| `status_template` | TEXT | Template do `git status` com variáveis |
| `description` | TEXT | Descrição do estado |

**Exemplo:**
```sql
INSERT INTO git_states (state_name, status_template, description) VALUES
('Untracked', 
 'On branch main\nUntracked files:\n  (use "git add <file>..." to include in what will be committed)\n\t[FILE_NAME]\n\nnothing added to commit but untracked files present',
 'Arquivos não rastreados presentes');
```

**Variáveis Suportadas:** `[FILE_NAME]`, `[COMMIT_MSG]`, `[BRANCH_NAME]`, etc.

---

### 3. **Tabela: `challenges`**
Define as "missões" que o jogador deve completar.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `challenge_id` | SERIAL (PK) | ID único do desafio |
| `world_id` | INTEGER (FK) | Mundo ao qual pertence |
| `start_state_id` | INTEGER (FK) | Estado inicial do desafio |
| `question_template` | TEXT | Pergunta com variáveis |
| `is_multi_step` | BOOLEAN | `true` para sequências, `false` para comando único |
| `points` | INTEGER | Pontos ao completar |
| `difficulty` | INTEGER | Nível de dificuldade (1-5) |
| `timer_seconds` | INTEGER | Tempo limite por passo |

**Exemplo Simples (1 comando):**
```sql
INSERT INTO challenges (world_id, start_state_id, question_template, is_multi_step, points, difficulty, timer_seconds)
VALUES (1, 2, 'Adicione o arquivo [FILE_NAME] à área de stage.', FALSE, 100, 1, 10);
```

**Exemplo Multi-Etapa (2+ comandos):**
```sql
INSERT INTO challenges (world_id, start_state_id, question_template, is_multi_step, points, difficulty, timer_seconds)
VALUES (1, 2, 'Prepare e salve [FILE_NAME] com a mensagem "[COMMIT_MSG]".', TRUE, 200, 2, 20);
```

---

### 4. **Tabela: `dynamic_variables`**
Armazena pools de valores para tornar os desafios variados.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `variable_name` | TEXT (PK) | Nome da variável (`[FILE_NAME]`) |
| `value_pool` | JSONB | Array de valores possíveis |
| `description` | TEXT | Descrição da variável |

**Exemplo:**
```sql
INSERT INTO dynamic_variables (variable_name, value_pool, description) VALUES
('[FILE_NAME]', '["app.js", "index.html", "style.css", "config.json"]', 'Nomes de arquivos comuns'),
('[COMMIT_MSG]', '["feat: login", "fix: bug na API", "docs: atualiza README"]', 'Mensagens de commit');
```

---

### 5. **Tabela: `valid_transitions`** ⭐ (O CÉREBRO DO SISTEMA)
Define os comandos válidos e as transições entre estados.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `transition_id` | SERIAL (PK) | ID único da transição |
| `challenge_id` | INTEGER (FK) | Desafio ao qual pertence |
| `current_state_id` | INTEGER (FK) | Estado atual necessário |
| `answer_pattern` | TEXT | Regex do comando correto |
| `command_output` | TEXT | Output simulado do comando |
| `next_state_id` | INTEGER (FK) | Próximo estado após sucesso |
| `is_final_step` | BOOLEAN | `true` se completa o desafio |
| `step_order` | INTEGER | Ordem do passo (1, 2, 3...) |

**Exemplo - Comando Simples:**
```sql
-- Desafio 102: git add [FILE_NAME]
INSERT INTO valid_transitions (challenge_id, current_state_id, answer_pattern, command_output, next_state_id, is_final_step, step_order)
VALUES (2, 2, '^git\s+add\s+([FILE_NAME]|\.)$', '', 3, TRUE, 1);
```

**Exemplo - Multi-Etapa:**
```sql
-- Passo 1: git add
INSERT INTO valid_transitions (challenge_id, current_state_id, answer_pattern, command_output, next_state_id, is_final_step, step_order)
VALUES (5, 2, '^git\s+add\s+([FILE_NAME]|\.)$', '', 3, FALSE, 1);

-- Passo 2: git commit (final)
INSERT INTO valid_transitions (challenge_id, current_state_id, answer_pattern, command_output, next_state_id, is_final_step, step_order)
VALUES (5, 3, '^git\s+commit\s+-m\s+"?([COMMIT_MSG])"?$', '[main 2b3c4d5] [COMMIT_MSG]\n 1 file changed, 1 insertion(+)', 1, TRUE, 2);
```

---

## 🔄 Fluxo de Jogo

### Exemplo 1: Desafio Simples (git commit)

#### **Setup Inicial**
1. Jogo busca desafio do Mundo 1:
```json
{
  "challengeId": 102,
  "worldId": 1,
  "startStateId": 3,
  "questionTemplate": "Faça um commit com a mensagem '[COMMIT_MSG]'.",
  "isMultiStep": false
}
```

2. Engine seleciona variáveis aleatórias:
```json
{
  "[COMMIT_MSG]": "feat: login"
}
```

3. Jogador vê:
```
📝 Pergunta: Faça um commit com a mensagem 'feat: login'.

$ git status
On branch main
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
        new file:   app.js
```

#### **Jogador Digita**
```bash
git commit -m "feat: login"
```

#### **Validação**
1. Engine busca em `valid_transitions` onde:
   - `challenge_id = 102`
   - `current_state_id = 3`

2. Encontra a transição:
```sql
answer_pattern: '^git\s+commit\s+-m\s+"?([COMMIT_MSG])"?$'
is_final_step: TRUE
```

3. Substitui `[COMMIT_MSG]` → `feat: login` no regex
4. Testa: `git commit -m "feat: login"` ✅ MATCH!

#### **Resultado**
```json
{
  "success": true,
  "commandOutput": "[main 1a2b3c4] feat: login\n 1 file changed, 1 insertion(+)",
  "nextStateId": 1,
  "isFinalStep": true,
  "message": "Desafio completo!"
}
```

---

### Exemplo 2: Desafio Multi-Etapa (Resolver Conflito)

#### **Setup Inicial**
```json
{
  "challengeId": 104,
  "worldId": 2,
  "startStateId": 4,
  "questionTemplate": "Conflito detectado! Resolva o conflito em [FILE_NAME] e complete o merge.",
  "isMultiStep": true,
  "variables": {
    "[FILE_NAME]": "index.html"
  }
}
```

#### **Passo 1: git add**

**Jogador vê:**
```
❗ Pergunta: Conflito detectado! Resolva o conflito em index.html e complete o merge.
⏱️ Timer: 25s

$ git status
On branch main
You have unmerged paths.
  (fix conflicts and run "git commit")

Unmerged paths:
  (use "git add <file>..." to mark resolution)
        both modified:   index.html
```

**Jogador digita:**
```bash
git add index.html
```

**Validação:**
- Engine busca: `challenge_id=104 AND current_state_id=4`
- Encontra: `answer_pattern: '^git\s+add\s+([FILE_NAME]|\.)$'`
- `is_final_step: FALSE` ⚠️ **Não terminou!**

**Resultado:**
```json
{
  "success": true,
  "commandOutput": "",
  "nextStateId": 5,
  "isFinalStep": false,
  "message": "Passo correto! Continue..."
}
```

**Estado atualiza para 5:**
```
$ git status
On branch main
All conflicts fixed but you are still merging.
  (use "git commit" to conclude merge)

Changes to be committed:
        modified:   index.html
```

**Timer restaura para 25s** (regra: "o tempo restaura, mas a questão mantém")

---

#### **Passo 2: git commit**

**Jogador digita:**
```bash
git commit
```

**Validação:**
- Engine busca: `challenge_id=104 AND current_state_id=5`
- Encontra: `answer_pattern: '^git\s+commit$'`
- `is_final_step: TRUE` ✅ **Completo!**

**Resultado:**
```json
{
  "success": true,
  "commandOutput": "[main 3c4d5e6] Merge branch 'feature'\n",
  "nextStateId": 1,
  "isFinalStep": true,
  "message": "Desafio completo!"
}
```

---

## 🚀 API Endpoints

### **GET /api/worlds**
Retorna todos os mundos disponíveis.

**Response:**
```json
[
  {
    "world_id": 1,
    "world_level": 1,
    "world_name": "O Básico",
    "description": "Aprenda os comandos fundamentais"
  },
  {
    "world_id": 2,
    "world_level": 2,
    "world_name": "Ramificações",
    "description": "Domine branches e merge"
  }
]
```

---

### **GET /api/worlds/:worldId**
Retorna informações detalhadas de um mundo.

**Response:**
```json
{
  "world_id": 1,
  "world_level": 1,
  "world_name": "O Básico",
  "description": "Aprenda os comandos fundamentais",
  "totalChallenges": 5
}
```

---

### **GET /api/challenges/random/:worldId**
Retorna um desafio aleatório do mundo especificado.

**Response:**
```json
{
  "challengeId": 102,
  "worldId": 1,
  "worldName": "O Básico",
  "questionTemplate": "Adicione o arquivo [FILE_NAME] à área de stage.",
  "question": "Adicione o arquivo app.js à área de stage.",
  "isMultiStep": false,
  "points": 100,
  "difficulty": 1,
  "timerSeconds": 10,
  "currentStateId": 2,
  "currentStatus": "On branch main\nUntracked files:\n  (use \"git add <file>...\" to include in what will be committed)\n\tapp.js\n\nnothing added to commit but untracked files present",
  "variables": {
    "[FILE_NAME]": "app.js"
  }
}
```

---

### **POST /api/challenges/validate**
Valida um comando do jogador.

**Request Body:**
```json
{
  "challengeId": 102,
  "currentStateId": 2,
  "command": "git add app.js",
  "variables": {
    "[FILE_NAME]": "app.js"
  }
}
```

**Response (Sucesso):**
```json
{
  "success": true,
  "commandOutput": "",
  "nextStateId": 3,
  "nextStatus": "On branch main\nChanges to be committed:\n  (use \"git restore --staged <file>...\" to unstage)\n\tnew file:   app.js",
  "isFinalStep": true,
  "message": "Desafio completo!"
}
```

**Response (Erro):**
```json
{
  "success": false,
  "commandOutput": "Comando incorreto. Tente novamente!",
  "nextStateId": 2,
  "nextStatus": "",
  "isFinalStep": false,
  "message": "O comando não corresponde ao esperado."
}
```

---

## 🧪 Como Adicionar Novos Desafios

### 1. **Desafio Simples (1 Comando)**

```sql
-- 1. Inserir o desafio
INSERT INTO challenges (world_id, start_state_id, question_template, is_multi_step, points, difficulty, timer_seconds)
VALUES (1, 2, 'Verifique o status do repositório.', FALSE, 50, 1, 8);
-- Retorna challenge_id = 10

-- 2. Inserir a transição
INSERT INTO valid_transitions (challenge_id, current_state_id, answer_pattern, command_output, next_state_id, is_final_step, step_order)
VALUES (10, 2, '^git\s+status$', 'On branch main\nUntracked files:\n  [FILE_NAME]', 2, TRUE, 1);
```

---

### 2. **Desafio Multi-Etapa (3 Comandos)**

```sql
-- 1. Inserir o desafio
INSERT INTO challenges (world_id, start_state_id, question_template, is_multi_step, points, difficulty, timer_seconds)
VALUES (2, 2, 'Prepare, commit e envie [FILE_NAME] para o remoto.', TRUE, 300, 3, 30);
-- Retorna challenge_id = 15

-- 2. Passo 1: git add
INSERT INTO valid_transitions (challenge_id, current_state_id, answer_pattern, command_output, next_state_id, is_final_step, step_order)
VALUES (15, 2, '^git\s+add\s+([FILE_NAME]|\.)$', '', 3, FALSE, 1);

-- 3. Passo 2: git commit
INSERT INTO valid_transitions (challenge_id, current_state_id, answer_pattern, command_output, next_state_id, is_final_step, step_order)
VALUES (15, 3, '^git\s+commit\s+-m\s+"?([COMMIT_MSG])"?$', '[main abc123] [COMMIT_MSG]', 1, FALSE, 2);

-- 4. Passo 3: git push (final)
INSERT INTO valid_transitions (challenge_id, current_state_id, answer_pattern, command_output, next_state_id, is_final_step, step_order)
VALUES (15, 1, '^git\s+push(\s+origin\s+main)?$', 'To github.com:user/repo.git\n   abc123..def456  main -> main', 1, TRUE, 3);
```

---

## 🎯 Regex Patterns para Comandos Git

### Comandos Básicos
```regex
^git\s+init$                                    # git init
^git\s+status$                                  # git status
^git\s+add\s+([FILE_NAME]|\.)$                  # git add <file> ou git add .
^git\s+commit\s+-m\s+"?([COMMIT_MSG])"?$        # git commit -m "msg"
^git\s+push(\s+origin\s+main)?$                 # git push [origin main]
^git\s+pull(\s+origin\s+main)?$                 # git pull [origin main]
```

### Comandos de Branch
```regex
^git\s+branch\s+([BRANCH_NAME])$                # git branch <nome>
^git\s+checkout\s+([BRANCH_NAME])$              # git checkout <nome>
^git\s+merge\s+([BRANCH_NAME])$                 # git merge <nome>
^git\s+branch\s+-d\s+([BRANCH_NAME])$           # git branch -d <nome>
```

### Comandos Avançados
```regex
^git\s+log(\s+--oneline)?$                      # git log [--oneline]
^git\s+diff$                                    # git diff
^git\s+reset\s+--hard\s+HEAD~\d+$               # git reset --hard HEAD~1
^git\s+revert\s+[a-f0-9]{7}$                    # git revert <hash>
```

---

## 📊 Exemplo de Mundo Completo

```sql
-- MUNDO: "O Básico" (5 desafios)

-- Estado inicial: Limpo
INSERT INTO git_states (state_name, status_template) VALUES
('Clean', 'On branch main\nnothing to commit, working tree clean');

-- Desafio 1: git init
INSERT INTO challenges VALUES (1, 1, 'Inicialize um repositório Git.', FALSE, 50, 1, 10);
INSERT INTO valid_transitions VALUES (1, 1, '^git\s+init$', 'Initialized empty Git repository in .git/', 7, TRUE, 1);

-- Desafio 2: git status
INSERT INTO challenges VALUES (2, 2, 'Verifique o status do repositório.', FALSE, 50, 1, 8);
INSERT INTO valid_transitions VALUES (2, 2, '^git\s+status$', 'On branch main\nUntracked files:\n  [FILE_NAME]', 2, TRUE, 1);

-- Desafio 3: git add
INSERT INTO challenges VALUES (3, 2, 'Adicione [FILE_NAME] ao stage.', FALSE, 100, 1, 10);
INSERT INTO valid_transitions VALUES (3, 2, '^git\s+add\s+([FILE_NAME]|\.)$', '', 3, TRUE, 1);

-- Desafio 4: git commit
INSERT INTO challenges VALUES (4, 3, 'Commit com "[COMMIT_MSG]".', FALSE, 150, 1, 15);
INSERT INTO valid_transitions VALUES (4, 3, '^git\s+commit\s+-m\s+"?([COMMIT_MSG])"?$', '[main abc123] [COMMIT_MSG]', 1, TRUE, 1);

-- Desafio 5: Sequência add + commit
INSERT INTO challenges VALUES (5, 2, 'Prepare e salve [FILE_NAME].', TRUE, 200, 2, 20);
INSERT INTO valid_transitions VALUES (5, 2, '^git\s+add\s+([FILE_NAME]|\.)$', '', 3, FALSE, 1);
INSERT INTO valid_transitions VALUES (5, 3, '^git\s+commit\s+-m\s+"?([COMMIT_MSG])"?$', '[main def456] [COMMIT_MSG]', 1, TRUE, 2);
```

---

## 🔥 Vantagens do Sistema

✅ **Flexível:** Adicionar novos desafios é só inserir dados no banco  
✅ **Escalável:** Suporta sequências complexas de qualquer tamanho  
✅ **Dinâmico:** Variáveis aleatórias tornam cada partida única  
✅ **Realista:** Simula o comportamento real do Git  
✅ **Educativo:** Ensina Git através da prática  

---

## 🧩 Próximos Passos

1. **Adicionar mais mundos:**
   - Mundo 3: Histórico (reset, revert, checkout)
   - Mundo 4: Remoto (push, pull, fetch)
   - Mundo 5: Colaboração (pull requests, forks)

2. **Melhorar validação:**
   - Suportar aliases do Git
   - Validar argumentos mais complexos
   - Feedback contextual em erros

3. **Integração com Frontend:**
   - Substituir `gameData.ts` com chamadas à API
   - Criar componentes React para visualizar states
   - Adicionar animações de transição

---

## 📞 Suporte

Para dúvidas ou sugestões, consulte:
- `GAME_MODES.md` - Detalhes dos modos de jogo
- `design_guidelines.md` - Diretrizes de design
- `SECURITY.md` - Boas práticas de segurança

---

**Desenvolvido com ❤️ para ensinar Git de forma divertida!**
