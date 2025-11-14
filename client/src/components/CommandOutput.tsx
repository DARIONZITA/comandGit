import { useEffect, useState } from "react";

interface CommandOutputProps {
  output: string;
  show: boolean;
  isError?: boolean;
}

export default function CommandOutput({ output, show, isError = false }: CommandOutputProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
    } else {
      // Fade out delay
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!visible) return null;

  return (
    <div 
      className={`
        fixed bottom-24 left-1/2 -translate-x-1/2 
        max-w-3xl w-full px-8
        mobile-top-1/2 mobile-left-0 mobile-right-0 mobile-translate-x-0 mobile-px-4
        transition-all duration-300 z-30
        ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}
    >
      <div 
        className={`
          font-mono text-sm p-4 rounded-lg border-2
          mobile-text-xs mobile-p-2
          ${isError 
            ? 'bg-red-950/50 border-red-500/50 text-red-300' 
            : 'bg-muted/95 border-primary/30 text-foreground'
          }
          backdrop-blur-sm shadow-lg
        `}
      >
        <div className="whitespace-pre-wrap break-words">
          {output.split('\n').map((line, i) => (
            <div key={i} className="leading-relaxed">
              {line.includes('\t') ? (
                // Preservar tabs (para output de git status)
                <span dangerouslySetInnerHTML={{ __html: line.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;') }} />
              ) : (
                line
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
