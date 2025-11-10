import { useCallback, useEffect, useRef, useState } from "react";

export interface GameSounds {
  playTyping: () => void;
  playSuccess: () => void;
  playFailure: () => void;
  playCombo: (comboLevel: number) => void;
  playTickTock: () => void;
  stopTickTock: () => void;
  playKeyPress: () => void;
  setMuted: (muted: boolean) => void;
  isMuted: boolean;
}

export function useGameSounds(): GameSounds {
  const [isMuted, setIsMuted] = useState(false);
  
  // Contextos de áudio
  const audioContextRef = useRef<AudioContext | null>(null);
  const tickTockIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Inicializar AudioContext
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    return () => {
      if (tickTockIntervalRef.current) {
        clearInterval(tickTockIntervalRef.current);
      }
      audioContextRef.current?.close();
    };
  }, []);

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = "sine", volume: number = 0.1) => {
    if (isMuted || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }, [isMuted]);

  const playTyping = useCallback(() => {
    // Som curto de digitação - tom médio
    playTone(400, 0.05, "square", 0.05);
  }, [playTone]);

  const playKeyPress = useCallback(() => {
    // Som mecânico de tecla - muito curto e sutil
    playTone(800 + Math.random() * 200, 0.02, "square", 0.03);
  }, [playTone]);

  const playSuccess = useCallback(() => {
    // Som positivo - arpejo ascendente
    if (isMuted || !audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 (acorde maior)
    
    notes.forEach((freq, index) => {
      setTimeout(() => {
        playTone(freq, 0.15, "sine", 0.15);
      }, index * 50);
    });
  }, [playTone, isMuted]);

  const playFailure = useCallback(() => {
    // Som de erro - buzz curto
    if (isMuted || !audioContextRef.current) return;
    
    playTone(150, 0.2, "sawtooth", 0.1);
    setTimeout(() => playTone(100, 0.15, "sawtooth", 0.08), 100);
  }, [playTone, isMuted]);

  const playCombo = useCallback((comboLevel: number) => {
    // Som que sobe com o combo
    const baseFreq = 440; // A4
    const frequency = baseFreq * Math.pow(1.05946, comboLevel); // Escala cromática
    playTone(frequency, 0.1, "triangle", 0.12);
  }, [playTone]);

  const playTickTock = useCallback(() => {
    if (isMuted || tickTockIntervalRef.current) return;

    let tickCount = 0;
    tickTockIntervalRef.current = setInterval(() => {
      const isTick = tickCount % 2 === 0;
      playTone(isTick ? 800 : 600, 0.08, "sine", 0.08);
      tickCount++;
    }, 500); // A cada 500ms
  }, [playTone, isMuted]);

  const stopTickTock = useCallback(() => {
    if (tickTockIntervalRef.current) {
      clearInterval(tickTockIntervalRef.current);
      tickTockIntervalRef.current = null;
    }
  }, []);

  return {
    playTyping,
    playKeyPress,
    playSuccess,
    playFailure,
    playCombo,
    playTickTock,
    stopTickTock,
    setMuted: setIsMuted,
    isMuted,
  };
}
