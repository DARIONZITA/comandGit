import { ChallengeBlock } from "@shared/schema";

// Modo 3: Arcade - Comandos completos em velocidade progressiva
export const ARCADE_CHALLENGES: ChallengeBlock[] = [
  // Nível 1 - Básico
  {
    id: "arcade-1",
    scenario: "Digite o comando exato:",
    correctAnswer: "git init",
    points: 100,
    difficulty: 1
  },
  {
    id: "arcade-2",
    scenario: "Digite o comando exato:",
    correctAnswer: "git add .",
    points: 100,
    difficulty: 1
  },
  {
    id: "arcade-3",
    scenario: "Digite o comando exato:",
    correctAnswer: "git status",
    points: 100,
    difficulty: 1
  },
  {
    id: "arcade-4",
    scenario: "Digite o comando exato:",
    correctAnswer: 'git commit -m "Initial commit"',
    points: 150,
    difficulty: 1
  },
  
  // Nível 2 - Intermediário
  {
    id: "arcade-5",
    scenario: "Digite o comando exato:",
    correctAnswer: "git checkout -b feature/login",
    points: 200,
    difficulty: 2
  },
  {
    id: "arcade-6",
    scenario: "Digite o comando exato:",
    correctAnswer: "git pull origin main",
    points: 200,
    difficulty: 2
  },
  {
    id: "arcade-7",
    scenario: "Digite o comando exato:",
    correctAnswer: "git push origin develop",
    points: 200,
    difficulty: 2
  },
  {
    id: "arcade-8",
    scenario: "Digite o comando exato:",
    correctAnswer: "git merge feature/auth",
    points: 200,
    difficulty: 2
  },
  {
    id: "arcade-9",
    scenario: "Digite o comando exato:",
    correctAnswer: "git branch -d old-feature",
    points: 250,
    difficulty: 2
  },
  {
    id: "arcade-10",
    scenario: "Digite o comando exato:",
    correctAnswer: "git log --oneline",
    points: 200,
    difficulty: 2
  },
  
  // Nível 3 - Avançado
  {
    id: "arcade-11",
    scenario: "Digite o comando exato:",
    correctAnswer: "git rebase -i HEAD~3",
    points: 300,
    difficulty: 3
  },
  {
    id: "arcade-12",
    scenario: "Digite o comando exato:",
    correctAnswer: "git log --oneline --graph",
    points: 300,
    difficulty: 3
  },
  {
    id: "arcade-13",
    scenario: "Digite o comando exato:",
    correctAnswer: "git cherry-pick abc123",
    points: 300,
    difficulty: 3
  },
  {
    id: "arcade-14",
    scenario: "Digite o comando exato:",
    correctAnswer: "git reset --hard HEAD~1",
    points: 350,
    difficulty: 3
  },
  {
    id: "arcade-15",
    scenario: "Digite o comando exato:",
    correctAnswer: "git stash apply stash@{0}",
    points: 350,
    difficulty: 3
  },
  {
    id: "arcade-16",
    scenario: "Digite o comando exato:",
    correctAnswer: "git reflog show --all",
    points: 400,
    difficulty: 3
  },
  {
    id: "arcade-17",
    scenario: "Digite o comando exato:",
    correctAnswer: 'git commit --amend -m "Fixed typo"',
    points: 350,
    difficulty: 3
  },
  {
    id: "arcade-18",
    scenario: "Digite o comando exato:",
    correctAnswer: "git push --force-with-lease",
    points: 400,
    difficulty: 3
  },
  {
    id: "arcade-19",
    scenario: "Digite o comando exato:",
    correctAnswer: "git log --all --graph --decorate",
    points: 450,
    difficulty: 3
  },
  {
    id: "arcade-20",
    scenario: "Digite o comando exato:",
    correctAnswer: "git diff --staged --stat",
    points: 400,
    difficulty: 3
  },
  // === NÍVEL 1: Básico (8 desafios) ===
  {
    id: "arcade-21",
    scenario: "Digite o comando exato:",
    correctAnswer: "git log",
    points: 100,
    difficulty: 1
  },
  {
    id: "arcade-22",
    scenario: "Digite o comando exato:",
    correctAnswer: "git diff",
    points: 110,
    difficulty: 1
  },
  {
    id: "arcade-23",
    scenario: "Digite o comando exato:",
    correctAnswer: "git tag v1.0",
    points: 120,
    difficulty: 1
  },
  {
    id: "arcade-24",
    scenario: "Digite o comando exato:",
    correctAnswer: "git push --tags",
    points: 130,
    difficulty: 1
  },
  {
    id: "arcade-25",
    scenario: "Digite o comando exato:",
    correctAnswer: "git branch -d bugfix",
    points: 120,
    difficulty: 1
  },
  {
    id: "arcade-26",
    scenario: "Digite o comando exato:",
    correctAnswer: "git checkout main",
    points: 110,
    difficulty: 1
  },
  {
    id: "arcade-27",
    scenario: "Digite o comando exato:",
    correctAnswer: "git stash",
    points: 130,
    difficulty: 1
  },
  {
    id: "arcade-28",
    scenario: "Digite o comando exato:",
    correctAnswer: "git fetch",
    points: 120,
    difficulty: 1
  },

  // === NÍVEL 2: Intermediário (9 desafios) ===
  {
    id: "arcade-29",
    scenario: "Digite o comando exato:",
    correctAnswer: "git remote add upstream https://github.com/original/repo.git",
    points: 200,
    difficulty: 2
  },
  {
    id: "arcade-30",
    scenario: "Digite o comando exato:",
    correctAnswer: "git pull --rebase",
    points: 210,
    difficulty: 2
  },
  {
    id: "arcade-31",
    scenario: "Digite o comando exato:",
    correctAnswer: "git restore index.html",
    points: 220,
    difficulty: 2
  },
  {
    id: "arcade-32",
    scenario: "Digite o comando exato:",
    correctAnswer: "git rm --cached secrets.txt",
    points: 230,
    difficulty: 2
  },
  {
    id: "arcade-33",
    scenario: "Digite o comando exato:",
    correctAnswer: "git remote -v",
    points: 190,
    difficulty: 2
  },
  {
    id: "arcade-34",
    scenario: "Digite o comando exato:",
    correctAnswer: "git show abc123",
    points: 240,
    difficulty: 2
  },
  {
    id: "arcade-35",
    scenario: "Digite o comando exato:",
    correctAnswer: "git clean -fd",
    points: 250,
    difficulty: 2
  },
  {
    id: "arcade-36",
    scenario: "Digite o comando exato:",
    correctAnswer: "git rebase main",
    points: 230,
    difficulty: 2
  },
  {
    id: "arcade-37",
    scenario: "Digite o comando exato:",
    correctAnswer: "git stash pop",
    points: 220,
    difficulty: 2
  },

  // === NÍVEL 3: Avançado (8 desafios) ===
  {
    id: "arcade-38",
    scenario: "Digite o comando exato:",
    correctAnswer: "git blame README.md",
    points: 300,
    difficulty: 3
  },
  {
    id: "arcade-39",
    scenario: "Digite o comando exato:",
    correctAnswer: "git reflog",
    points: 310,
    difficulty: 3
  },
  {
    id: "arcade-40",
    scenario: "Digite o comando exato:",
    correctAnswer: "git bisect start",
    points: 320,
    difficulty: 3
  },
  {
    id: "arcade-41",
    scenario: "Digite o comando exato:",
    correctAnswer: "git bisect bad",
    points: 300,
    difficulty: 3
  },
  {
    id: "arcade-42",
    scenario: "Digite o comando exato:",
    correctAnswer: "git worktree add ../hotfix hotfix",
    points: 350,
    difficulty: 3
  },
  {
    id: "arcade-43",
    scenario: "Digite o comando exato:",
    correctAnswer: "git submodule add https://github.com/user/utils.git lib/utils",
    points: 360,
    difficulty: 3
  },
  {
    id: "arcade-44",
    scenario: "Digite o comando exato:",
    correctAnswer: "git submodule update --init --recursive",
    points: 380,
    difficulty: 3
  },
  {
    id: "arcade-45",
    scenario: "Digite o comando exato:",
    correctAnswer: "git log --author=\"John\" --since=\"2025-01-01\"",
    points: 400,
    difficulty: 3
  }
  
];

// Configuração de velocidade por nível
export const ARCADE_SPEED_CONFIG = {
  1: { baseSpeed: 0.3, spawnInterval: 4000 },  // Bem lento
  2: { baseSpeed: 0.5, spawnInterval: 3500 },  // Lento
  3: { baseSpeed: 0.7, spawnInterval: 3000 },  // Normal
  4: { baseSpeed: 1.0, spawnInterval: 2500 },  // Rápido
  5: { baseSpeed: 1.3, spawnInterval: 2000 },  // Muito rápido
  6: { baseSpeed: 1.6, spawnInterval: 1500 },  // Extremo
  7: { baseSpeed: 2.0, spawnInterval: 1200 },  // Insano
};
