import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GitBranch, FileText } from "lucide-react";
import { GitFileState } from "@/hooks/useGitState";

interface GitStatusPanelProps {
  currentBranch: string;
  files: GitFileState[];
}

export default function GitStatusPanel({ currentBranch, files }: GitStatusPanelProps) {
  const stagedFiles = files.filter(f => f.status === 'staged');
  const modifiedFiles = files.filter(f => f.status === 'modified');
  const untrackedFiles = files.filter(f => f.status === 'untracked');

  const hasChanges = stagedFiles.length > 0 || modifiedFiles.length > 0 || untrackedFiles.length > 0;

  return (
    <Card className="w-80 bg-card/95 backdrop-blur-sm border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-cyan-400" />
          <span className="text-cyan-400">Git Status</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Branch Info */}
        <div className="text-xs space-y-1">
          <p className="text-muted-foreground">
            On branch <span className="text-cyan-400 font-bold">{currentBranch}</span>
          </p>
        </div>

        {/* Staged Files */}
        {stagedFiles.length > 0 && (
          <div className="text-xs space-y-1">
            <p className="text-green-500 font-semibold">Changes to be committed:</p>
            <p className="text-muted-foreground text-[10px] italic ml-2">
              (use "git commit" to record changes)
            </p>
            <div className="ml-4 space-y-0.5">
              {stagedFiles.map((file, i) => (
                <div key={i} className="flex items-center gap-2">
                  <FileText className="w-3 h-3 text-green-500" />
                  <span className="text-green-500 font-mono">new file: {file.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modified Files */}
        {modifiedFiles.length > 0 && (
          <div className="text-xs space-y-1">
            <p className="text-yellow-500 font-semibold">Changes not staged for commit:</p>
            <p className="text-muted-foreground text-[10px] italic ml-2">
              (use "git add &lt;file&gt;..." to update)
            </p>
            <div className="ml-4 space-y-0.5">
              {modifiedFiles.map((file, i) => (
                <div key={i} className="flex items-center gap-2">
                  <FileText className="w-3 h-3 text-yellow-500" />
                  <span className="text-yellow-500 font-mono">modified: {file.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Untracked Files */}
        {untrackedFiles.length > 0 && (
          <div className="text-xs space-y-1">
            <p className="text-red-400 font-semibold">Untracked files:</p>
            <p className="text-muted-foreground text-[10px] italic ml-2">
              (use "git add &lt;file&gt;..." to include)
            </p>
            <div className="ml-4 space-y-0.5">
              {untrackedFiles.map((file, i) => (
                <div key={i} className="flex items-center gap-2">
                  <FileText className="w-3 h-3 text-red-400" />
                  <span className="text-red-400 font-mono">{file.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clean State */}
        {!hasChanges && (
          <div className="text-xs text-muted-foreground italic text-center py-4">
            nothing to commit, working tree clean
          </div>
        )}
      </CardContent>
    </Card>
  );
}
