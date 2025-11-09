import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer } from "drizzle-orm/pg-core";
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

export const gameScores = pgTable("game_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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

export type ChallengeBlock = {
  id: string;
  scenario: string;
  correctAnswer: string;
  altAnswers?: string[];
  points: number;
  difficulty: number;
};

export type GameWorld = {
  id: number;
  name: string;
  description: string;
  commands: string[];
  challenges: ChallengeBlock[];
  unlocked: boolean;
};
