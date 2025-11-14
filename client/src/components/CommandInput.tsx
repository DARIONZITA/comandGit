import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import GitPrompt from "@/components/GitPrompt";
import type { GameSounds } from "@/hooks/useGameSounds";

interface CommandInputProps {
  onSubmit: (command: string) => void;
  onInputChange?: (value: string) => void;
  disabled?: boolean;
  shake?: boolean;
  currentBranch?: string;
  workingDirectory?: string;
  sounds?: GameSounds;
}

export default function CommandInput({ 
  onSubmit,
  onInputChange,
  disabled, 
  shake, 
  currentBranch = "main",
  workingDirectory = "~/projeto",
  sounds
}: CommandInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value);
      setValue("");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    
    // Notificar o pai sobre a mudança
    if (onInputChange) {
      onInputChange(newValue);
    }
    
    // Toca som de digitação
    if (sounds?.playKeyPress) {
      sounds.playKeyPress();
    }
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t p-6 mobile-input-fixed ${shake ? 'shake' : ''}`}>
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mobile-flex-col mobile-gap-1">
          <GitPrompt 
            currentBranch={currentBranch} 
            workingDirectory={workingDirectory}
          />
          <div className="flex items-center gap-3 mobile-gap-1 flex-1 mobile-w-full">
            <Input
              ref={inputRef}
              type="text"
              value={value}
              onChange={handleInputChange}
              disabled={disabled}
              className="flex-1 text-xl mobile-text-sm font-mono bg-transparent border-0 border-b-2 border-primary/30 rounded-none focus-visible:ring-0 focus-visible:border-primary px-2 py-3 mobile-px-2 mobile-py-2"
              placeholder="Digite o comando Git..."
              autoComplete="off"
              spellCheck={false}
              data-testid="input-command"
            />
            <div className="w-3 h-8 bg-primary animate-pulse mobile-hidden" data-testid="cursor-indicator" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2 ml-8 mobile-text-xs mobile-ml-0 mobile-text-center mobile-mt-1">
          Pressione ENTER para submeter o comando
        </p>
      </form>
    </div>
  );
}
