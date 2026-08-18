import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useScript } from "@/lib/storage/app-state";
import { enviarComandoRemoto } from "@/lib/services/db-api";
import { AppShellless } from "@/components/teleprompter/shellless";
import { toast } from "sonner";

export const Route = createFileRoute("/controle/$id")({
  head: () => ({
    meta: [
      { title: "Controle Remoto — Prompter" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RemoteControlPage,
});

function RemoteControlPage() {
  const { id } = Route.useParams();
  const script = useScript(id);
  const [activeCommand, setActiveCommand] = useState<string | null>(null);

  const mandarComando = async (comando: string) => {
    setActiveCommand(comando);
    try {
      await enviarComandoRemoto({ data: { scriptId: id, comando } });
      toast.success(`Comando "${comando}" enviado`);
    } catch (err) {
      toast.error("Erro ao enviar comando para o prompter.");
    }
    setTimeout(() => setActiveCommand(null), 300);
  };

  if (!script) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-center p-4">
        <p className="text-muted-foreground">Roteiro não encontrado ou banco de dados inacessível.</p>
        <Button asChild variant="secondary">
          <Link to="/">Ir ao Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <AppShellless>
      <div className="flex min-h-screen flex-col bg-background p-4 justify-between max-w-md mx-auto">
        <header className="text-center py-4 border-b border-border/60">
          <h1 className="font-display text-lg font-bold text-foreground truncate">
            📱 Controle Remoto
          </h1>
          <p className="text-xs text-muted-foreground truncate">{script.title}</p>
        </header>

        <main className="flex-1 flex flex-col justify-center gap-6 my-6">
          {/* Botão Gigante de Play/Pause */}
          <div className="flex justify-center">
            <button
              onClick={() => mandarComando("toggle")}
              className={`size-32 rounded-full border-4 border-primary flex items-center justify-center bg-primary/10 active:opacity-80 transition-all ${
                activeCommand === "toggle" ? "scale-95" : ""
              }`}
            >
              <div className="flex gap-2 text-primary">
                <Play className="size-8 fill-current" />
                <span className="text-lg">/</span>
                <Pause className="size-8 fill-current" />
              </div>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Velocidade */}
            <Card className="bg-card/50">
              <CardHeader className="p-3 text-center">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Velocidade</CardTitle>
              </CardHeader>
              <CardContent className="p-3 flex justify-around">
                <Button size="icon" variant="outline" onClick={() => mandarComando("wpm_down")}>
                  <Minus className="size-5" />
                </Button>
                <Button size="icon" variant="outline" onClick={() => mandarComando("wpm_up")}>
                  <Plus className="size-5" />
                </Button>
              </CardContent>
            </Card>

            {/* Fonte */}
            <Card className="bg-card/50">
              <CardHeader className="p-3 text-center">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Tamanho Fonte</CardTitle>
              </CardHeader>
              <CardContent className="p-3 flex justify-around">
                <Button size="icon" variant="outline" onClick={() => mandarComando("font_down")}>
                  <span className="font-bold text-sm">A-</span>
                </Button>
                <Button size="icon" variant="outline" onClick={() => mandarComando("font_up")}>
                  <span className="font-bold text-sm">A+</span>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Reiniciar */}
          <Button
            size="lg"
            variant="outline"
            className="w-full flex items-center justify-center gap-2 border-primary/30 text-primary hover:bg-primary/10 active:scale-95 transition-all py-6"
            onClick={() => mandarComando("restart")}
          >
            <RotateCcw className="size-5" /> Reiniciar Prompter
          </Button>
        </main>

        <footer className="text-center text-[10px] text-muted-foreground py-4 border-t border-border/40">
          Mantenha o celular conectado na mesma rede Wi-Fi do computador.
        </footer>
      </div>
    </AppShellless>
  );
}
