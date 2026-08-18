import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/app/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useActions, useAppState } from "@/lib/storage/app-state";
import { obterChaveGemini, salvarChaveGemini } from "@/lib/services/db-api";
import { LogOut, Bot, ShieldCheck, Eye, EyeOff, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Prompter" },
      { name: "description", content: "Defina padrões de velocidade, fonte e metas semanais para os seus treinos de oratória." },
      { property: "og:title", content: "Configurações — Prompter" },
      { property: "og:description", content: "Preferências do teleprompter e metas de treino." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { profile, user } = useAppState();
  const { updateProfile, logout } = useActions();
  const navigate = useNavigate();
  const d = profile.defaults;

  // Estados da chave da API do Gemini
  const [geminiKey, setGeminiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [salvandoKey, setSalvandoKey] = useState(false);

  // Carregar chave se for administrador
  useEffect(() => {
    if (user?.email === "admin@eloquence.pro") {
      obterChaveGemini()
        .then(setGeminiKey)
        .catch((err) => console.error("Erro ao carregar chave do Gemini:", err));
    }
  }, [user]);

  const handleSalvarKey = async () => {
    if (!geminiKey) {
      toast.error("A chave não pode estar vazia.");
      return;
    }
    setSalvandoKey(true);
    try {
      await salvarChaveGemini({ data: geminiKey });
      toast.success("Chave de API do Gemini salva com sucesso!");
    } catch {
      toast.error("Erro ao salvar a chave no servidor.");
    } finally {
      setSalvandoKey(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Sessão encerrada com sucesso!");
    void navigate({ to: "/login" });
  };

  const handleClearCache = () => {
    localStorage.clear();
    sessionStorage.clear();
    toast.success("Cache e dados locais apagados com sucesso!");
    setTimeout(() => {
      window.location.href = "/login";
    }, 1000);
  };

  return (
    <AppShell title="Configurações" subtitle="Preferências aplicadas a novos roteiros e conta">
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Card do Perfil */}
        <Card className="flex flex-col justify-between">
          <div>
            <CardHeader>
              <CardTitle className="text-base">Perfil do Orador</CardTitle>
              <CardDescription>Gerencie suas informações e sua conta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" value={profile.name} onChange={(e) => updateProfile({ name: e.target.value })} />
              </div>
              
              {user && (
                <div className="space-y-1 bg-muted/20 p-2.5 rounded-lg border border-border/40 text-xs">
                  <p className="text-muted-foreground">E-mail conectado:</p>
                  <p className="font-mono font-semibold text-foreground">{user.email}</p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <Label>Meta de treinos por semana</Label>
                  <span className="tabular-nums text-muted-foreground">{profile.goalSessionsPerWeek}</span>
                </div>
                <Slider
                  value={[profile.goalSessionsPerWeek]}
                  min={1}
                  max={14}
                  step={1}
                  onValueChange={(vals) => updateProfile({ goalSessionsPerWeek: vals[0] ?? profile.goalSessionsPerWeek })}
                />
              </div>
            </CardContent>
          </div>
          
          <CardContent className="pt-0 mt-auto flex flex-col gap-2">
            <Button variant="outline" onClick={handleClearCache} className="w-full flex items-center gap-2 mt-4 text-muted-foreground hover:text-foreground">
              <RotateCcw className="size-4" /> Limpar Cache Local
            </Button>
            <Button variant="destructive" onClick={handleLogout} className="w-full flex items-center gap-2">
              <LogOut className="size-4" /> Sair da Conta
            </Button>
          </CardContent>
        </Card>

        {/* Card do Teleprompter */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Padrões do teleprompter</CardTitle>
            <CardDescription>Ajustes padrão aplicados ao criar novos roteiros</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SliderRow label="Velocidade" value={d.wpm} min={60} max={260} step={5} suffix=" WPM" onChange={(wpm) => updateProfile({ defaults: { ...d, wpm } })} />
            <SliderRow label="Tamanho da fonte" value={d.fontSize} min={18} max={120} step={1} suffix="px" onChange={(fontSize) => updateProfile({ defaults: { ...d, fontSize } })} />
            <SliderRow label="Espaçamento" value={d.lineHeight} min={1} max={2.6} step={0.1} onChange={(lineHeight) => updateProfile({ defaults: { ...d, lineHeight } })} />
            <SliderRow label="Largura de leitura" value={d.readingWidth} min={40} max={100} step={1} suffix="%" onChange={(readingWidth) => updateProfile({ defaults: { ...d, readingWidth } })} />
            <div className="flex items-center justify-between">
              <Label htmlFor="mirror">Espelhamento por padrão</Label>
              <Switch id="mirror" checked={d.mirrored} onCheckedChange={(mirrored) => updateProfile({ defaults: { ...d, mirrored } })} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="light">Modo claro no teleprompter</Label>
              <Switch
                id="light"
                checked={d.theme === "light"}
                onCheckedChange={(v) => updateProfile({ defaults: { ...d, theme: v ? "light" : "dark" } })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Card de Configurações da Inteligência Artificial */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="size-5 text-primary animate-pulse" />
              Inteligência Artificial (Gemini API)
            </CardTitle>
            <CardDescription>Ajustes de integração do avaliador automático de discurso</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <div>
                <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-emerald-500" />
                  Conexão ativa do Servidor
                </p>
                <p className="text-xs text-muted-foreground">
                  A chave de acesso está configurada no servidor (.env) e pronta para uso.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-500">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Gemini Ativo
              </span>
            </div>

            {/* Apenas para administradores */}
            {user?.email === "admin@eloquence.pro" && (
              <div className="space-y-2 border-b border-border/40 pb-4">
                <Label htmlFor="gemini-key" className="text-xs font-bold text-foreground">
                  Chave de API do Gemini (Apenas Administrador)
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="gemini-key"
                      type={showKey ? "text" : "password"}
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      placeholder="Cole sua API Key do Gemini aqui..."
                      className="pr-10 bg-background/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  <Button onClick={handleSalvarKey} disabled={salvandoKey}>
                    {salvandoKey ? "Salvando..." : "Salvar Chave"}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Alterar este valor irá sobrescrever a chave de acesso do arquivo <strong>.env</strong> em tempo real.
                </p>
              </div>
            )}

            <div className="bg-muted/30 border border-border/60 rounded-xl p-3 text-xs text-muted-foreground space-y-2">
              <p className="font-semibold text-foreground">Como funciona o feedback por IA?</p>
              <p>
                Toda vez que você orar um roteiro no modo teleprompter com a transcrição ativada, os dados gravados da sua voz 
                e o roteiro original serão enviados de forma segura ao Gemini da Google. O modelo de linguagem fará uma 
                avaliação detalhada gerando pontos fortes, fracos e feedbacks úteis para ajudar você a melhorar a sua oratória.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function SliderRow({
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
      <div className="flex justify-between text-sm">
        <Label>{label}</Label>
        <span className="tabular-nums text-muted-foreground">
          {value}
          {suffix}
        </span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(vals) => onChange(vals[0] ?? value)} />
    </div>
  );
}
