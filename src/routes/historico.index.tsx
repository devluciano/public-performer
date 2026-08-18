import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { EmptyState } from "@/components/app/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDuration } from "@/lib/domain/text";
import { useActions, useAppState } from "@/lib/storage/app-state";

export const Route = createFileRoute("/historico/")({
  head: () => ({
    meta: [
      { title: "Histórico de treinos — Prompter" },
      { name: "description", content: "Linha do tempo dos seus treinos com duração, WPM, pontuação e comparação entre sessões." },
      { property: "og:title", content: "Histórico de treinos — Prompter" },
      { property: "og:description", content: "Compare duas sessões e acompanhe sua evolução treino a treino." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { sessions } = useAppState();
  const { deleteSession } = useActions();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(-2)));

  const [a, b] = selected.map((id) => sessions.find((s) => s.id === id)).filter(Boolean);

  return (
    <AppShell title="Histórico" subtitle="Linha do tempo dos seus treinos">
      {sessions.length === 0 ? (
        <EmptyState title="Sem treinos registrados" description="Finalize um treino no modo teleprompter para vê-lo aqui." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <ol className="relative space-y-3 border-l border-border/70 pl-5">
            {sessions.map((session) => (
              <li key={session.id} className="relative">
                <span className="absolute -left-[27px] top-5 size-2.5 rounded-full bg-primary" />
                <Card className="border-border/70 bg-card/70">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selected.includes(session.id)}
                          onCheckedChange={() => toggle(session.id)}
                          aria-label="Selecionar para comparação"
                        />
                        <Link
                          to="/historico/$sessionId"
                          params={{ sessionId: session.id }}
                          className="font-display font-semibold hover:text-primary"
                        >
                          {session.scriptTitle}
                        </Link>
                        {session.recordingId ? <Badge variant="outline">Gravação</Badge> : null}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(session.startedAt).toLocaleString("pt-BR", { dateStyle: "medium", timeStyle: "short" })}
                        {session.notes ? ` · ${session.notes}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm tabular-nums">
                      <span>{formatDuration(session.metrics.durationMs)}</span>
                      <span>{session.metrics.wpm} WPM</span>
                      <Badge>{session.metrics.score} pts</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        aria-label="Excluir sessão"
                        onClick={() => deleteSession(session.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>

          <Card className="h-fit lg:sticky lg:top-24">
            <CardHeader>
              <CardTitle className="text-base">Comparar sessões</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {a && b ? (
                <>
                  <Compare label="Duração" a={formatDuration(a.metrics.durationMs)} b={formatDuration(b.metrics.durationMs)} />
                  <Compare label="WPM" a={`${a.metrics.wpm}`} b={`${b.metrics.wpm}`} />
                  <Compare label="Pausas" a={`${a.metrics.pauses}`} b={`${b.metrics.pauses}`} />
                  <Compare label="Pontuação" a={`${a.metrics.score}`} b={`${b.metrics.score}`} />
                </>
              ) : (
                <p className="text-muted-foreground">Selecione duas sessões na linha do tempo para comparar.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}

function Compare({ label, a, b }: { label: string; a: string; b: string }) {
  return (
    <div className="grid grid-cols-3 items-center gap-2 border-b border-border/60 pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right tabular-nums">{a}</span>
      <span className="text-right tabular-nums text-primary">{b}</span>
    </div>
  );
}
