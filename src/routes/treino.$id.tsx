import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Circle,
  FlipHorizontal2,
  Maximize,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Settings2,
  Square,
} from "lucide-react";
import { toast } from "sonner";
import { AppShellless } from "@/components/teleprompter/shellless";
import { ScriptCanvas } from "@/components/teleprompter/script-canvas";
import { useMediaRecorder } from "@/components/teleprompter/use-media-recorder";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { countWords, estimateDurationMs, formatDuration } from "@/lib/domain/text";
import { TRAINING_LEVELS, type TrainingLevel } from "@/lib/domain/types";
import { useActions, useScript } from "@/lib/storage/app-state";
import { SessionTracker } from "@/lib/services/session-tracking";
import { generateFeedback } from "@/lib/services/feedback";
import { useAppState } from "@/lib/storage/app-state";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/treino/$id")({
  head: () => ({
    meta: [
      { title: "Modo Teleprompter — Treino de Oratória" },
      { name: "description", content: "Apresente seu roteiro com rolagem automática, cronômetro e métricas de fala em tempo real." },
      { property: "og:title", content: "Modo Teleprompter — Treino de Oratória" },
      { property: "og:description", content: "Rolagem automática, controle de velocidade, gravação e métricas de desempenho." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TeleprompterRoute,
});

const LEVEL_LABEL: Record<TrainingLevel, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

function TeleprompterRoute() {
  const { id } = Route.useParams();
  const script = useScript(id);
  const { sessions } = useAppState();
  const { updateSettings, saveSession } = useActions();
  const navigate = useNavigate();

  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const trackerRef = useRef<SessionTracker | null>(null);

  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const recorder = useMediaRecorder();

  const settings = script?.settings;
  const totalWords = useMemo(() => (script ? countWords(script.content) : 0), [script]);
  const totalMs = useMemo(
    () => (script && settings ? estimateDurationMs(script.content, settings.wpm) : 0),
    [script, settings],
  );

  const patch = useCallback(
    (p: Parameters<typeof updateSettings>[1]) => {
      if (script) updateSettings(script.id, p);
    },
    [script, updateSettings],
  );

  /* Motor de rolagem automática */
  useEffect(() => {
    if (!running || !settings) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const content = contentRef.current;
      const viewport = viewportRef.current;
      if (content && viewport) {
        const distance = Math.max(1, content.scrollHeight - viewport.clientHeight * 0.4);
        const seconds = Math.max(1, totalMs / 1000);
        offsetRef.current = Math.min(distance, offsetRef.current + (distance / seconds) * dt);
        content.style.transform = `translate3d(0, ${-offsetRef.current}px, 0)`;
        const p = offsetRef.current / distance;
        setProgress(p);
        if (p >= 1) setRunning(false);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [running, settings, totalMs]);

  /* Cronômetro */
  useEffect(() => {
    if (!trackerRef.current) return;
    const timer = window.setInterval(() => {
      if (trackerRef.current) setElapsed(Date.now() - trackerRef.current.startedAt);
    }, 250);
    return () => window.clearInterval(timer);
  }, [running]);

  const wordsRead = Math.round(progress * totalWords);

  const toggle = useCallback(() => {
    if (!trackerRef.current) trackerRef.current = new SessionTracker();
    setRunning((prev) => {
      if (prev) trackerRef.current?.pause(Math.round(progress * totalWords));
      else trackerRef.current?.play(Math.round(progress * totalWords));
      return !prev;
    });
  }, [progress, totalWords]);

  const restart = useCallback(() => {
    setRunning(false);
    offsetRef.current = 0;
    setProgress(0);
    if (contentRef.current) contentRef.current.style.transform = "translate3d(0,0,0)";
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (typeof document === "undefined") return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen().catch(() => undefined);
  }, []);

  const finish = useCallback(async () => {
    if (!script || !settings || finishing) return;
    setFinishing(true);
    setRunning(false);
    const tracker = trackerRef.current ?? new SessionTracker();
    const metrics = tracker.finish(wordsRead, totalWords);
    if (recorder.status === "recording" || recorder.status === "paused") recorder.stop();
    const previous = sessions.find((s) => s.scriptId === script.id);
    const feedback = await generateFeedback(metrics, previous);
    const session = await saveSession({
      scriptId: script.id,
      scriptTitle: script.title,
      level: settings.level,
      startedAt: new Date(tracker.startedAt).toISOString(),
      metrics,
      feedback,
      recording: recorder.result ? { blob: recorder.result.blob, kind: recorder.result.kind } : null,
    });
    toast.success("Treino salvo com sucesso");
    void navigate({ to: "/historico/$sessionId", params: { sessionId: session.id } });
  }, [finishing, navigate, recorder, saveSession, script, sessions, settings, totalWords, wordsRead]);

  /* Atalhos de teclado */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.closest("input, textarea")) return;
      const key = e.key.toLowerCase();
      if (e.code === "Space") {
        e.preventDefault();
        toggle();
      } else if (key === "arrowup") {
        e.preventDefault();
        patch({ wpm: Math.min(260, (settings?.wpm ?? 140) + 5) });
      } else if (key === "arrowdown") {
        e.preventDefault();
        patch({ wpm: Math.max(60, (settings?.wpm ?? 140) - 5) });
      } else if (key === "+" || key === "=") {
        patch({ fontSize: Math.min(120, (settings?.fontSize ?? 46) + 2) });
      } else if (key === "-") {
        patch({ fontSize: Math.max(18, (settings?.fontSize ?? 46) - 2) });
      } else if (key === "r") restart();
      else if (key === "f") toggleFullscreen();
      else if (key === "m") patch({ mirrored: !settings?.mirrored });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [patch, restart, settings, toggle, toggleFullscreen]);

  if (!script || !settings) {
    return (
      <AppShellless>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
          <p className="font-display text-lg">Roteiro não encontrado.</p>
          <Button asChild variant="secondary">
            <Link to="/roteiros">Voltar à biblioteca</Link>
          </Button>
        </div>
      </AppShellless>
    );
  }

  const remaining = Math.max(0, totalMs - progress * totalMs);

  return (
    <div className={cn("tp-surface flex min-h-screen flex-col", settings.theme === "light" && "tp-light")}>
      {/* Barra superior */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-[var(--tp-fg)]">
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="ghost" className="text-current hover:bg-current/10">
            <Link to="/roteiros/$id" params={{ id: script.id }}>
              <ArrowLeft className="size-4" /> Roteiro
            </Link>
          </Button>
          <Badge variant="outline" className="border-current/25 text-current">
            {LEVEL_LABEL[settings.level]}
          </Badge>
        </div>
        <div className="flex items-center gap-4 font-display text-sm tabular-nums">
          <span title="Tempo decorrido">{formatDuration(elapsed)}</span>
          <span className="opacity-60" title="Tempo restante estimado">
            -{formatDuration(remaining)}
          </span>
          <span className="opacity-60" title="Tempo total estimado">
            / {formatDuration(totalMs)}
          </span>
          <span className="opacity-60">{Math.round(progress * 100)}%</span>
        </div>
      </header>
      <Progress value={progress * 100} className="h-1 rounded-none bg-current/10" />

      {/* Área de leitura */}
      <div
        ref={viewportRef}
        className="relative flex-1 overflow-hidden"
        style={{ filter: `contrast(${settings.contrast}%)` }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-1/3 z-10 h-[1.6em] border-y border-[var(--tp-guide)] bg-[var(--tp-guide)]/8" />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-[var(--tp-bg)] to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-[var(--tp-bg)] to-transparent" />
        <div
          className="absolute inset-x-0 top-0 will-change-transform"
          style={{ transform: "translate3d(0,0,0)", paddingTop: "33vh", paddingBottom: "60vh" }}
          ref={contentRef}
        >
          <div style={{ transform: settings.mirrored ? "scaleX(-1)" : undefined }} className="px-6">
            <ScriptCanvas content={script.content} settings={settings} level={settings.level} />
          </div>
        </div>
      </div>

      {/* Controles */}
      <footer className="border-t border-current/10 bg-[var(--tp-bg)] px-4 py-3 text-[var(--tp-fg)]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-2 sm:justify-between">
          <div className="flex items-center gap-2">
            <Button onClick={toggle} className="min-w-28">
              {running ? <Pause className="size-4" /> : <Play className="size-4" />}
              {running ? "Pausar" : progress > 0 ? "Continuar" : "Iniciar"}
            </Button>
            <IconBtn label="Reiniciar (R)" onClick={restart}>
              <RotateCcw className="size-4" />
            </IconBtn>
            <IconBtn label="Tela cheia (F)" onClick={toggleFullscreen}>
              <Maximize className="size-4" />
            </IconBtn>
            <IconBtn label="Espelhar (M)" onClick={() => patch({ mirrored: !settings.mirrored })} active={settings.mirrored}>
              <FlipHorizontal2 className="size-4" />
            </IconBtn>
          </div>

          <div className="flex items-center gap-2">
            <IconBtn label="Diminuir velocidade" onClick={() => patch({ wpm: Math.max(60, settings.wpm - 5) })}>
              <Minus className="size-4" />
            </IconBtn>
            <span className="w-24 text-center font-display text-sm tabular-nums">{settings.wpm} WPM</span>
            <IconBtn label="Aumentar velocidade" onClick={() => patch({ wpm: Math.min(260, settings.wpm + 5) })}>
              <Plus className="size-4" />
            </IconBtn>
            <IconBtn label="Diminuir fonte" onClick={() => patch({ fontSize: Math.max(18, settings.fontSize - 2) })}>
              <span className="text-xs font-semibold">A-</span>
            </IconBtn>
            <IconBtn label="Aumentar fonte" onClick={() => patch({ fontSize: Math.min(120, settings.fontSize + 2) })}>
              <span className="text-sm font-semibold">A+</span>
            </IconBtn>
          </div>

          <div className="flex items-center gap-2">
            {recorder.status === "recording" || recorder.status === "paused" ? (
              <>
                <IconBtn
                  label={recorder.status === "paused" ? "Continuar gravação" : "Pausar gravação"}
                  onClick={() => (recorder.status === "paused" ? recorder.resume() : recorder.pause())}
                >
                  {recorder.status === "paused" ? <Play className="size-4" /> : <Pause className="size-4" />}
                </IconBtn>
                <IconBtn label="Finalizar gravação" onClick={recorder.stop} active>
                  <Square className="size-4" />
                </IconBtn>
              </>
            ) : (
              <>
                <IconBtn label="Gravar áudio" onClick={() => void recorder.start("audio")}>
                  <Circle className={cn("size-4", recorder.result?.kind === "audio" && "fill-current")} />
                </IconBtn>
              </>
            )}

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-current hover:bg-current/10" aria-label="Ajustes do teleprompter">
                  <Settings2 className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full overflow-y-auto sm:max-w-sm">
                <SheetHeader>
                  <SheetTitle>Ajustes do teleprompter</SheetTitle>
                </SheetHeader>
                <div className="space-y-6 px-4 pb-8">
                  <SliderField label="Velocidade" value={settings.wpm} min={60} max={260} step={5} suffix=" WPM" onChange={(wpm) => patch({ wpm })} />
                  <div className="flex flex-wrap gap-2">
                    {[
                      ["Muito lento", 90],
                      ["Lento", 115],
                      ["Normal", 140],
                      ["Rápido", 170],
                      ["Muito rápido", 200],
                    ].map(([label, value]) => (
                      <Button
                        key={label as string}
                        size="sm"
                        variant={settings.wpm === value ? "default" : "outline"}
                        onClick={() => patch({ wpm: value as number })}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                  <SliderField label="Tamanho da fonte" value={settings.fontSize} min={18} max={120} step={1} suffix="px" onChange={(fontSize) => patch({ fontSize })} />
                  <SliderField label="Espaçamento entre linhas" value={settings.lineHeight} min={1} max={2.6} step={0.1} onChange={(lineHeight) => patch({ lineHeight })} />
                  <SliderField label="Largura da leitura" value={settings.readingWidth} min={40} max={100} step={1} suffix="%" onChange={(readingWidth) => patch({ readingWidth })} />
                  <SliderField label="Contraste" value={settings.contrast} min={60} max={140} step={1} suffix="%" onChange={(contrast) => patch({ contrast })} />
                  <div className="flex items-center justify-between">
                    <Label htmlFor="tp-theme">Modo claro</Label>
                    <Switch id="tp-theme" checked={settings.theme === "light"} onCheckedChange={(v) => patch({ theme: v ? "light" : "dark" })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="tp-mirror">Espelhamento horizontal</Label>
                    <Switch id="tp-mirror" checked={settings.mirrored} onCheckedChange={(mirrored) => patch({ mirrored })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Alinhamento</Label>
                    <ToggleGroup
                      type="single"
                      value={settings.align}
                      onValueChange={(v) => v && patch({ align: v as "left" | "center" })}
                      className="justify-start"
                    >
                      <ToggleGroupItem value="left">Esquerda</ToggleGroupItem>
                      <ToggleGroupItem value="center">Centralizado</ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                  <div className="space-y-2">
                    <Label>Modo treino</Label>
                    <ToggleGroup
                      type="single"
                      value={settings.level}
                      onValueChange={(v) => v && patch({ level: v as TrainingLevel })}
                      className="flex-wrap justify-start"
                    >
                      {TRAINING_LEVELS.map((lvl) => (
                        <ToggleGroupItem key={lvl} value={lvl}>
                          {LEVEL_LABEL[lvl]}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                    <p className="text-xs text-muted-foreground">
                      Iniciante: roteiro completo. Intermediário: texto parcialmente oculto. Avançado: apenas tópicos e palavras-chave.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-3 text-xs text-muted-foreground">
                    Atalhos: Espaço iniciar/pausar · ↑ ↓ velocidade · + / − fonte · R reiniciar · F tela cheia · M espelhar
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Button variant="secondary" onClick={() => void finish()} disabled={finishing}>
              Finalizar treino
            </Button>
          </div>
        </div>
        {recorder.error ? <p className="mt-2 text-center text-xs text-destructive">{recorder.error}</p> : null}
      </footer>
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  children,
  active,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn("text-current hover:bg-current/10", active && "bg-current/15")}
    >
      {children}
    </Button>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  suffix = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <Label>{label}</Label>
        <span className="tabular-nums text-muted-foreground">
          {value}
          {suffix}
        </span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} />
    </div>
  );
}
