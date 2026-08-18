import type { SessionMetrics } from "@/lib/domain/types";

export interface Segment {
  startedAt: number;
  endedAt: number;
  words: number;
}

/** Acompanha períodos de fala e pausas durante um treino. */
export class SessionTracker {
  readonly startedAt = Date.now();
  private segments: Segment[] = [];
  private pauses: number[] = [];
  private current: { at: number; words: number } | null = null;
  private lastPauseAt: number | null = null;

  play(wordsRead: number) {
    if (this.current) return;
    if (this.lastPauseAt !== null) this.pauses.push(Date.now() - this.lastPauseAt);
    this.current = { at: Date.now(), words: wordsRead };
  }

  pause(wordsRead: number) {
    if (!this.current) return;
    this.segments.push({ startedAt: this.current.at, endedAt: Date.now(), words: Math.max(0, wordsRead - this.current.words) });
    this.current = null;
    this.lastPauseAt = Date.now();
  }

  finish(wordsRead: number, totalWords: number): SessionMetrics {
    this.pause(wordsRead);
    const durationMs = Math.max(1000, Date.now() - this.startedAt);
    const speaking = this.segments.reduce((acc, s) => acc + (s.endedAt - s.startedAt), 0) || durationMs;
    const wordsSpoken = Math.round(this.segments.reduce((acc, s) => acc + s.words, 0)) || wordsRead;
    const wpm = Math.round((wordsSpoken / (speaking / 60_000)) || 0);
    const realPauses = this.pauses.filter((p) => p >= 800);
    const avgPauseMs = realPauses.length ? Math.round(realPauses.reduce((a, b) => a + b, 0) / realPauses.length) : 0;
    const longestStreakMs = this.segments.reduce((max, s) => Math.max(max, s.endedAt - s.startedAt), 0);
    const rates = this.segments
      .filter((s) => s.endedAt - s.startedAt > 3000)
      .map((s) => s.words / ((s.endedAt - s.startedAt) / 60_000));
    const rhythmVariation = rates.length > 1 ? Math.round(stdev(rates)) : 0;
    const completion = totalWords > 0 ? Math.min(1, wordsRead / totalWords) : 0;

    return {
      durationMs,
      wordsSpoken,
      wpm: Number.isFinite(wpm) ? wpm : 0,
      pauses: realPauses.length,
      avgPauseMs,
      longestStreakMs,
      rhythmVariation,
      completion,
      score: scoreOf({ wpm, rhythmVariation, completion, pauses: realPauses.length }),
    };
  }
}

function stdev(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length);
}

function scoreOf({
  wpm,
  rhythmVariation,
  completion,
  pauses,
}: {
  wpm: number;
  rhythmVariation: number;
  completion: number;
  pauses: number;
}): number {
  const paceScore = 100 - Math.min(60, Math.abs(140 - wpm) * 1.4);
  const steadyScore = 100 - Math.min(50, rhythmVariation * 2.2);
  const pauseScore = pauses === 0 ? 60 : 100 - Math.min(40, Math.abs(pauses - 4) * 8);
  const value = paceScore * 0.35 + steadyScore * 0.3 + pauseScore * 0.15 + completion * 100 * 0.2;
  return Math.max(0, Math.min(100, Math.round(value)));
}
