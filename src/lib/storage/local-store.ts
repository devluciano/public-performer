import {
  defaultSettings,
  profileSchema,
  scriptSchema,
  sessionSchema,
  type Profile,
  type Script,
  type TrainingSession,
} from "@/lib/domain/types";
import { z } from "zod";

const KEYS = {
  scripts: "oratoria.scripts.v1",
  sessions: "oratoria.sessions.v1",
  profile: "oratoria.profile.v1",
} as const;

type State = { scripts: Script[]; sessions: TrainingSession[]; profile: Profile };

const emptyState = (): State => ({
  scripts: [],
  sessions: [],
  profile: profileSchema.parse({ defaults: defaultSettings() }),
});

let state: State = emptyState();
let hydrated = false;
const listeners = new Set<() => void>();

function read<T>(key: string, schema: z.ZodType<T, z.ZodTypeDef, unknown>, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : fallback;
  } catch {
    return fallback;
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEYS.scripts, JSON.stringify(state.scripts));
    window.localStorage.setItem(KEYS.sessions, JSON.stringify(state.sessions));
    window.localStorage.setItem(KEYS.profile, JSON.stringify(state.profile));
  } catch {
    /* quota / private mode — ignora */
  }
}

function emit() {
  listeners.forEach((l) => l());
}

export function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  const base = emptyState();
  state = {
    scripts: read(KEYS.scripts, z.array(scriptSchema), base.scripts),
    sessions: read(KEYS.sessions, z.array(sessionSchema), base.sessions),
    profile: read(KEYS.profile, profileSchema, base.profile),
  };
  if (state.scripts.length === 0) {
    state.scripts = [seedScript()];
    persist();
  }
  emit();
}

export const store = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => state,
  set(updater: (s: State) => State) {
    state = updater(state);
    persist();
    emit();
  },
};

export const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

function seedScript(): Script {
  const now = new Date().toISOString();
  return scriptSchema.parse({
    id: newId(),
    title: "Pitch de 2 minutos",
    description: "Roteiro de exemplo para começar a treinar.",
    category: "Pitch",
    content: `## Abertura
Bom dia a todos. Meu nome é **Alex** e nos próximos dois minutos vou mostrar como podemos **reduzir pela metade** o tempo de preparação de uma apresentação. [PAUSA]

## Problema
Hoje, cada pessoa desta sala gasta em média três horas ensaiando um discurso sem qualquer métrica sobre o próprio desempenho. [RESPIRAR]

## Solução
Nós criamos um teleprompter de treino que mede ritmo, pausas e evolução ao longo do tempo. [ÊNFASE] O resultado é uma fala mais clara e segura.

## Fechamento
Se você fala em público, você merece treinar com dados. [OLHAR PARA A PLATEIA] Obrigado.`,
    settings: defaultSettings(),
    createdAt: now,
    updatedAt: now,
    lastUsedAt: null,
    sessionsCount: 0,
  });
}
