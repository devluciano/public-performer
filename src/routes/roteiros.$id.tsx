import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Bold, Copy, Download, Heading2, Play, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { countWords, CUES, estimateDurationMs, formatDuration, parseSections } from "@/lib/domain/text";
import { SCRIPT_CATEGORIES, type ScriptCategory } from "@/lib/domain/types";
import { useActions, useScript } from "@/lib/storage/app-state";
import { downloadScript, extractTextFromFile } from "@/lib/services/import-script";

export const Route = createFileRoute("/roteiros/$id")({
  head: () => ({
    meta: [
      { title: "Editor de roteiro — Prompter" },
      { name: "description", content: "Escreva, importe e marque seu roteiro com pausas, ênfases e seções antes de treinar." },
      { property: "og:title", content: "Editor de roteiro — Prompter" },
      { property: "og:description", content: "Editor com contador de palavras, duração estimada e marcações de oratória." },
    ],
  }),
  component: Editor,
});

function Editor() {
  const { id } = Route.useParams();
  const script = useScript(id);
  const { updateScript, duplicateScript, deleteScript } = useActions();
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState<string | null>(null);
  const [saved, setSaved] = useState(true);
  const [importing, setImporting] = useState(false);

  const content = draft ?? script?.content ?? "";

  /* Salvamento automático (debounce) */
  useEffect(() => {
    if (draft === null || !script || draft === script.content) return;
    setSaved(false);
    const timer = window.setTimeout(() => {
      updateScript(script.id, { content: draft });
      setSaved(true);
    }, 600);
    return () => window.clearTimeout(timer);
  }, [draft, script, updateScript]);

  if (!script) {
    return (
      <AppShell title="Roteiro não encontrado">
        <Button asChild variant="secondary">
          <Link to="/roteiros">Voltar à biblioteca</Link>
        </Button>
      </AppShell>
    );
  }

  const words = countWords(content);
  const duration = estimateDurationMs(content, script.settings.wpm);
  const sections = parseSections(content);

  const insert = (before: string, after = "") => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = content.slice(0, start) + before + content.slice(start, end) + after + content.slice(end);
    setDraft(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + before.length + (end - start) + after.length;
    });
  };

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    setImporting(true);
    try {
      const text = await extractTextFromFile(file);
      setDraft(text);
      toast.success("Roteiro importado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao importar arquivo");
    } finally {
      setImporting(false);
    }
  };

  return (
    <AppShell
      title="Editor de roteiro"
      subtitle={saved ? "Salvo automaticamente" : "Salvando…"}
      actions={
        <>
          <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={importing}>
            <Upload className="size-4" /> {importing ? "Importando…" : "Importar"}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.md,.docx,.pdf"
            className="hidden"
            onChange={(e) => void onImport(e.target.files?.[0])}
          />
          <Button variant="outline" onClick={() => downloadScript(script.title, content)}>
            <Download className="size-4" /> Exportar
          </Button>
          <Button asChild>
            <Link to="/treino/$id" params={{ id: script.id }}>
              <Play className="size-4" /> Iniciar treino
            </Link>
          </Button>
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="title">Título</Label>
                <Input id="title" value={script.title} onChange={(e) => updateScript(script.id, { title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={script.category}
                  onValueChange={(v) => updateScript(script.id, { category: v as ScriptCategory })}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCRIPT_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={script.description}
                placeholder="Contexto, público, objetivo…"
                onChange={(e) => updateScript(script.id, { description: e.target.value })}
              />
            </div>

            <div className="flex flex-wrap gap-2 rounded-lg border border-border/70 bg-muted/30 p-2">
              <Button size="sm" variant="ghost" onClick={() => insert("## ", "")} title="Nova seção">
                <Heading2 className="size-4" /> Seção
              </Button>
              <Button size="sm" variant="ghost" onClick={() => insert("**", "**")} title="Destacar palavra">
                <Bold className="size-4" /> Destaque
              </Button>
              {CUES.map((cue) => (
                <Button key={cue} size="sm" variant="ghost" onClick={() => insert(` ${cue} `)}>
                  {cue}
                </Button>
              ))}
            </div>

            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Escreva seu discurso. Use ## para seções, ** para destacar palavras e as marcações de pausa."
              className="min-h-[420px] font-sans text-base leading-relaxed"
              aria-label="Conteúdo do roteiro"
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Palavras" value={String(words)} />
              <Row label="Duração estimada" value={formatDuration(duration)} />
              <Row label="Velocidade" value={`${script.settings.wpm} WPM`} />
              <Row label="Seções" value={String(sections.length)} />
              <Row label="Treinos" value={String(script.sessionsCount)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Seções</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sections.map((s, i) => (
                <div key={i} className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2 text-sm">
                  <span className="truncate">{s.title}</span>
                  <Badge variant="outline">{countWords(s.body)} pal.</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-2 p-4">
              <Button
                variant="outline"
                onClick={() => {
                  const copy = duplicateScript(script.id);
                  if (copy) void navigate({ to: "/roteiros/$id", params: { id: copy.id } });
                }}
              >
                <Copy className="size-4" /> Duplicar roteiro
              </Button>
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  deleteScript(script.id);
                  void navigate({ to: "/roteiros" });
                }}
              >
                <Trash2 className="size-4" /> Excluir roteiro
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
