import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Trash2, Search, Filter, BarChart2 } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { EmptyState } from "@/components/app/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDuration } from "@/lib/domain/text";
import { useActions, useAppState } from "@/lib/storage/app-state";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/historico/")({
  head: () => ({
    meta: [
      { title: "Histórico de treinos — Prompter" },
      { name: "description", content: "Linha do tempo dos seus treinos com duração, WPM, pontuação e comparação entre sessões." },
      { property: "og:title", content: "Histórico de treinos — Prompter" },
      { property: "og:description", content: "Compare duas ou mais sessões e acompanhe sua evolução treino a treino." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { sessions } = useAppState();
  const { deleteSession } = useActions();
  
  // Estado para múltiplos itens selecionados para comparação (limite de 4)
  const [selected, setSelected] = useState<string[]>([]);
  
  // Estados de filtros
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");

  const toggle = (id: string) =>
    setSelected((prev) => 
      prev.includes(id) 
        ? prev.filter((x) => x !== id) 
        : [...prev, id].slice(-4) // Permite comparar até 4 sessões
    );

  // Filtrar sessões
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchesSearch = s.scriptTitle.toLowerCase().includes(search.toLowerCase());
      const matchesLevel = levelFilter === "all" || s.level === levelFilter;
      return matchesSearch && matchesLevel;
    });
  }, [sessions, search, levelFilter]);

  // Obter as sessões selecionadas resolvidas
  const selectedSessions = useMemo(() => {
    return selected
      .map((id) => sessions.find((s) => s.id === id))
      .filter(Boolean)
      .sort((a, b) => a!.startedAt.localeCompare(b!.startedAt)); // Ordenar por data cronológica para o gráfico
  }, [selected, sessions]);

  // Preparar dados para o gráfico de comparação
  const chartData = useMemo(() => {
    return selectedSessions.map((s) => ({
      data: new Date(s!.startedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      score: s!.metrics.score,
      wpm: s!.metrics.wpm,
      titulo: s!.scriptTitle,
    }));
  }, [selectedSessions]);

  return (
    <AppShell title="Histórico" subtitle="Linha do tempo e análise de evolução dos seus treinos">
      {sessions.length === 0 ? (
        <EmptyState title="Sem treinos registrados" description="Finalize um treino no modo teleprompter para vê-lo aqui." />
      ) : (
        <div className="space-y-4">
          
          {/* Barra de Filtros */}
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-card/40 p-4">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar pelo nome do roteiro..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-muted-foreground" />
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">Todos os Níveis</option>
                <option value="iniciante">Iniciante</option>
                <option value="intermediario">Intermediário</option>
                <option value="avancado">Avançado</option>
              </select>
            </div>

            {selected.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setSelected([])} className="text-muted-foreground text-xs ml-auto">
                Limpar seleção ({selected.length})
              </Button>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
            {/* Lista de Treinos */}
            <div className="space-y-3">
              {filteredSessions.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-border rounded-xl">
                  <p className="text-sm text-muted-foreground">Nenhum treino corresponde aos filtros selecionados.</p>
                </div>
              ) : (
                <ol className="relative space-y-3 border-l border-border/70 pl-5">
                  {filteredSessions.map((session) => (
                    <li key={session.id} className="relative">
                      <span className="absolute left-[-27px] top-5 size-2.5 rounded-full bg-primary" />
                      <Card className="border-border/70 bg-card/70 hover:bg-card/90 transition-colors">
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
                                className="font-display font-semibold hover:text-primary transition-colors text-sm sm:text-base"
                              >
                                {session.scriptTitle}
                              </Link>
                              {session.recordingId ? <Badge variant="outline" className="text-xs">Gravação</Badge> : null}
                              <Badge variant="secondary" className="capitalize text-xs">
                                {session.level}
                              </Badge>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {new Date(session.startedAt).toLocaleString("pt-BR", { dateStyle: "medium", timeStyle: "short" })}
                              {session.notes ? ` · ${session.notes}` : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 text-sm tabular-nums ml-auto sm:ml-0">
                            <span>{formatDuration(session.metrics.durationMs)}</span>
                            <span>{session.metrics.wpm} WPM</span>
                            <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30">{session.metrics.score} pts</Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:bg-destructive/10"
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
              )}
            </div>

            {/* Painel Comparativo e Gráfico */}
            <div className="space-y-4">
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart2 className="size-4 text-primary" />
                    Comparação Avançada
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  {selectedSessions.length > 0 ? (
                    <div className="space-y-4">
                      {/* Gráfico de Evolução */}
                      {selectedSessions.length > 1 && (
                        <div className="h-44 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                              <XAxis dataKey="data" stroke="#888" fontSize={11} />
                              <YAxis stroke="#888" fontSize={11} />
                              <ChartTooltip
                                contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
                                labelStyle={{ color: "var(--foreground)" }}
                              />
                              <Line type="monotone" dataKey="score" stroke="oklch(0.79 0.135 178)" strokeWidth={2} name="Pontos" />
                              <Line type="monotone" dataKey="wpm" stroke="oklch(0.8 0.14 78)" strokeWidth={2} name="WPM" />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {/* Tabela de Comparação Lado a Lado */}
                      <div className="overflow-x-auto rounded-lg border border-border/60">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-muted/40 text-muted-foreground font-semibold">
                            <tr>
                              <th className="p-2 border-b border-border/60">Métrica</th>
                              {selectedSessions.map((s, idx) => (
                                <th key={s!.id} className="p-2 border-b border-border/60 text-right min-w-[70px] truncate max-w-[100px]">
                                  T{idx + 1} ({new Date(s!.startedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })})
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="p-2 border-b border-border/40 font-medium">Pontos</td>
                              {selectedSessions.map((s) => (
                                <td key={s!.id} className="p-2 border-b border-border/40 text-right font-bold text-primary">
                                  {s!.metrics.score}
                                </td>
                              ))}
                            </tr>
                            <tr>
                              <td className="p-2 border-b border-border/40 font-medium">Velocidade</td>
                              {selectedSessions.map((s) => (
                                <td key={s!.id} className="p-2 border-b border-border/40 text-right">
                                  {s!.metrics.wpm} WPM
                                </td>
                              ))}
                            </tr>
                            <tr>
                              <td className="p-2 border-b border-border/40 font-medium">Duração</td>
                              {selectedSessions.map((s) => (
                                <td key={s!.id} className="p-2 border-b border-border/40 text-right">
                                  {formatDuration(s!.metrics.durationMs)}
                                </td>
                              ))}
                            </tr>
                            <tr>
                              <td className="p-2 border-b border-border/40 font-medium">Pausas</td>
                              {selectedSessions.map((s) => (
                                <td key={s!.id} className="p-2 border-b border-border/40 text-right">
                                  {s!.metrics.pauses}
                                </td>
                              ))}
                            </tr>
                            <tr>
                              <td className="p-2 font-medium">Nível</td>
                              {selectedSessions.map((s) => (
                                <td key={s!.id} className="p-2 text-right capitalize text-[10px]">
                                  {s!.level}
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <p className="text-[10px] text-muted-foreground italic text-center">
                        Selecionados: {selectedSessions.map((s, idx) => `T${idx + 1} = ${s!.scriptTitle.slice(0, 10)}...`).join(", ")}
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      Selecione até 4 treinos na linha do tempo para gerar o gráfico e comparar as métricas lado a lado.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
