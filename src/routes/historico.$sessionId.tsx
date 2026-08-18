import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Lightbulb, Trash2, TriangleAlert } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { StatCard } from "@/components/app/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatDuration } from "@/lib/domain/text";
import { useActions, useAppState } from "@/lib/storage/app-state";
import { recordings } from "@/lib/storage/recordings";

export const Route = createFileRoute("/historico/$sessionId")({
  head: () => ({
    meta: [
      { title: "Análise do treino — Prompter" },
      { name: "description", content: "Métricas detalhadas, gravação e feedback inteligente da sua sessão de treino." },
      { property: "og:title", content: "Análise do treino — Prompter" },
      { property: "og:description", content: "WPM, pausas, ritmo, pontuação e recomendações práticas." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SessionAnalysis,
});

function SessionAnalysis() {
  const { sessionId } = Route.useParams();
  const { sessions } = useAppState();
  const { updateSession, deleteRecording } = useActions();
  const session = sessions.find((s) => s.id === sessionId);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);

  useEffect(() => {
    let url: string | null = null;
    if (session?.recordingId) {
      void recordings.load(session.recordingId).then((blob) => {
        if (blob) {
          url = URL.createObjectURL(blob);
          setMediaUrl(url);
        }
      });
    }
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [session?.recordingId]);

  if (!session) {
    return (
      <AppShell title="Sessão não encontrada">
        <Button asChild variant="secondary">
          <Link to="/historico">Voltar ao histórico</Link>
        </Button>
      </AppShell>
    );
  }

  const m = session.metrics;
  const icons = { forte: CheckCircle2, melhoria: TriangleAlert, recomendacao: Lightbulb };
  const titles = { forte: "Ponto forte", melhoria: "Ponto de melhoria", recomendacao: "Recomendação" };
  const colors = { forte: "text-success", melhoria: "text-warning", recomendacao: "text-primary" };

  return (
    <AppShell
      title="Análise do treino"
      subtitle={`${session.scriptTitle} · ${new Date(session.startedAt).toLocaleString("pt-BR")}`}
      actions={
        <Button variant="outline" asChild>
          <Link to="/historico">
            <ArrowLeft className="size-4" /> Histórico
          </Link>
        </Button>
      }
    >
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Duração total" value={formatDuration(m.durationMs)} />
        <StatCard label="Palavras faladas" value={String(m.wordsSpoken)} />
        <StatCard label="Velocidade" value={`${m.wpm} WPM`} />
        <StatCard label="Pontuação" value={`${m.score}`} hint="0 a 100" />
        <StatCard label="Pausas" value={String(m.pauses)} />
        <StatCard label="Duração média das pausas" value={`${(m.avgPauseMs / 1000).toFixed(1)}s`} />
        <StatCard label="Fala contínua" value={formatDuration(m.longestStreakMs)} />
        <StatCard label="Variação de ritmo" value={`±${m.rhythmVariation} WPM`} />
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Feedback inteligente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {session.feedback.map((item, i) => {
              const Icon = icons[item.kind];
              return (
                <div key={i} className="flex gap-3 rounded-lg border border-border/60 p-3">
                  <Icon className={`mt-0.5 size-4 shrink-0 ${colors[item.kind]}`} />
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wide ${colors[item.kind]}`}>{titles[item.kind]}</p>
                    <p className="text-sm text-muted-foreground">{item.text}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gravação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mediaUrl && session.recordingKind === "video" ? (
                <video src={mediaUrl} controls className="w-full rounded-lg" />
              ) : mediaUrl ? (
                <audio src={mediaUrl} controls className="w-full" />
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma gravação vinculada a este treino.</p>
              )}
              {session.recordingId ? (
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteRecording(session.id)}>
                  <Trash2 className="size-4" /> Excluir gravação
                </Button>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={session.notes}
                placeholder="Como você se sentiu nesta apresentação?"
                onChange={(e) => updateSession(session.id, { notes: e.target.value })}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
