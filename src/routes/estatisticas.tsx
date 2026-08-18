import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Trophy } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { EmptyState, StatCard } from "@/components/app/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/domain/text";
import { useAppState } from "@/lib/storage/app-state";
import { evaluateAchievements, levelOf, streakDays } from "@/lib/services/gamification";

export const Route = createFileRoute("/estatisticas")({
  head: () => ({
    meta: [
      { title: "Estatísticas de desempenho — Prompter" },
      { name: "description", content: "Gráficos de evolução de velocidade de fala, duração e pontuação dos seus treinos de oratória." },
      { property: "og:title", content: "Estatísticas de desempenho — Prompter" },
      { property: "og:description", content: "Acompanhe WPM, tempo de apresentação e conquistas ao longo do tempo." },
    ],
  }),
  component: StatsPage,
});

function StatsPage() {
  const { sessions, profile } = useAppState();
  const level = levelOf(profile.points);
  const achievements = useMemo(() => evaluateAchievements(sessions, profile), [sessions, profile]);

  const data = useMemo(
    () =>
      [...sessions]
        .reverse()
        .map((s, i) => ({
          name: `#${i + 1}`,
          wpm: s.metrics.wpm,
          minutos: Number((s.metrics.durationMs / 60000).toFixed(2)),
          pontuacao: s.metrics.score,
        })),
    [sessions],
  );

  const avg = (fn: (n: (typeof sessions)[number]) => number) =>
    sessions.length ? Math.round(sessions.reduce((a, s) => a + fn(s), 0) / sessions.length) : 0;

  return (
    <AppShell title="Estatísticas" subtitle="Sua evolução ao longo do tempo">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Treinos" value={String(sessions.length)} />
        <StatCard label="WPM médio" value={String(avg((s) => s.metrics.wpm))} />
        <StatCard label="Pontuação média" value={String(avg((s) => s.metrics.score))} />
        <StatCard label="Sequência" value={`${streakDays(sessions)} dias`} />
      </section>

      {sessions.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="Ainda sem dados" description="Os gráficos aparecem após o seu primeiro treino concluído." />
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <ChartCard title="Velocidade de fala (WPM)" data={data} dataKey="wpm" color="var(--color-chart-1)" />
          <ChartCard title="Tempo de apresentação (min)" data={data} dataKey="minutos" color="var(--color-chart-2)" />
          <ChartCard title="Pontuação" data={data} dataKey="pontuacao" color="var(--color-chart-4)" />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Últimos resultados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {sessions.slice(0, 6).map((s) => (
                <div key={s.id} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0">
                  <span className="truncate pr-2">{s.scriptTitle}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {formatDuration(s.metrics.durationMs)} · {s.metrics.wpm} WPM · {s.metrics.score} pts
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="mt-4">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Conquistas e nível</CardTitle>
          <Badge variant="secondary">{level.title}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Progress value={level.progress * 100} />
            <p className="mt-1 text-xs text-muted-foreground">
              {profile.points} pontos · meta de {profile.goalSessionsPerWeek} treinos por semana
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {achievements.map((a) => (
              <div
                key={a.id}
                className={`flex items-start gap-3 rounded-lg border p-3 ${a.unlockedAt ? "border-primary/40 bg-primary/5" : "border-border/60 opacity-60"}`}
              >
                <Trophy className={`mt-0.5 size-4 ${a.unlockedAt ? "text-primary" : "text-muted-foreground"}`} />
                <div>
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}

function ChartCard({
  title,
  data,
  dataKey,
  color,
}: {
  title: string;
  data: Array<Record<string, string | number>>;
  dataKey: string;
  color: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} />
            <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
            <Tooltip
              contentStyle={{
                background: "var(--color-popover)",
                border: "1px solid var(--color-border)",
                borderRadius: 12,
                color: "var(--color-popover-foreground)",
              }}
            />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
