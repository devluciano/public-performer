import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Bold, Heading2, Save, Upload, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { countWords, CUES, estimateDurationMs, formatDuration } from "@/lib/domain/text";
import { SCRIPT_CATEGORIES, type ScriptCategory } from "@/lib/domain/types";
import { useActions, useAppState } from "@/lib/storage/app-state";
import { extractTextFromFile } from "@/lib/services/import-script";

export const Route = createFileRoute("/roteiros/criar")({
  head: () => ({
    meta: [
      { title: "Cadastrar roteiro — Prompter" },
      { name: "description", content: "Crie um novo roteiro para a sua apresentação." },
    ],
  }),
  component: CreateScriptPage,
});

function CreateScriptPage() {
  const { profile } = useAppState();
  const { createScript } = useActions();
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Estados locais do formulário de criação
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ScriptCategory>("Apresentação");
  const [content, setContent] = useState("");
  const [importing, setImporting] = useState(false);

  const words = countWords(content);
  const duration = estimateDurationMs(content, profile.defaults.wpm);

  const insert = (before: string, after = "") => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = content.slice(0, start) + before + content.slice(start, end) + after + content.slice(end);
    setContent(next);
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
      setContent(text);
      toast.success("Roteiro importado com sucesso");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao importar arquivo");
    } finally {
      setImporting(false);
    }
  };

  const handleSalvar = () => {
    if (!title.trim()) {
      toast.error("O título do roteiro é obrigatório.");
      return;
    }

    // Criar e salvar roteiro no banco e na memória do usuário logado
    const script = createScript({
      title,
      description,
      category,
      content,
    });

    toast.success("Roteiro cadastrado com sucesso!");
    void navigate({ to: "/roteiros" });
  };

  return (
    <AppShell
      title="Cadastrar Roteiro"
      subtitle="Preencha os campos para salvar seu novo discurso"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/roteiros">
              <ArrowLeft className="size-4" /> Cancelar
            </Link>
          </Button>
          <Button onClick={handleSalvar} className="gap-2">
            <Save className="size-4" /> Salvar Roteiro
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="border-border/60 bg-card/60">
          <CardContent className="space-y-4 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  placeholder="Nome do seu discurso"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category">Categoria</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as ScriptCategory)}>
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
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Input
                id="description"
                placeholder="Uma breve descrição sobre a apresentação"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-1">
                <Label htmlFor="editor-content">Texto do roteiro</Label>
                <div className="flex flex-wrap gap-1">
                  <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={importing} className="h-7 text-xs">
                    <Upload className="size-3.5 mr-1" /> {importing ? "Importando…" : "Importar arquivo"}
                  </Button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".txt,.md,.docx,.pdf"
                    className="hidden"
                    onChange={(e) => void onImport(e.target.files?.[0])}
                  />
                  <Button variant="outline" size="sm" onClick={() => insert("## Nome da seção\n")} className="h-7 text-xs" title="Adicionar seção">
                    <Heading2 className="size-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => insert("**", "**")} className="h-7 text-xs font-bold" title="Negrito">
                    <Bold className="size-3.5" />
                  </Button>
                </div>
              </div>

              <Textarea
                id="editor-content"
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escreva seu discurso aqui. Use cabeçalhos '##' para dividir as seções do teleprompter."
                className="min-h-96 font-sans text-base leading-relaxed bg-background/50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Painel lateral de métricas e dicas */}
        <div className="space-y-4">
          <Card className="border-border/60 bg-card/60">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-display text-sm font-semibold">Métricas estimadas</h3>
              <dl className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>Palavras: <span className="text-foreground font-semibold">{words}</span></div>
                <div>Duração: <span className="text-foreground font-semibold">{formatDuration(duration)}</span></div>
              </dl>
              <div className="text-[10px] text-muted-foreground border-t border-border/40 pt-2 leading-relaxed">
                As métricas de tempo são estimadas com base na velocidade padrão do seu perfil ({profile.defaults.wpm} WPM).
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-display text-sm font-semibold">Marcações de oratória</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Insira marcações especiais entre colchetes para guiar seu ritmo e postura durante a rolagem:
              </p>
              <ul className="space-y-2 text-xs">
                {CUES.map((cue) => {
                  const label = cue === "[PAUSA]" 
                    ? "Pausa recomendada na fala" 
                    : cue === "[ÊNFASE]" 
                    ? "Destacar palavra/trecho" 
                    : cue === "[RESPIRAR]" 
                    ? "Respiração profunda para controle do ritmo" 
                    : "Olhar e engajar com a plateia";
                  return (
                    <li key={cue}>
                      <button
                        onClick={() => insert(cue)}
                        className="w-full text-left font-mono text-[10px] font-semibold text-primary hover:underline"
                      >
                        {cue}
                      </button>
                      <p className="text-[10px] text-muted-foreground">{label}</p>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
