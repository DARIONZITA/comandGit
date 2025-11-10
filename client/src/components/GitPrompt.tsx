interface GitPromptProps {
  username?: string;
  hostname?: string;
  workingDirectory: string;
  currentBranch: string;
}

export default function GitPrompt({ 
  username = "usuario",
  hostname = "git-game",
  workingDirectory,
  currentBranch 
}: GitPromptProps) {
  return (
    <div className="flex items-center gap-1 font-mono text-sm select-none">
      {/* username@hostname */}
      <span className="text-green-500 font-bold">
        {username}@{hostname}
      </span>
      
      <span className="text-muted-foreground">:</span>
      
      {/* working directory */}
      <span className="text-blue-500 font-bold">
        {workingDirectory}
      </span>
      
      {/* current branch */}
      <span className="text-cyan-400">
        ({currentBranch})
      </span>
      
      {/* prompt symbol */}
      <span className="text-muted-foreground font-bold">$</span>
    </div>
  );
}
