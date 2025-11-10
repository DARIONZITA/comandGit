# 🎮 Sistema de Desafios Dinâmicos - Guia Rápido

## ✅ O que foi implementado

### 📊 Banco de Dados (Supabase)
- **5 tabelas** criadas e populadas:
  - `worlds` - Mundos/níveis do jogo
  - `git_states` - Estados possíveis do Git
  - `challenges` - Desafios/missões
  - `dynamic_variables` - Pools de valores dinâmicos
  - `valid_transitions` - Comandos válidos e transições

### 🔧 Backend (Node.js + Express)
- **Game Engine** (`server/gameEngine.ts`):
  - Classe `GameEngine` para gerenciar lógica de jogo
  - Substituição dinâmica de variáveis
  - Validação de comandos com regex
  - Suporte para desafios simples e multi-etapa

- **API REST** (4 endpoints em `server/routes.ts`):
  - `GET /api/worlds` - Lista todos os mundos
  - `GET /api/worlds/:id` - Info de um mundo específico
  - `GET /api/challenges/random/:worldId` - Busca desafio aleatório
  - `POST /api/challenges/validate` - Valida comando do jogador

### ⚛️ Frontend (React + TypeScript)
- **Hook customizado** (`client/src/hooks/useDynamicChallenges.ts`):
  - `useDynamicChallenges()` - Gerencia estado do jogo
  - Funções para buscar mundos e desafios
  - Validação de comandos
  - Adaptador para migração gradual do código antigo

### 📚 Documentação
- `DATABASE_SYSTEM.md` - Documentação completa (400+ linhas)
- `database_tests.sql` - Script de testes SQL
- Este README com guia rápido

---

## 🚀 Como usar

### 1. **Testar a API**

```bash
# Buscar mundos
curl http://localhost:5000/api/worlds

# Buscar desafio do Mundo 1
curl http://localhost:5000/api/challenges/random/1

# Validar comando
curl -X POST http://localhost:5000/api/challenges/validate \
  -H "Content-Type: application/json" \
  -d '{
    "challengeId": 2,
    "currentStateId": 2,
    "command": "git add app.js",
    "variables": {"[FILE_NAME]": "app.js"}
  }'
```

### 2. **Usar no React**

```tsx
import { useDynamicChallenges } from '@/hooks/useDynamicChallenges';

function GameComponent() {
  const {
    worlds,
    currentChallenge,
    fetchRandomChallenge,
    validateCommand,
  } = useDynamicChallenges();

  // Iniciar desafio
  const handleStart = async () => {
    const challenge = await fetchRandomChallenge(1); // Mundo 1
    console.log(challenge.question); // "Adicione o arquivo app.js ao stage."
  };

  // Validar comando
  const handleCommand = async (cmd: string) => {
    const result = await validateCommand(cmd);
    if (result.success) {
      console.log('✅ Correto!', result.message);
      if (result.isFinalStep) {
        // Desafio completo!
      }
    }
  };
}
```

### 3. **Adicionar novos desafios** (via Supabase MCP)

```sql
-- Desafio simples
INSERT INTO challenges (world_id, start_state_id, question_template, is_multi_step, points, difficulty, timer_seconds)
VALUES (1, 2, 'Adicione [FILE_NAME] ao stage.', FALSE, 100, 1, 10);

-- Transição
INSERT INTO valid_transitions (challenge_id, current_state_id, answer_pattern, command_output, next_state_id, is_final_step, step_order)
VALUES (10, 2, '^git\s+add\s+([FILE_NAME]|\.)$', '', 3, TRUE, 1);
```

---

## 🎯 Desafios Disponíveis

### Mundo 1: O Básico (5 desafios)
1. `git init` - Inicializar repositório
2. `git add [FILE]` - Adicionar ao stage
3. `git commit -m "[MSG]"` - Fazer commit
4. `git status` - Verificar status
5. **Multi-etapa:** `git add` + `git commit`

### Mundo 2: Ramificações (2 desafios)
6. **Multi-etapa:** Resolver conflito (`git add` + `git commit`)
7. **Multi-etapa:** Modificar e commitar

---

## 🧪 Como testar

### Via Supabase MCP (SQL)
Execute o arquivo `database_tests.sql`:
```sql
-- Listar todos os desafios
SELECT c.challenge_id, w.world_name, c.question_template 
FROM challenges c
JOIN worlds w ON c.world_id = w.world_id;

-- Ver transições de um desafio
SELECT * FROM valid_transitions WHERE challenge_id = 5;
```

### Via Terminal (PowerShell)
```powershell
# Testar API
(Invoke-WebRequest -Uri "http://localhost:5000/api/worlds").Content

# Buscar desafio
(Invoke-WebRequest -Uri "http://localhost:5000/api/challenges/random/1").Content
```

---

## 📐 Arquitetura

```
┌─────────────────┐
│   React Hook    │ ← useDynamicChallenges()
└────────┬────────┘
         │ fetch()
         ▼
┌─────────────────┐
│   API Routes    │ ← /api/worlds, /api/challenges/*
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Game Engine    │ ← Lógica de validação
└────────┬────────┘
         │ SQL
         ▼
┌─────────────────┐
│    Supabase     │ ← 5 tabelas relacionadas
└─────────────────┘
```

---

## 🔄 Fluxo de Jogo

```
1. Player escolhe MUNDO
   ↓
2. API busca DESAFIO aleatório
   ↓
3. Engine gera VARIÁVEIS aleatórias
   ↓
4. Player vê PERGUNTA + STATUS do Git
   ↓
5. Player digita COMANDO
   ↓
6. Engine VALIDA com regex
   ↓
7a. ✅ CORRETO → Atualiza ESTADO
    ├─ Se is_final_step=TRUE → COMPLETO
    └─ Se FALSE → CONTINUA (multi-etapa)
   
7b. ❌ ERRADO → Mostra FEEDBACK
```

---

## 💡 Recursos Avançados

### Desafios Multi-Etapa
- **Regra:** "O tempo restaura, mas a questão mantém"
- Cada passo é uma transição separada
- Último passo tem `is_final_step=TRUE`

### Variáveis Dinâmicas
```sql
-- Exemplo: [FILE_NAME] pode ser:
["app.js", "index.html", "style.css", ...]

-- No desafio: "Adicione [FILE_NAME] ao stage."
-- Player vê:  "Adicione app.js ao stage."
```

### Regex Patterns
```regex
^git\s+add\s+([FILE_NAME]|\.)$        # git add <file> ou .
^git\s+commit\s+-m\s+"?([COMMIT_MSG])"?$  # git commit -m "msg"
```

---

## 📊 Estatísticas Atuais

- **3 Mundos** criados
- **7 Estados do Git** definidos
- **7 Desafios** (5 básicos + 2 avançados)
- **3 Variáveis Dinâmicas** com 18 valores
- **11 Transições Válidas**

---

## 🔜 Próximos Passos

1. ✅ **Migrar componentes existentes:**
   - Substituir `gameData.ts` pelo hook
   - Atualizar `Game.tsx` para usar a API
   - Adaptar `ChallengeBlock.tsx`

2. 🎨 **Melhorar UI:**
   - Animações de transição de estado
   - Feedback visual de comandos
   - Terminal estilizado

3. 🧠 **Adicionar mais mundos:**
   - Mundo 3: Histórico (reset, revert)
   - Mundo 4: Remoto (push, pull, fetch)
   - Mundo 5: Colaboração (branches complexos)

4. 🔥 **Recursos extras:**
   - Hints progressivos
   - Histórico de comandos
   - Replay de partidas

---

## 🆘 Troubleshooting

### Erro: "Não há transições válidas"
→ Verifique se `challenge_id` e `current_state_id` estão corretos

### Comando não valida
→ Teste o regex no SQL:
```sql
SELECT 'git add file.js' ~ '^git\s+add\s+\w+\.\w+$';
```

### Variáveis não substituem
→ Confirme que o nome está em `dynamic_variables`:
```sql
SELECT * FROM dynamic_variables WHERE variable_name = '[FILE_NAME]';
```

---

## 📞 Referências

- **Documentação completa:** `DATABASE_SYSTEM.md`
- **Testes SQL:** `database_tests.sql`
- **Modos de jogo:** `GAME_MODES.md`
- **Design:** `design_guidelines.md`

---

**Desenvolvido com ❤️ para ensinar Git de forma divertida!**
