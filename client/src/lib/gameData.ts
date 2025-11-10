import { GameWorld } from "@shared/schema";

export const GAME_WORLDS: GameWorld[] = [
  {
    id: 1,
    name: "O Básico",
    description: "Aprenda os comandos fundamentais do Git",
    commands: ["git init", "git add", "git commit", "git status"],
    unlocked: true,
    challenges: [
      {
        id: "1-1",
        scenario: "Você criou um novo arquivo 'README.md'. Prepare-o para o commit.",
        correctAnswer: "git add README.md",
        altAnswers: ["git add .", "git add -A"],
        points: 100,
        difficulty: 1
      },
      {
        id: "1-2",
        scenario: "Salve seu trabalho atual com a mensagem 'Primeiro commit'.",
        correctAnswer: 'git commit -m "Primeiro commit"',
        points: 150,
        difficulty: 1
      },
      {
        id: "1-3",
        scenario: "Inicialize um novo repositório Git no diretório atual.",
        correctAnswer: "git init",
        points: 100,
        difficulty: 1
      },
      {
        id: "1-4",
        scenario: "Verifique o status do seu repositório.",
        correctAnswer: "git status",
        points: 80,
        difficulty: 1
      },
      {
        id: "1-5",
        scenario: "Adicione todos os arquivos modificados para staging.",
        correctAnswer: "git add .",
        altAnswers: ["git add -A", "git add --all"],
        points: 120,
        difficulty: 1
      },
      {
        id: "1-6",
        scenario: "Você criou 'index.html'. Adicione-o ao stage e depois faça commit com a mensagem 'Add homepage'.",
        correctAnswer: "git add index.html", // Não usado quando há commandSequence
        commandSequence: [
          "git add index.html",
          'git commit -m "Add homepage"'
        ],
        sequenceAltAnswers: [
          ["git add .", "git add -A"], // Alternativas para o primeiro comando
          ['git commit -m "Add homepage"', 'git commit -m "add homepage"'] // Alternativas para o segundo
        ],
        points: 250,
        difficulty: 2
      }
    ]
  },
  {
    id: 2,
    name: "Ramificações",
    description: "Domine branches e merge",
    commands: ["git branch", "git checkout", "git merge", "git switch"],
    unlocked: false,
    challenges: [
      {
        id: "2-1",
        scenario: "Crie uma nova branch chamada 'feature/login'.",
        correctAnswer: "git checkout -b feature/login",
        altAnswers: ["git branch feature/login && git checkout feature/login", "git switch -c feature/login"],
        points: 200,
        difficulty: 2
      },
      {
        id: "2-2",
        scenario: "Mude para a branch 'main'.",
        correctAnswer: "git checkout main",
        altAnswers: ["git switch main"],
        points: 150,
        difficulty: 2
      },
      {
        id: "2-3",
        scenario: "Faça merge da branch 'feature/login' na branch atual.",
        correctAnswer: "git merge feature/login",
        points: 250,
        difficulty: 2
      },
      {
        id: "2-4",
        scenario: "Liste todas as branches do repositório.",
        correctAnswer: "git branch",
        altAnswers: ["git branch -a", "git branch --list"],
        points: 120,
        difficulty: 2
      },
      {
        id: "2-5",
        scenario: "Workflow completo: Crie a branch 'hotfix', adicione o arquivo 'patch.js', e faça commit com a mensagem 'Fix bug'.",
        correctAnswer: "git checkout -b hotfix", // Não usado quando há commandSequence
        commandSequence: [
          "git checkout -b hotfix",
          "git add patch.js",
          'git commit -m "Fix bug"'
        ],
        sequenceAltAnswers: [
          ["git switch -c hotfix", "git branch hotfix && git checkout hotfix"],
          ["git add .", "git add -A"],
          ['git commit -m "Fix bug"', 'git commit -m "fix bug"']
        ],
        points: 400,
        difficulty: 3
      }
    ]
  },
  {
    id: 3,
    name: "Trabalho Remoto",
    description: "Colabore com repositórios remotos",
    commands: ["git clone", "git push", "git pull", "git fetch"],
    unlocked: false,
    challenges: [
      {
        id: "3-1",
        scenario: "Clone o repositório https://github.com/user/repo.git",
        correctAnswer: "git clone https://github.com/user/repo.git",
        points: 200,
        difficulty: 3
      },
      {
        id: "3-2",
        scenario: "Envie suas alterações para a branch 'main' no repositório remoto.",
        correctAnswer: "git push origin main",
        points: 250,
        difficulty: 3
      },
      {
        id: "3-3",
        scenario: "Baixe e integre as mudanças do repositório remoto.",
        correctAnswer: "git pull",
        altAnswers: ["git pull origin main"],
        points: 220,
        difficulty: 3
      }
    ]
  }
];

export function validateCommand(userInput: string, correctAnswer: string, altAnswers?: string[]): boolean {
  const normalized = userInput.trim().toLowerCase();
  const correct = correctAnswer.toLowerCase();
  
  if (normalized === correct) return true;
  
  if (altAnswers) {
    return altAnswers.some(alt => normalized === alt.toLowerCase());
  }
  
  return false;
}
