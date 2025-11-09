import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";

interface CommandInputProps {
  onSubmit: (command: string) => void;
  disabled?: boolean;
  shake?: boolean;
}

export default function CommandInput({ onSubmit, disabled, shake }: CommandInputProps) {
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

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t p-6 ${shake ? 'shake' : ''}`}>
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-primary select-none">$</span>
          <Input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={disabled}
            className="flex-1 text-xl font-mono bg-transparent border-0 border-b-2 border-primary/30 rounded-none focus-visible:ring-0 focus-visible:border-primary px-2 py-3"
            placeholder="Digite o comando Git..."
            autoComplete="off"
            spellCheck={false}
            data-testid="input-command"
          />
          <div className="w-3 h-8 bg-primary animate-pulse" data-testid="cursor-indicator" />
        </div>
        <p className="text-xs text-muted-foreground mt-2 ml-8">
          Pressione ENTER para submeter o comando
        </p>
      </form>
    </div>
  );
}
