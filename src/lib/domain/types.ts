import { z } from "zod";

export const SCRIPT_CATEGORIES = [
  "Apresentação",
  "Reunião",
  "Aula",
  "Pitch",
  "Entrevista",
  "Vídeo",
  "Discurso",
  "Treinamento",
  "Outros",
] as const;
export type ScriptCategory = (typeof SCRIPT_CATEGORIES)[number];

export const TRAINING_LEVELS = ["iniciante", "intermediario", "avancado"] as const;
export type TrainingLevel = (typeof TRAINING_LEVELS)[number];

export const teleprompterSettingsSchema = z.object({
  wpm: z.number().min(60).max(260).default(140),
  fontSize: z.number().min(18).max(120).default(46),
  lineHeight: z.number().min(1).max(2.6).default(1.5),
  readingWidth: z.number().min(40).max(100).default(72),
  contrast: z.number().min(60).max(140).default(100),
  theme: z.enum(["dark", "light"]).default("dark"),
  mirrored: z.boolean().default(false),
  align: z.enum(["left", "center"]).default("center"),
  level: z.enum(TRAINING_LEVELS).default("iniciante"),
});
export type TeleprompterSettings = z.infer<typeof teleprompterSettingsSchema>;

export const defaultSettings = (): TeleprompterSettings => teleprompterSettingsSchema.parse({});

export const scriptSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().default(""),
  category: z.enum(SCRIPT_CATEGORIES).default("Apresentação"),
  content: z.string().default(""),
  settings: teleprompterSettingsSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  lastUsedAt: z.string().nullable().default(null),
  sessionsCount: z.number().default(0),
});
export type Script = z.infer<typeof scriptSchema>;

export const sessionMetricsSchema = z.object({
  durationMs: z.number(),
  wordsSpoken: z.number(),
  wpm: z.number(),
  pauses: z.number(),
  avgPauseMs: z.number(),
  longestStreakMs: z.number(),
  rhythmVariation: z.number(),
  completion: z.number(),
  score: z.number(),
});
export type SessionMetrics = z.infer<typeof sessionMetricsSchema>;

export const feedbackItemSchema = z.object({
  kind: z.enum(["forte", "melhoria", "recomendacao"]),
  text: z.string(),
});
export type FeedbackItem = z.infer<typeof feedbackItemSchema>;

export const sessionSchema = z.object({
  id: z.string(),
  scriptId: z.string(),
  scriptTitle: z.string(),
  level: z.enum(TRAINING_LEVELS),
  startedAt: z.string(),
  metrics: sessionMetricsSchema,
  feedback: z.array(feedbackItemSchema).default([]),
  notes: z.string().default(""),
  recordingId: z.string().nullable().default(null),
  recordingKind: z.enum(["audio", "video"]).nullable().default(null),
});
export type TrainingSession = z.infer<typeof sessionSchema>;

export const achievementSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  unlockedAt: z.string().nullable(),
});
export type Achievement = z.infer<typeof achievementSchema>;

export const profileSchema = z.object({
  name: z.string().default("Orador"),
  defaults: teleprompterSettingsSchema,
  goalSessionsPerWeek: z.number().min(1).max(21).default(3),
  points: z.number().default(0),
  achievements: z.array(achievementSchema).default([]),
});
export type Profile = z.infer<typeof profileSchema>;
