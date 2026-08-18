import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useActions, useAppState } from "@/lib/storage/app-state";

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
  const { profile } = useAppState();
  const { updateProfile } = useActions();
  const d = profile.defaults;

  return (
    <AppShell title="Configurações" subtitle="Preferências aplicadas a novos roteiros">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={profile.name} onChange={(e) => updateProfile({ name: e.target.value })} />
            </div>
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
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Padrões do teleprompter</CardTitle>
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
