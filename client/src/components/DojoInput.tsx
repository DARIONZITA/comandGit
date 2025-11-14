import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DojoInputProps {
  blankText: string; // Ex: "git clone [________________]"
  expectedAnswer: string;
  onSubmit: (answer: string) => void;
  disabled: boolean;
  shake: boolean;
}

export default function DojoInput({ blankText, expectedAnswer, onSubmit, disabled, shake }: DojoInputProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled, blankText]);

  useEffect(() => {
    setInput(""); // Limpar input quando mudar o desafio
  }, [blankText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(input.trim());
      setInput("");
    }
  };

  // Divide o texto em partes (antes da lacuna, lacuna, depois)
  const parts = blankText.split(/(\[_+\])/g);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border p-6 mobile-input-fixed">
      <div className="max-w-4xl mx-auto space-y-4 mobile-space-y-2">
        {/* Mostra o comando com a lacuna - OCULTO NO MOBILE E DESKTOP */}
        <div className="hidden">
          {parts.map((part, idx) => {
            if (part.match(/\[_+\]/)) {
              return (
                <span key={idx} className="inline-block min-w-[200px]">
                  <span className="text-yellow-500 font-bold">{part}</span>
                </span>
              );
            }
            return <span key={idx} className="text-muted-foreground">{part}</span>;
          })}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 mobile-gap-1">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite apenas o que falta..."
              disabled={disabled}
              className={`font-mono text-lg mobile-text-sm mobile-px-2 mobile-py-2 ${shake ? "animate-shake" : ""}`}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
          </div>
          <Button 
            type="submit" 
            disabled={disabled || !input.trim()}
            size="lg"
            className="mobile-px-3 mobile-py-2"
          >
            <Send className="w-5 h-5 mobile-w-4 mobile-h-4" />
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center">
          💡 Dica: Digite apenas o texto que deve preencher as lacunas [___]
        </p>
      </div>
    </div>
  );
}
