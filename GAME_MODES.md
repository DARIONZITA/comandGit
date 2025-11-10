# 🎮 Git Command Runner - Novos Modos de Jogo

## ✅ Implementação Completa

### 📋 Resumo das Mudanças

#### **1. Modo Normal (Clássico)**
- ✅ Mantido como estava
- ✅ Cenários contextuais do Git
- ✅ Respostas flexíveis (aceita comandos alternativos)

#### **2. Modo Dojo de Sintaxe** 🥋
- ✅ Componente `DojoChallengeBlock.tsx` - Exibe comandos com lacunas
- ✅ Componente `DojoInput.tsx` - Input especializado para preencher lacunas
- ✅ Arquivo `dojoData.ts` - 15 desafios de preenchimento
- ✅ Validação específica (compara apenas a lacuna)
- ✅ Visual diferenciado (azul, ícone BookOpen)

**Exemplos de Desafios:**
```
git clone [________________]  → Jogador digita: https://github.com/user/repo.git
git commit [__] "Mensagem"     → Jogador digita: -m
git rebase [__] HEAD~3         → Jogador digita: -i
```

#### **3. Modo Arcade (Velocidade)** ⚡
- ✅ Componente `ArcadeChallengeBlock.tsx` - Exibe comando completo com indicador de velocidade
- ✅ Arquivo `arcadeData.ts` - 20 comandos + configuração de velocidade por nível
- ✅ Sistema de velocidade progressiva (7 níveis de dificuldade)
- ✅ Validação EXATA (case-sensitive, sem alternativas)
- ✅ Visual diferenciado (laranja, ícone Gauge, indicador de velocidade)

**Exemplos de Comandos:**
```
NÍVEL 1: git init
NÍVEL 2: git checkout -b feature/login
NÍVEL 3: git rebase -i HEAD~3
NÍVEL 7: git push --force-with-lease (INSANO!)
```

**Progressão de Velocidade:**
- Nível 1: LENTO (0.3x, spawn 4s)
- Nível 3: NORMAL (0.7x, spawn 3s)
- Nível 5: MUITO RÁPIDO (1.3x, spawn 2s)
- Nível 7: INSANO (2.0x, spawn 1.2s)

---

## 📂 Arquivos Criados/Modificados

### Novos Arquivos:
- ✅ `client/src/lib/dojoData.ts` - Desafios do modo Dojo
- ✅ `client/src/lib/arcadeData.ts` - Desafios e configuração do modo Arcade
- ✅ `client/src/components/DojoInput.tsx` - Input para modo Dojo
- ✅ `client/src/components/DojoChallengeBlock.tsx` - Bloco de desafio Dojo
- ✅ `client/src/components/ArcadeChallengeBlock.tsx` - Bloco de desafio Arcade

### Arquivos Modificados:
- ✅ `shared/schema.ts` - Adicionado tipo `GameMode` e campo `blanks`
- ✅ `client/src/components/MainMenu.tsx` - 3 cards para escolher modo
- ✅ `client/src/pages/Home.tsx` - Suporte a parâmetro `mode`
- ✅ `client/src/pages/Game.tsx` - Lógica multi-modo completa
- ✅ `client/src/App.tsx` - Roteamento com query param `?mode=`
- ✅ `client/src/components/Leaderboard.tsx` - Fix TypeScript

---

## 🎨 Visual do Menu Principal

```
┌─────────────────────────────────────────────────┐
│  GIT COMMAND RUNNER                             │
│  Aprenda Git através de um jogo arcade viciante│
├─────────────────────────────────────────────────┤
│  Escolha seu Modo de Jogo                       │
│                                                  │
│  🎯 MODO 1: CLÁSSICO                            │
│     Complete os desafios respondendo cenários   │
│     [JOGAR]                                      │
│                                                  │
│  📖 MODO 2: DOJO DE SINTAXE                     │
│     Preencha as lacunas nos comandos Git        │
│     [TREINAR]                                    │
│                                                  │
│  ⚡ MODO 3: ARCADE (VELOCIDADE)                 │
│     Digite comandos completos o mais rápido! 🔥 │
│     [RUSH!]                                      │
└─────────────────────────────────────────────────┘
```

---

## 🔧 Como Funciona

### Modo Dojo:
1. Bloco cai com comando: `git push origin [________________]`
2. Jogador digita apenas: `main`
3. Validação compara: `input === "main"`
4. ✅ Correto → Pontos + Combo

### Modo Arcade:
1. Bloco cai com comando completo: `git rebase -i HEAD~3`
2. Jogador deve digitar EXATAMENTE (incluindo maiúsculas)
3. Validação: `input === "git rebase -i HEAD~3"`
4. Velocidade aumenta progressivamente a cada nível
5. ✅ Correto → Pontos com multiplicador de combo maior (x2 em vez de x3)

### Modo Normal:
1. Mantém comportamento original
2. Aceita respostas alternativas
3. Case-insensitive

---

## 🎮 Características Únicas por Modo

| Característica | Normal | Dojo | Arcade |
|---------------|---------|------|--------|
| **Validação** | Flexível | Lacuna específica | Exata |
| **Velocidade** | Normal | Normal | Progressiva (7 níveis) |
| **Combo** | x3 | x3 | x2 (mais generoso) |
| **Dificuldade** | Cenários | Sintaxe | Velocidade + Precisão |
| **High Score** | Separado | Separado | Separado |

---

## 🚀 Pronto para Jogar!

Todos os 3 modos estão funcionando e integrados! O jogador pode:
- Escolher qualquer modo no menu principal
- Ver seu high score específico para cada modo
- Progredir em níveis infinitos
- Competir no placar (cada modo salva separadamente)
