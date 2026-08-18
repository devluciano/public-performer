import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Copy, Play, Plus, Search, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { EmptyState } from "@/components/app/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { countWords, estimateDurationMs, formatDuration } from "@/lib/domain/text";
import { SCRIPT_CATEGORIES } from "@/lib/domain/types";
import { useActions, useAppState } from "@/lib/storage/app-state";

export const Route = createFileRoute("/roteiros/")({
  head: () => ({
    meta: [
      { title: "Biblioteca de roteiros — Prompter" },
      { name: "description", content: "Organize, filtre e gerencie todos os seus roteiros de apresentação em um só lugar." },
      { property: "og:title", content: "Biblioteca de roteiros — Prompter" },
      { property: "og:description", content: "Roteiros por categoria, duração estimada, uso e melhor desempenho." },
    ],
  }),
  component: Library,
});

type SortKey = "recentes" | "mais_usados" | "nome" | "data";

function Library() {
  const { scripts, sessions } = useAppState();
  const { createScript, duplicateScript, deleteScript } = useActions();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("todas");
  const [sort, setSort] = useState<SortKey>("recentes");

  const rows = useMemo(() => {
    const list = scripts
      .filter((s) => (category === "todas" ? true : s.category === category))
      .filter((s) => s.title.toLowerCase().includes(query.toLowerCase()));
    const sorted = [...list];
    if (sort === "nome") sorted.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "mais_usados") sorted.sort((a, b) => b.sessionsCount - a.sessionsCount);
    if (sort === "data") sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return sorted;
  }, [scripts, category, query, sort]);

  const bestScore = (scriptId: string) =>
    sessions.filter((s) => s.scriptId === scriptId).reduce((max, s) => Math.max(max, s.metrics.score), 0);

  return (
    <AppShell
      title="Meus roteiros"
      subtitle="Crie, organize e prepare seus discursos"
      actions={
        <Button
          onClick={() => {
            const script = createScript();
            void navigate({ to: "/roteiros/$id", params: { id: script.id } });
          }}
        >
          <Plus className="size-4" /> Novo roteiro
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome"
            className="pl-9"
            aria-label="Buscar roteiros"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-44" aria-label="Filtrar por categoria">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as categorias</SelectItem>
            {SCRIPT_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-40" aria-label="Ordenar">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recentes">Recentes</SelectItem>
            <SelectItem value="mais_usados">Mais utilizados</SelectItem>
            <SelectItem value="nome">Nome</SelectItem>
            <SelectItem value="data">Data de criação</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="Nenhum roteiro encontrado" description="Ajuste os filtros ou crie um novo roteiro para começar." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((script) => {
            const words = countWords(script.content);
            return (
              <Card key={script.id} className="flex flex-col justify-between border-border/70 bg-card/70">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      to="/roteiros/$id"
                      params={{ id: script.id }}
                      className="font-display text-base font-semibold hover:text-primary"
                    >
                      {script.title}
                    </Link>
                    <Badge variant="secondary">{script.category}</Badge>
                  </div>
                  <p className="line-clamp-2 min-h-8 text-sm text-muted-foreground">
                    {script.description || "Sem descrição."}
                  </p>
                  <dl className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                    <div>Palavras: <span className="text-foreground">{words}</span></div>
                    <div>Duração: <span className="text-foreground">{formatDuration(estimateDurationMs(script.content, script.settings.wpm))}</span></div>
                    <div>Treinos: <span className="text-foreground">{script.sessionsCount}</span></div>
                    <div>Melhor: <span className="text-foreground">{bestScore(script.id) || "—"}</span></div>
                    <div className="col-span-2">
                      Último uso:{" "}
                      <span className="text-foreground">
                        {script.lastUsedAt ? new Date(script.lastUsedAt).toLocaleDateString("pt-BR") : "nunca"}
                      </span>
                    </div>
                  </dl>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" asChild>
                      <Link to="/treino/$id" params={{ id: script.id }}>
                        <Play className="size-4" /> Treinar
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => duplicateScript(script.id)}>
                      <Copy className="size-4" /> Duplicar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteScript(script.id)}
                      aria-label={`Excluir ${script.title}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
