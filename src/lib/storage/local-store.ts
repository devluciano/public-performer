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
import {
  obterDadosIniciais,
  salvarRoteiroDb,
  excluirRoteiroDb,
  salvarSessaoDb,
  excluirSessaoDb,
  salvarPerfilDb,
} from "@/lib/services/db-api";

const KEYS = {
  scripts: "oratoria.scripts.v1",
  sessions: "oratoria.sessions.v1",
  profile: "oratoria.profile.v1",
  user: "oratoria.user.v1",
} as const;

export type UsuarioLogado = { id: string; nome: string; email: string };

type State = { 
  scripts: Script[]; 
  sessions: TrainingSession[]; 
  profile: Profile;
  user: UsuarioLogado | null;
  initialized: boolean;
};

const emptyState = (): State => ({
  scripts: [],
  sessions: [],
  profile: profileSchema.parse({ defaults: defaultSettings() }),
  user: null,
  initialized: false,
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

// Sincronização inteligente com o banco de dados MySQL
function persist(oldState: State, newState: State) {
  if (typeof window === "undefined") return;

  // Persistência local (fallback de segurança rápido)
  try {
    window.localStorage.setItem(KEYS.scripts, JSON.stringify(newState.scripts));
    window.localStorage.setItem(KEYS.sessions, JSON.stringify(newState.sessions));
    window.localStorage.setItem(KEYS.profile, JSON.stringify(newState.profile));
    if (newState.user) {
      window.localStorage.setItem(KEYS.user, JSON.stringify(newState.user));
    } else {
      window.localStorage.removeItem(KEYS.user);
    }
  } catch {
    /* quota limit */
  }

  // Se não estiver logado, não tenta sincronizar com o banco MySQL
  if (!newState.user) return;
  const usuarioId = newState.user.id;

  // Sincronização assíncrona com o MySQL
  // 1. Verificar Roteiros adicionados/atualizados
  newState.scripts.forEach((script) => {
    const oldScript = oldState.scripts.find((s) => s.id === script.id);
    if (!oldScript || JSON.stringify(oldScript) !== JSON.stringify(script)) {
      salvarRoteiroDb({ data: { script, usuarioId } }).catch((e) => console.error("Falha ao salvar roteiro no MySQL:", e));
    }
  });

  // 2. Verificar Roteiros excluídos
  oldState.scripts.forEach((script) => {
    if (!newState.scripts.some((s) => s.id === script.id)) {
      excluirRoteiroDb({ data: script.id }).catch((e) => console.error("Falha ao excluir roteiro no MySQL:", e));
    }
  });

  // 3. Verificar Sessões de treino adicionadas/atualizadas
  newState.sessions.forEach((session) => {
    const oldSession = oldState.sessions.find((s) => s.id === session.id);
    if (!oldSession || JSON.stringify(oldSession) !== JSON.stringify(session)) {
      salvarSessaoDb({ data: { session, usuarioId } }).catch((e) => console.error("Falha ao salvar sessão no MySQL:", e));
    }
  });

  // 4. Verificar Sessões excluídas
  oldState.sessions.forEach((session) => {
    if (!newState.sessions.some((s) => s.id === session.id)) {
      excluirSessaoDb({ data: session.id }).catch((e) => console.error("Falha ao excluir sessão no MySQL:", e));
    }
  });

  // 5. Verificar Perfil
  if (JSON.stringify(oldState.profile) !== JSON.stringify(newState.profile)) {
    salvarPerfilDb({ data: { perfil: newState.profile, usuarioId } }).catch((e) => console.error("Falha ao salvar perfil no MySQL:", e));
  }
}

function emit() {
  listeners.forEach((l) => l());
}

export function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;

  // Carregar do localStorage primeiro para carregamento instantâneo
  const base = emptyState();
  state = {
    scripts: read(KEYS.scripts, z.array(scriptSchema), base.scripts),
    sessions: read(KEYS.sessions, z.array(sessionSchema), base.sessions),
    profile: read(KEYS.profile, profileSchema, base.profile),
    user: read(KEYS.user, z.any(), base.user),
    initialized: true,
  };

  // Se não houver dados e for o primeiro acesso antes do login, criamos o seed local básico
  if (state.scripts.length === 0 && !state.user) {
    state.scripts = [seedScript()];
    try {
      window.localStorage.setItem(KEYS.scripts, JSON.stringify(state.scripts));
    } catch {}
  }
  emit();

  // Buscar dados reais atualizados do MySQL caso tenhamos usuário logado
  if (state.user) {
    obterDadosIniciais({ data: { usuarioId: state.user.id } })
      .then((dados) => {
        state = {
          scripts: dados.scripts,
          sessions: dados.sessions,
          profile: dados.perfil,
          user: state.user, // Mantém usuário logado
          initialized: true,
        };
        emit();
      })
      .catch((err) => {
        console.warn("MySQL inacessível. Continuando no modo LocalStorage offline:", err);
      });
  }
}

export const store = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => state,
  set(updater: (s: State) => State) {
    const oldState = state;
    state = updater(state);
    persist(oldState, state);
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
