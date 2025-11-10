import type { GameMode } from "@shared/schema";

export interface ModePhase {
  worldId: number;
  title: string;
  description: string;
  requiredScore: number;
  badge?: string;
}

export type ModePhaseMap = Record<GameMode, ModePhase[]>;

export const MODE_PHASES: ModePhaseMap = {
  normal: [
    {
      worldId: 1,
      title: "Fase 1 • Fundamentos",
      description: "Comece entendendo os comandos essenciais do Git.",
      requiredScore: 0,
      badge: "Base"
    },
    {
      worldId: 2,
      title: "Fase 2 • Branching",
      description: "Desbloqueia após provar controle de branches e merges.",
      requiredScore: 1800,
      badge: "Avanço"
    },
    {
      worldId: 3,
      title: "Fase 3 • Trabalho Remoto",
      description: "Mostre domínio com remotos, pushes e pulls.",
      requiredScore: 3600,
      badge: "Veterano"
    }
  ],
  dojo: [
    {
      worldId: 1,
      title: "Fase 1 • Kata Inicial",
      description: "Complete lacunas simples para ganhar ritmo.",
      requiredScore: 0,
      badge: "Disciplina"
    },
    {
      worldId: 2,
      title: "Fase 2 • Kata Avançado",
      description: "Somente para quem já domina 1.5k pontos no dojo.",
      requiredScore: 1500,
      badge: "Precisão"
    }
  ],
  arcade: [
    {
      worldId: 1,
      title: "Fase 1 • Sprint",
      description: "Reflexos rápidos com comandos básicos.",
      requiredScore: 0,
      badge: "Impulso"
    },
    {
      worldId: 2,
      title: "Fase 2 • Maratona",
      description: "Abra apenas após acumular 2.5k pontos no modo arcade.",
      requiredScore: 2500,
      badge: "Resistência"
    }
  ]
};

export function getPhaseForMode(mode: GameMode, worldId: number): ModePhase | undefined {
  return MODE_PHASES[mode]?.find(phase => phase.worldId === worldId);
}

export function isPhaseUnlocked(mode: GameMode, worldId: number, bestScore: number): boolean {
  const phase = getPhaseForMode(mode, worldId);
  if (!phase) return true;
  return bestScore >= phase.requiredScore;
}

export function getModeHighScoreKey(mode: GameMode): string {
  return `highScore_${mode}`;
}

export function readBestScore(mode: GameMode): number {
  if (typeof window === "undefined") {
    return 0;
  }
  return parseInt(window.localStorage.getItem(getModeHighScoreKey(mode)) || "0", 10);
}
