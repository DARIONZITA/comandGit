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
