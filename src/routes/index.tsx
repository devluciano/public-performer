import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  Files,
  Flame,
  Gauge,
  History,
  Play,
  Plus,
  Settings,
  Timer,
  TrendingUp,
  Type,
} from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { EmptyState, StatCard } from "@/components/app/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/domain/text";
import { useActions, useAppState } from "@/lib/storage/app-state";
import { levelOf, streakDays } from "@/lib/services/gamification";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Prompter — Teleprompter para treino de oratória" },
      {
        name: "description",
        content:
          "Escreva roteiros, apresente com teleprompter e acompanhe ritmo, pausas, WPM e evolução dos seus treinos de oratória.",
      },
      { property: "og:title", content: "Prompter — Teleprompter para treino de oratória" },
      {
        property: "og:description",
        content: "Roteiros, teleprompter, cronômetro, gravação, métricas e feedback para treinar sua fala.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { scripts, sessions, profile } = useAppState();
  const { createScript } = useActions();
  const navigate = useNavigate();
  const last = sessions[0];
  const previous = sessions[1];
  const level = levelOf(profile.points);
  const streak = streakDays(sessions);

  const novoTreino = () => {
    const target = scripts[0];
    if (target) void navigate({ to: "/treino/$id", params: { id: target.id } });
    else {
      const script = createScript();
      void navigate({ to: "/roteiros/$id", params: { id: script.id } });
    }
  };

  const delta = last && previous ? last.metrics.score - previous.metrics.score : 0;

  return (
    <AppShell
      title="Dashboard"
      subtitle={`Olá, ${profile.name}. Pronto para o próximo treino?`}
      actions={
        <>
          <Button variant="outline" asChild>
            <Link to="/roteiros">
              <Files className="size-4" /> Meus roteiros
            </Link>
          </Button>
          <Button onClick={novoTreino}>
            <Play className="size-4" /> Novo treino
          </Button>
        </>
      }
    >
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tempo de fala" value={last ? formatDuration(last.metrics.durationMs) : "—"} hint="Último treino" icon={Timer} />
        <StatCard label="Palavras" value={last ? String(last.metrics.wordsSpoken) : "—"} hint="Último treino" icon={Type} />
        <StatCard label="Velocidade média" value={last ? `${last.metrics.wpm} WPM` : "—"} hint="Palavras por minuto" icon={Gauge} />
        <StatCard label="Pausas" value={last ? String(last.metrics.pauses) : "—"} hint={last ? `Média de ${(last.metrics.avgPauseMs / 1000).toFixed(1)}s` : undefined} icon={Flame} />
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Último treino</CardTitle>
            {last ? (
              <Badge variant="outline">
                {new Date(last.startedAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
              </Badge>
            ) : null}
          </CardHeader>
          <CardContent>
            {last ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">{last.scriptTitle}</p>
                    <p className="font-display text-3xl font-semibold">{last.metrics.score} pts</p>
                  </div>
                  <p className={`flex items-center gap-1 text-sm ${delta >= 0 ? "text-success" : "text-destructive"}`}>
                    <TrendingUp className="size-4" />
                    {delta >= 0 ? "+" : ""}
                    {delta} vs. treino anterior
                  </p>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>Progresso de evolução</span>
                    <span>{Math.round(last.metrics.completion * 100)}% do roteiro concluído</span>
                  </div>
                  <Progress value={last.metrics.score} />
                </div>
                <Button variant="secondary" asChild size="sm">
                  <Link to="/historico/$sessionId" params={{ sessionId: last.id }}>
                    Ver análise completa
                  </Link>
                </Button>
              </div>
            ) : (
              <EmptyState
                title="Nenhum treino ainda"
                description="Crie um roteiro e faça sua primeira apresentação no modo teleprompter para começar a medir sua evolução."
                action={
                  <Button onClick={novoTreino}>
                    <Plus className="size-4" /> Começar agora
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sua evolução</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-baseline justify-between">
                <p className="font-display text-lg font-semibold">{level.title}</p>
                <span className="text-sm text-muted-foreground">{profile.points} pts</span>
              </div>
              <Progress className="mt-2" value={level.progress * 100} />
              <p className="mt-1 text-xs text-muted-foreground">
                {level.next ? `${level.next.min - profile.points} pts para ${level.next.title}` : "Nível máximo alcançado"}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <MiniStat label="Treinos" value={String(sessions.length)} />
              <MiniStat label="Sequência" value={`${streak}d`} />
              <MiniStat label="Roteiros" value={String(scripts.length)} />
            </div>
            <div className="grid gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/historico">
                  <History className="size-4" /> Histórico de treinos
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/estatisticas">
                  <BarChart3 className="size-4" /> Estatísticas
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/configuracoes">
                  <Settings className="size-4" /> Configurações
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-muted/30 py-2">
      <p className="font-display text-lg font-semibold tabular-nums">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
