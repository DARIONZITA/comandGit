// client/src/lib/dojoData.ts
export const DOJO_CHALLENGES = [
  // ==================== FASE 1: BÁSICO (20 desafios) ====================
  { id: "dojo-1", worldId: 1, scenario: "Inicialize um repositório Git", correctAnswer: "git init", points: 100, difficulty: 1, timerSeconds: 8,
    blanks: [{ text: "git [_______]", answer: "init" }] },

  { id: "dojo-2", worldId: 1, scenario: "Adicione todos os arquivos ao stage", correctAnswer: "git add .", points: 110, difficulty: 1, timerSeconds: 9,
    blanks: [{ text: "git add [______]", answer: "." }] },

  { id: "dojo-3", worldId: 1, scenario: "Faça commit com mensagem 'Primeiro commit'", correctAnswer: "git commit -m \"Primeiro commit\"", points: 120, difficulty: 1, timerSeconds: 10,
    blanks: [{ text: "git commit -m \"[___________________]\"", answer: "Primeiro commit" }] },

  { id: "dojo-4", worldId: 1, scenario: "Mostre o status do repositório", correctAnswer: "git status", points: 100, difficulty: 1, timerSeconds: 8,
    blanks: [{ text: "git [______]", answer: "status" }] },

  { id: "dojo-5", worldId: 1, scenario: "Veja o histórico resumido", correctAnswer: "git log --oneline", points: 130, difficulty: 1, timerSeconds: 10,
    blanks: [{ text: "git log [__________]", answer: "--oneline" }] },

  { id: "dojo-6", worldId: 1, scenario: "Crie uma branch chamada 'dev'", correctAnswer: "git branch dev", points: 140, difficulty: 1, timerSeconds: 12,
    blanks: [{ text: "git branch [___]", answer: "dev" }] },

  { id: "dojo-7", worldId: 1, scenario: "Mude para a branch 'dev'", correctAnswer: "git checkout dev", points: 130, difficulty: 1, timerSeconds: 11,
    blanks: [{ text: "git checkout [___]", answer: "dev" }] },

  { id: "dojo-8", worldId: 1, scenario: "Crie e mude para branch 'feature'", correctAnswer: "git checkout -b feature", points: 150, difficulty: 1, timerSeconds: 13,
    blanks: [{ text: "git checkout -b [_______]", answer: "feature" }] },

  { id: "dojo-9", worldId: 1, scenario: "Faça merge da 'main' na atual", correctAnswer: "git merge main", points: 140, difficulty: 1, timerSeconds: 12,
    blanks: [{ text: "git merge [____]", answer: "main" }] },

  { id: "dojo-10", worldId: 1, scenario: "Renomeie branch atual para 'hotfix'", correctAnswer: "git branch -M hotfix", points: 160, difficulty: 1, timerSeconds: 13,
    blanks: [{ text: "git branch -M [______]", answer: "hotfix" }] },

  { id: "dojo-11", worldId: 1, scenario: "Veja o histórico de commits em uma linha por commit", correctAnswer: "git log --oneline", points: 120, difficulty: 1, timerSeconds: 10,
    blanks: [{ text: "git log [___________]", answer: "--oneline" }] },

  { id: "dojo-12", worldId: 1, scenario: "Mostre as diferenças entre o arquivo atual e o último commit", correctAnswer: "git diff", points: 130, difficulty: 1, timerSeconds: 11,
    blanks: [{ text: "git [____]", answer: "diff" }] },

  { id: "dojo-13", worldId: 1, scenario: "Crie uma tag chamada 'v1.0' no commit atual", correctAnswer: "git tag v1.0", points: 140, difficulty: 1, timerSeconds: 12,
    blanks: [{ text: "git tag [____]", answer: "v1.0" }] },

  { id: "dojo-14", worldId: 1, scenario: "Envie todas as tags locais para o repositório remoto", correctAnswer: "git push --tags", points: 150, difficulty: 1, timerSeconds: 13,
    blanks: [{ text: "git push [_______]", answer: "--tags" }] },

  { id: "dojo-15", worldId: 1, scenario: "Delete a branch local 'old-feature' (já mesclada)", correctAnswer: "git branch -d old-feature", points: 140, difficulty: 1, timerSeconds: 12,
    blanks: [{ text: "git branch -d [___________]", answer: "old-feature" }] },

  { id: "dojo-16", worldId: 1, scenario: "Mude para a branch 'main'", correctAnswer: "git checkout main", points: 120, difficulty: 1, timerSeconds: 10,
    blanks: [{ text: "git checkout [____]", answer: "main" }] },

  { id: "dojo-17", worldId: 1, scenario: "Salve as alterações atuais em um stash", correctAnswer: "git stash", points: 130, difficulty: 1, timerSeconds: 11,
    blanks: [{ text: "git [_____]", answer: "stash" }] },

  { id: "dojo-18", worldId: 1, scenario: "Recupere o último stash salvo", correctAnswer: "git stash pop", points: 140, difficulty: 1, timerSeconds: 12,
    blanks: [{ text: "git stash [___]", answer: "pop" }] },

  { id: "dojo-19", worldId: 1, scenario: "Clone o repositório do GitHub", correctAnswer: "git clone https://github.com/user/repo.git", points: 150, difficulty: 1, timerSeconds: 13,
    blanks: [{ text: "git clone [_________________________]", answer: "https://github.com/user/repo.git" }] },

  { id: "dojo-20", worldId: 1, scenario: "Baixe as atualizações do remoto sem mesclar", correctAnswer: "git fetch", points: 130, difficulty: 1, timerSeconds: 11,
    blanks: [{ text: "git [_____]", answer: "fetch" }] },

  // ==================== FASE 2: INTERMEDIÁRIO (20 desafios) ====================
  { id: "dojo-21", worldId: 2, scenario: "Faça rebase interativo dos últimos 2 commits", correctAnswer: "git rebase -i HEAD~2", points: 300, difficulty: 2, timerSeconds: 15,
    blanks: [{ text: "git rebase -i HEAD~[2]", answer: "2" }] },

  { id: "dojo-22", worldId: 2, scenario: "Remova arquivo do stage", correctAnswer: "git reset HEAD index.html", points: 280, difficulty: 2, timerSeconds: 14,
    blanks: [{ text: "git reset HEAD [__________]", answer: "index.html" }] },

  { id: "dojo-23", worldId: 2, scenario: "Desfaça último commit (mantendo alterações)", correctAnswer: "git reset --soft HEAD~1", points: 320, difficulty: 2, timerSeconds: 15,
    blanks: [{ text: "git reset --soft HEAD~[1]", answer: "1" }] },

  { id: "dojo-24", worldId: 2, scenario: "Delete commit e alterações", correctAnswer: "git reset --hard HEAD~1", points: 350, difficulty: 2, timerSeconds: 15,
    blanks: [{ text: "git reset --hard HEAD~[1]", answer: "1" }] },

  { id: "dojo-25", worldId: 2, scenario: "Stash com mensagem 'WIP'", correctAnswer: "git stash push -m \"WIP\"", points: 300, difficulty: 2, timerSeconds: 14,
    blanks: [{ text: "git stash push -m \"[___]\"", answer: "WIP" }] },

  { id: "dojo-26", worldId: 2, scenario: "Aplique stash mais recente", correctAnswer: "git stash pop", points: 290, difficulty: 2, timerSeconds: 13,
    blanks: [{ text: "git stash [___]", answer: "pop" }] },

  { id: "dojo-27", worldId: 2, scenario: "Veja diferença entre HEAD e stage", correctAnswer: "git diff --staged", points: 310, difficulty: 2, timerSeconds: 14,
    blanks: [{ text: "git diff [________]", answer: "--staged" }] },

  { id: "dojo-28", worldId: 2, scenario: "Ignore 'logs/' no .gitignore", correctAnswer: "logs/", points: 200, difficulty: 2, timerSeconds: 12,
    blanks: [{ text: "[_____]/", answer: "logs" }] },

  { id: "dojo-29", worldId: 2, scenario: "Push forçado para origin/main", correctAnswer: "git push -f origin main", points: 340, difficulty: 2, timerSeconds: 15,
    blanks: [{ text: "git push -f origin [____]", answer: "main" }] },

  { id: "dojo-30", worldId: 2, scenario: "Clone com profundidade 1", correctAnswer: "git clone --depth 1 https://github.com/user/repo.git", points: 330, difficulty: 2, timerSeconds: 15,
    blanks: [{ text: "git clone --depth 1 [_________________________]", answer: "https://github.com/user/repo.git" }] },

  { id: "dojo-31", worldId: 2, scenario: "Adicione um novo remoto chamado 'upstream'", correctAnswer: "git remote add upstream https://github.com/original/repo.git", points: 280, difficulty: 2, timerSeconds: 14,
    blanks: [{ text: "git remote add upstream [____________________________]", answer: "https://github.com/original/repo.git" }] },

  { id: "dojo-32", worldId: 2, scenario: "Atualize o branch com pull, mas usando rebase", correctAnswer: "git pull --rebase", points: 290, difficulty: 2, timerSeconds: 14,
    blanks: [{ text: "git pull [_________]", answer: "--rebase" }] },

  { id: "dojo-33", worldId: 2, scenario: "Restaure o arquivo 'app.js' para o estado do último commit", correctAnswer: "git restore app.js", points: 270, difficulty: 2, timerSeconds: 13,
    blanks: [{ text: "git restore [______]", answer: "app.js" }] },

  { id: "dojo-34", worldId: 2, scenario: "Remova 'config.json' do stage, mas mantenha no disco", correctAnswer: "git rm --cached config.json", points: 260, difficulty: 2, timerSeconds: 14,
    blanks: [{ text: "git rm --cached [__________]", answer: "config.json" }] },

  { id: "dojo-35", worldId: 2, scenario: "Liste todas as branches locais", correctAnswer: "git branch", points: 250, difficulty: 2, timerSeconds: 12,
    blanks: [{ text: "git [______]", answer: "branch" }] },

  { id: "dojo-36", worldId: 2, scenario: "Liste os remotos com seus URLs", correctAnswer: "git remote -v", points: 260, difficulty: 2, timerSeconds: 12,
    blanks: [{ text: "git remote [__]", answer: "-v" }] },

  { id: "dojo-37", worldId: 2, scenario: "Mostre os detalhes do commit 'abc123'", correctAnswer: "git show abc123", points: 280, difficulty: 2, timerSeconds: 14,
    blanks: [{ text: "git show [______]", answer: "abc123" }] },

  { id: "dojo-38", worldId: 2, scenario: "Ignore todos os arquivos '.log' no .gitignore", correctAnswer: "*.log", points: 270, difficulty: 2, timerSeconds: 13,
    blanks: [{ text: "[______]", answer: "*.log" }] },

  { id: "dojo-39", worldId: 2, scenario: "Limpe todos os arquivos não rastreados e pastas", correctAnswer: "git clean -fd", points: 310, difficulty: 2, timerSeconds: 14,
    blanks: [{ text: "git clean [___]", answer: "-fd" }] },

  { id: "dojo-40", worldId: 2, scenario: "Aplique o commit 'def456' na branch atual", correctAnswer: "git cherry-pick def456", points: 320, difficulty: 2, timerSeconds: 15,
    blanks: [{ text: "git cherry-pick [______]", answer: "def456" }] },

  // ==================== FASE 3: AVANÇADO (10 desafios) ====================
  { id: "dojo-41", worldId: 3, scenario: "Volte ao penúltimo commit, deletando tudo depois", correctAnswer: "git reset --hard HEAD~1", points: 380, difficulty: 3, timerSeconds: 15,
    blanks: [{ text: "git reset --hard HEAD~[1]", answer: "1" }] },

  { id: "dojo-42", worldId: 3, scenario: "Veja quem alterou cada linha do arquivo 'index.html'", correctAnswer: "git blame index.html", points: 370, difficulty: 3, timerSeconds: 15,
    blanks: [{ text: "git blame [__________]", answer: "index.html" }] },

  { id: "dojo-43", worldId: 3, scenario: "Mostre o histórico de movimentos do HEAD", correctAnswer: "git reflog", points: 360, difficulty: 3, timerSeconds: 15,
    blanks: [{ text: "git [______]", answer: "reflog" }] },

  { id: "dojo-44", worldId: 3, scenario: "Inicie uma busca binária para encontrar um bug", correctAnswer: "git bisect start", points: 390, difficulty: 3, timerSeconds: 15,
    blanks: [{ text: "git bisect [_____]", answer: "start" }] },

  { id: "dojo-45", worldId: 3, scenario: "Marque o commit atual como 'ruim' no bisect", correctAnswer: "git bisect bad", points: 380, difficulty: 3, timerSeconds: 14,
    blanks: [{ text: "git bisect [___]", answer: "bad" }] },

  { id: "dojo-46", worldId: 3, scenario: "Marque o commit 'abc123' como 'bom' no bisect", correctAnswer: "git bisect good abc123", points: 400, difficulty: 3, timerSeconds: 15,
    blanks: [{ text: "git bisect good [______]", answer: "abc123" }] },

  { id: "dojo-47", worldId: 3, scenario: "Crie um worktree para a branch 'dev' em '../dev-work'", correctAnswer: "git worktree add ../dev-work dev", points: 410, difficulty: 3, timerSeconds: 16,
    blanks: [{ text: "git worktree add ../dev-work [___]", answer: "dev" }] },

  { id: "dojo-48", worldId: 3, scenario: "Adicione um submódulo na pasta 'lib'", correctAnswer: "git submodule add https://github.com/user/lib.git lib", points: 420, difficulty: 3, timerSeconds: 16,
    blanks: [{ text: "git submodule add [_________________________] lib", answer: "https://github.com/user/lib.git" }] },

  { id: "dojo-49", worldId: 3, scenario: "Inicialize todos os submódulos do projeto", correctAnswer: "git submodule init", points: 390, difficulty: 3, timerSeconds: 15,
    blanks: [{ text: "git submodule [____]", answer: "init" }] },

  { id: "dojo-50", worldId: 3, scenario: "Atualize todos os submódulos para a versão correta", correctAnswer: "git submodule update", points: 400, difficulty: 3, timerSeconds: 15,
    blanks: [{ text: "git submodule [______]", answer: "update" }]}
];
