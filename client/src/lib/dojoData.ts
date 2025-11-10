import { ChallengeBlock } from "@shared/schema";

// Modo 2: Dojo de Sintaxe - Desafios com preenchimento de lacunas
export const DOJO_CHALLENGES: ChallengeBlock[] = [
  {
    id: "dojo-1",
    scenario: "Clone o repositório",
    correctAnswer: "git clone https://github.com/user/repo.git",
    points: 150,
    difficulty: 1,
    timerSeconds: 10,
    blanks: [
      { text: "git clone [________________]", answer: "https://github.com/user/repo.git" }
    ]
  },
  {
    id: "dojo-2",
    scenario: "Envie para a branch main",
    correctAnswer: "git push origin main",
    points: 150,
    difficulty: 1,
    timerSeconds: 10,
    blanks: [
      { text: "git push origin [________________]", answer: "main" }
    ]
  },
  {
    id: "dojo-3",
    scenario: "Faça commit com mensagem",
    correctAnswer: 'git commit -m "Implementação completa"',
    points: 200,
    difficulty: 2,
    timerSeconds: 12,
    blanks: [
      { text: 'git commit [__] "Implementação completa"', answer: "-m" }
    ]
  },
  {
    id: "dojo-4",
    scenario: "Crie e mude para uma nova branch",
    correctAnswer: "git checkout -b feature/new",
    points: 200,
    difficulty: 2,
    timerSeconds: 12,
    blanks: [
      { text: "git checkout [__] feature/new", answer: "-b" }
    ]
  },
  {
    id: "dojo-5",
    scenario: "Puxe mudanças do remoto",
    correctAnswer: "git pull origin develop",
    points: 150,
    difficulty: 1,
    timerSeconds: 10,
    blanks: [
      { text: "git pull [________________] develop", answer: "origin" }
    ]
  },
  {
    id: "dojo-6",
    scenario: "Adicione todas as mudanças",
    correctAnswer: "git add .",
    points: 100,
    difficulty: 1,
    timerSeconds: 8,
    blanks: [
      { text: "git add [__]", answer: "." }
    ]
  },
  {
    id: "dojo-7",
    scenario: "Faça rebase interativo dos últimos 3 commits",
    correctAnswer: "git rebase -i HEAD~3",
    points: 300,
    difficulty: 3,
    timerSeconds: 15,
    blanks: [
      { text: "git rebase [__] HEAD~3", answer: "-i" }
    ]
  },
  {
    id: "dojo-8",
    scenario: "Mostre log em formato gráfico resumido",
    correctAnswer: "git log --oneline --graph",
    points: 250,
    difficulty: 2,
    timerSeconds: 12,
    blanks: [
      { text: "git log [__________] [_______]", answer: "--oneline --graph" }
    ]
  },
  {
    id: "dojo-9",
    scenario: "Desfaça o último commit mantendo as mudanças",
    correctAnswer: "git reset --soft HEAD~1",
    points: 250,
    difficulty: 3,
    timerSeconds: 14,
    blanks: [
      { text: "git reset [______] HEAD~1", answer: "--soft" }
    ]
  },
  {
    id: "dojo-10",
    scenario: "Force push para origin",
    correctAnswer: "git push origin main --force",
    points: 300,
    difficulty: 3,
    timerSeconds: 14,
    blanks: [
      { text: "git push origin main [_______]", answer: "--force" }
    ]
  },
  {
    id: "dojo-11",
    scenario: "Stash suas mudanças",
    correctAnswer: "git stash",
    points: 150,
    difficulty: 2,
    timerSeconds: 10,
    blanks: [
      { text: "git [_____]", answer: "stash" }
    ]
  },
  {
    id: "dojo-12",
    scenario: "Aplique o último stash",
    correctAnswer: "git stash pop",
    points: 200,
    difficulty: 2,
    timerSeconds: 10,
    blanks: [
      { text: "git stash [___]", answer: "pop" }
    ]
  },
  {
    id: "dojo-13",
    scenario: "Mostre diferenças não staged",
    correctAnswer: "git diff",
    points: 100,
    difficulty: 1,
    timerSeconds: 8,
    blanks: [
      { text: "git [____]", answer: "diff" }
    ]
  },
  {
    id: "dojo-14",
    scenario: "Remova arquivo do staging",
    correctAnswer: "git reset HEAD file.txt",
    points: 200,
    difficulty: 2,
    timerSeconds: 12,
    blanks: [
      { text: "git reset [____] file.txt", answer: "HEAD" }
    ]
  },
  {
    id: "dojo-15",
    scenario: "Mostre commits de um autor específico",
    correctAnswer: 'git log --author="John"',
    points: 250,
    difficulty: 2,
    timerSeconds: 12,
    blanks: [
      { text: 'git log [________]="John"', answer: "--author" }
    ]
  }
];
