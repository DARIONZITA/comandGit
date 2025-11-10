import { useState, useCallback } from 'react';

export interface GitFileState {
  name: string;
  status: 'untracked' | 'modified' | 'staged' | 'committed';
}

export interface GitState {
  currentBranch: string;
  branches: string[];
  workingDirectory: string;
  files: GitFileState[];
  lastCommitHash: string;
  commitHistory: { hash: string; message: string; branch: string }[];
}

export function useGitState() {
  const [gitState, setGitState] = useState<GitState>({
    currentBranch: 'main',
    branches: ['main'],
    workingDirectory: '~/projeto',
    files: [],
    lastCommitHash: '',
    commitHistory: [],
  });

  const [commandOutput, setCommandOutput] = useState<string>('');
  const [showOutput, setShowOutput] = useState(false);

  // Gerar hash fake para commits
  const generateHash = useCallback(() => {
    return Math.random().toString(36).substring(2, 9);
  }, []);

  // Processar comandos Git e atualizar estado
  const processGitCommand = useCallback((command: string) => {
    const trimmed = command.trim();
    let output = '';
    let newState = { ...gitState };

    // git init
    if (trimmed === 'git init') {
      output = `Initialized empty Git repository in ${gitState.workingDirectory}/.git/`;
      newState.lastCommitHash = '';
    }
    // git add <file>
    else if (trimmed.startsWith('git add ')) {
      const fileName = trimmed.replace('git add ', '').trim();
      if (fileName === '.') {
        // Adicionar todos os arquivos
        newState.files = newState.files.map(f => 
          f.status === 'untracked' || f.status === 'modified' 
            ? { ...f, status: 'staged' as const }
            : f
        );
        output = ''; // git add não tem output normalmente
      } else {
        // Adicionar arquivo específico
        const fileIndex = newState.files.findIndex(f => f.name === fileName);
        if (fileIndex >= 0) {
          newState.files[fileIndex].status = 'staged';
        }
        output = '';
      }
    }
    // git commit -m "message"
    else if (trimmed.startsWith('git commit')) {
      const messageMatch = trimmed.match(/git commit.*["'](.+?)["']/);
      const message = messageMatch ? messageMatch[1] : 'commit';
      const hash = generateHash();
      const stagedFiles = newState.files.filter(f => f.status === 'staged');
      
      if (stagedFiles.length > 0) {
        newState.files = newState.files.map(f => 
          f.status === 'staged' ? { ...f, status: 'committed' as const } : f
        );
        newState.lastCommitHash = hash;
        newState.commitHistory.push({ 
          hash, 
          message, 
          branch: newState.currentBranch 
        });
        
        const isFirstCommit = newState.commitHistory.length === 1;
        output = isFirstCommit
          ? `[${newState.currentBranch} (root-commit) ${hash}] ${message}\n ${stagedFiles.length} file${stagedFiles.length > 1 ? 's' : ''} changed`
          : `[${newState.currentBranch} ${hash}] ${message}\n ${stagedFiles.length} file${stagedFiles.length > 1 ? 's' : ''} changed`;
      } else {
        output = "nothing to commit, working tree clean";
      }
    }
    // git checkout -b <branch>
    else if (trimmed.startsWith('git checkout -b ')) {
      const branchName = trimmed.replace('git checkout -b ', '').trim();
      if (!newState.branches.includes(branchName)) {
        newState.branches.push(branchName);
        newState.currentBranch = branchName;
        output = `Switched to a new branch '${branchName}'`;
      } else {
        output = `fatal: a branch named '${branchName}' already exists`;
      }
    }
    // git checkout <branch>
    else if (trimmed.startsWith('git checkout ') && !trimmed.includes('-b')) {
      const branchName = trimmed.replace('git checkout ', '').trim();
      if (newState.branches.includes(branchName)) {
        newState.currentBranch = branchName;
        output = `Switched to branch '${branchName}'`;
      } else {
        output = `error: pathspec '${branchName}' did not match any file(s) known to git`;
      }
    }
    // git branch
    else if (trimmed === 'git branch') {
      output = newState.branches.map(b => 
        b === newState.currentBranch ? `* ${b}` : `  ${b}`
      ).join('\n');
    }
    // git status
    else if (trimmed === 'git status') {
      const untracked = newState.files.filter(f => f.status === 'untracked');
      const modified = newState.files.filter(f => f.status === 'modified');
      const staged = newState.files.filter(f => f.status === 'staged');
      
      output = `On branch ${newState.currentBranch}\n`;
      
      if (staged.length > 0) {
        output += '\nChanges to be committed:\n  (use "git restore --staged <file>..." to unstage)\n';
        staged.forEach(f => {
          output += `\t\x1b[32mnew file:   ${f.name}\x1b[0m\n`;
        });
      }
      
      if (modified.length > 0) {
        output += '\nChanges not staged for commit:\n  (use "git add <file>..." to update what will be committed)\n';
        modified.forEach(f => {
          output += `\t\x1b[31mmodified:   ${f.name}\x1b[0m\n`;
        });
      }
      
      if (untracked.length > 0) {
        output += '\nUntracked files:\n  (use "git add <file>..." to include in what will be committed)\n';
        untracked.forEach(f => {
          output += `\t\x1b[31m${f.name}\x1b[0m\n`;
        });
      }
      
      if (staged.length === 0 && modified.length === 0 && untracked.length === 0) {
        output += 'nothing to commit, working tree clean';
      }
    }
    // Comando não reconhecido
    else {
      const commandName = trimmed.split(' ')[0];
      output = `bash: ${commandName}: command not found`;
    }

    setGitState(newState);
    setCommandOutput(output);
    setShowOutput(!!output);

    // Auto-esconder output após 2 segundos (exceto para alguns comandos)
    if (output && !trimmed.includes('status') && !trimmed.includes('branch')) {
      setTimeout(() => setShowOutput(false), 2000);
    }

    return { output, newState };
  }, [gitState, generateHash]);

  // Adicionar arquivo ao estado (usado pelos desafios)
  const addFile = useCallback((fileName: string, status: GitFileState['status'] = 'untracked') => {
    setGitState(prev => ({
      ...prev,
      files: [...prev.files.filter(f => f.name !== fileName), { name: fileName, status }]
    }));
  }, []);

  // Resetar estado (novo jogo)
  const resetState = useCallback(() => {
    setGitState({
      currentBranch: 'main',
      branches: ['main'],
      workingDirectory: '~/projeto',
      files: [],
      lastCommitHash: '',
      commitHistory: [],
    });
    setCommandOutput('');
    setShowOutput(false);
  }, []);

  return {
    gitState,
    commandOutput,
    showOutput,
    processGitCommand,
    addFile,
    resetState,
  };
}
