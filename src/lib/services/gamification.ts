import type { Achievement, Profile, TrainingSession } from "@/lib/domain/types";

export const LEVELS = [
  { level: 1, title: "Iniciante", min: 0 },
  { level: 2, title: "Aprendiz", min: 200 },
  { level: 3, title: "Comunicador", min: 600 },
  { level: 4, title: "Orador", min: 1200 },
  { level: 5, title: "Mestre da Oratória", min: 2200 },
] as const;

export function levelOf(points: number) {
  const current = [...LEVELS].reverse().find((l) => points >= l.min) ?? LEVELS[0];
  const next = LEVELS.find((l) => l.min > points);
  const progress = next ? (points - current.min) / (next.min - current.min) : 1;
  return { ...current, next, progress };
}

export function streakDays(sessions: TrainingSession[]): number {
  const days = new Set(sessions.map((s) => s.startedAt.slice(0, 10)));
  let streak = 0;
  const cursor = new Date();
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (days.has(key)) streak += 1;
    else if (streak > 0 || key !== new Date().toISOString().slice(0, 10)) break;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

const CATALOG: Array<{ id: string; title: string; description: string; test: (s: TrainingSession[]) => boolean }> = [
  { id: "first", title: "Primeiro treino", description: "Concluiu o primeiro treino.", test: (s) => s.length >= 1 },
  { id: "ten", title: "10 treinos concluídos", description: "Consistência é tudo.", test: (s) => s.length >= 10 },
  { id: "streak7", title: "7 dias consecutivos", description: "Uma semana inteira de prática.", test: (s) => streakDays(s) >= 7 },
  {
    id: "words1000",
    title: "1000 palavras praticadas",
    description: "Volume de prática acumulado.",
    test: (s) => s.reduce((a, b) => a + b.metrics.wordsSpoken, 0) >= 1000,
  },
  {
    id: "steady",
    title: "Ritmo consistente",
    description: "Variação de ritmo abaixo de 10 WPM.",
    test: (s) => s.some((x) => x.metrics.rhythmVariation > 0 && x.metrics.rhythmVariation < 10),
  },
  {
    id: "complete",
    title: "Apresentação sem interrupções",
    description: "Roteiro concluído 100% em uma única sessão.",
    test: (s) => s.some((x) => x.metrics.completion >= 0.99),
  },
];

export function evaluateAchievements(sessions: TrainingSession[], profile: Profile): Achievement[] {
  const now = new Date().toISOString();
  return CATALOG.map((entry) => {
    const existing = profile.achievements.find((a) => a.id === entry.id);
    const unlockedAt = existing?.unlockedAt ?? (entry.test(sessions) ? now : null);
    return { id: entry.id, title: entry.title, description: entry.description, unlockedAt };
  });
}

export const pointsForSession = (score: number) => 20 + Math.round(score / 2);
