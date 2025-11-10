import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, serial, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ========== NOVO SISTEMA DE DESAFIOS ==========

// Tabela 1: Worlds (Mundos/Níveis)
export const worlds = pgTable("worlds", {
  worldId: serial("world_id").primaryKey(),
  worldLevel: integer("world_level").notNull().unique(),
  worldName: text("world_name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type World = typeof worlds.$inferSelect;
export type InsertWorld = typeof worlds.$inferInsert;

// Tabela 2: GitStates (Estados do Git)
export const gitStates = pgTable("git_states", {
  stateId: serial("state_id").primaryKey(),
  stateName: text("state_name").notNull().unique(),
  statusTemplate: text("status_template").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type GitState = typeof gitStates.$inferSelect;
export type InsertGitState = typeof gitStates.$inferInsert;

// Tabela 3: Challenges (Desafios)
export const challenges = pgTable("challenges", {
  challengeId: serial("challenge_id").primaryKey(),
  worldId: integer("world_id").notNull(),
  startStateId: integer("start_state_id").notNull(),
  questionTemplate: text("question_template").notNull(),
  correctAnswerTemplate: text("correct_answer_template"),
  isMultiStep: boolean("is_multi_step").notNull().default(false),
  points: integer("points").notNull().default(100),
  difficulty: integer("difficulty").notNull().default(1),
  timerSeconds: integer("timer_seconds").notNull().default(10),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = typeof challenges.$inferInsert;

// Tabela 4: DynamicVariables (Variáveis Dinâmicas)
export const dynamicVariables = pgTable("dynamic_variables", {
  variableName: text("variable_name").primaryKey(),
  valuePool: jsonb("value_pool").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type DynamicVariable = typeof dynamicVariables.$inferSelect;
export type InsertDynamicVariable = typeof dynamicVariables.$inferInsert;

// Tabela 5: ValidTransitions (Transições Válidas)
export const validTransitions = pgTable("valid_transitions", {
  transitionId: serial("transition_id").primaryKey(),
  challengeId: integer("challenge_id").notNull(),
  currentStateId: integer("current_state_id").notNull(),
  answerPattern: text("answer_pattern").notNull(),
  commandOutput: text("command_output"),
  nextStateId: integer("next_state_id").notNull(),
  isFinalStep: boolean("is_final_step").notNull().default(false),
  stepOrder: integer("step_order").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type ValidTransition = typeof validTransitions.$inferSelect;
export type InsertValidTransition = typeof validTransitions.$inferInsert;

export const gameScores = pgTable("game_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  playerName: text("player_name").notNull(),
  score: integer("score").notNull(),
  combo: integer("combo").notNull(),
  world: integer("world").notNull(),
  mode: text("mode").notNull(),
});

export const insertGameScoreSchema = createInsertSchema(gameScores).omit({
  id: true,
});

export type InsertGameScore = z.infer<typeof insertGameScoreSchema>;
export type GameScore = typeof gameScores.$inferSelect;

// Tabela de estatísticas do usuário (High Score + XP Total por modo)
export const userStats = pgTable("user_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique(),
  username: text("username").notNull(),
  
  // High Scores (Habilidade) - Melhor pontuação em cada modo
  highScoreNormal: integer("high_score_normal").notNull().default(0),
  highScoreDojo: integer("high_score_dojo").notNull().default(0),
  highScoreArcade: integer("high_score_arcade").notNull().default(0),
  
  // XP Total (Experiência) - Soma de todos os pontos por modo
  totalXpNormal: integer("total_xp_normal").notNull().default(0),
  totalXpDojo: integer("total_xp_dojo").notNull().default(0),
  totalXpArcade: integer("total_xp_arcade").notNull().default(0),
  
  // XP Global (para nível do jogador)
  totalXp: integer("total_xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  
  // Estatísticas adicionais
  totalGames: integer("total_games").notNull().default(0),
  totalCombos: integer("total_combos").notNull().default(0),
  maxCombo: integer("max_combo").notNull().default(0),
});

export type UserStats = typeof userStats.$inferSelect;

export type GameMode = "normal" | "dojo" | "arcade";

export type ChallengeBlock = {
  id: string;
  scenario: string;
  correctAnswer: string;
  altAnswers?: string[];
  points: number;
  difficulty: number;
  timerSeconds?: number; // Tempo limite em segundos (opcional)
  blanks?: { text: string; answer: string }[]; // Para modo Dojo
  commandSequence?: string[]; // Sequência de comandos (se não definido, usa correctAnswer)
  sequenceAltAnswers?: string[][]; // Alternativas para cada comando da sequência
};

export type GameWorld = {
  id: number;
  name: string;
  description: string;
  commands: string[];
  challenges: ChallengeBlock[];
  unlocked: boolean;
};
