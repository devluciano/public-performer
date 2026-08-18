import { useCallback, useMemo, useSyncExternalStore } from "react";
import { hydrate, newId, store } from "./local-store";
import { obterDadosIniciais } from "@/lib/services/db-api";
import { recordings } from "./recordings";
import {
  profileSchema,
  scriptSchema,
  type Profile,
  type Script,
  type SessionMetrics,
  type TeleprompterSettings,
  type TrainingLevel,
  type TrainingSession,
  type FeedbackItem,
} from "@/lib/domain/types";
import { evaluateAchievements, pointsForSession } from "@/lib/services/gamification";

const serverSnapshot = store.get();

export function useAppState() {
  const state = useSyncExternalStore(
    (l) => {
      hydrate();
      return store.subscribe(l);
    },
    store.get,
    () => serverSnapshot,
  );

  const scripts = useMemo(
    () => [...state.scripts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [state.scripts],
  );
  const sessions = useMemo(
    () => [...state.sessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
    [state.sessions],
  );

  return { scripts, sessions, profile: state.profile, user: state.user, initialized: state.initialized };
}

export function useScript(id: string | undefined): Script | undefined {
  const { scripts } = useAppState();
  return scripts.find((s) => s.id === id);
}

export function useActions() {
  const createScript = useCallback((partial?: Partial<Script>) => {
    const now = new Date().toISOString();
    const script = scriptSchema.parse({
      id: newId(),
      title: partial?.title ?? "Novo roteiro",
      description: partial?.description ?? "",
      category: partial?.category ?? "Apresentação",
      content: partial?.content ?? "",
      settings: partial?.settings ?? store.get().profile.defaults,
      createdAt: now,
      updatedAt: now,
      lastUsedAt: null,
      sessionsCount: 0,
    });
    store.set((s) => ({ ...s, scripts: [script, ...s.scripts] }));
    return script;
  }, []);

  const updateScript = useCallback((id: string, patch: Partial<Script>) => {
    store.set((s) => ({
      ...s,
      scripts: s.scripts.map((sc) =>
        sc.id === id ? { ...sc, ...patch, updatedAt: new Date().toISOString() } : sc,
      ),
    }));
  }, []);

  const updateSettings = useCallback((id: string, patch: Partial<TeleprompterSettings>) => {
    store.set((s) => ({
      ...s,
      scripts: s.scripts.map((sc) => (sc.id === id ? { ...sc, settings: { ...sc.settings, ...patch } } : sc)),
    }));
  }, []);

  const duplicateScript = useCallback((id: string) => {
    const original = store.get().scripts.find((s) => s.id === id);
    if (!original) return undefined;
    const now = new Date().toISOString();
    const copy: Script = {
      ...original,
      id: newId(),
      title: `${original.title} (cópia)`,
      createdAt: now,
      updatedAt: now,
      lastUsedAt: null,
      sessionsCount: 0,
    };
    store.set((s) => ({ ...s, scripts: [copy, ...s.scripts] }));
    return copy;
  }, []);

  const deleteScript = useCallback((id: string) => {
    store.set((s) => ({ ...s, scripts: s.scripts.filter((sc) => sc.id !== id) }));
  }, []);

  const saveSession = useCallback(
    async (input: {
      scriptId: string;
      scriptTitle: string;
      level: TrainingLevel;
      startedAt: string;
      metrics: SessionMetrics;
      feedback: FeedbackItem[];
      recording?: { blob: Blob; kind: "audio" | "video" } | null;
    }) => {
      let recordingId: string | null = null;
      if (input.recording) {
        recordingId = newId();
        try {
          await recordings.save(recordingId, input.recording.blob);
        } catch {
          recordingId = null;
        }
      }
      const session: TrainingSession = {
        id: newId(),
        scriptId: input.scriptId,
        scriptTitle: input.scriptTitle,
        level: input.level,
        startedAt: input.startedAt,
        metrics: input.metrics,
        feedback: input.feedback,
        notes: "",
        recordingId,
        recordingKind: input.recording?.kind ?? null,
      };
      store.set((s) => {
        const sessions = [session, ...s.sessions];
        const profile: Profile = {
          ...s.profile,
          points: s.profile.points + pointsForSession(session.metrics.score),
          achievements: evaluateAchievements(sessions, s.profile),
        };
        return {
          ...s,
          sessions,
          profile,
          scripts: s.scripts.map((sc) =>
            sc.id === input.scriptId
              ? { ...sc, lastUsedAt: session.startedAt, sessionsCount: sc.sessionsCount + 1 }
              : sc,
          ),
        };
      });
      return session;
    },
    [],
  );

  const updateSession = useCallback((id: string, patch: Partial<TrainingSession>) => {
    store.set((s) => ({ ...s, sessions: s.sessions.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  }, []);

  const deleteSession = useCallback((id: string) => {
    const session = store.get().sessions.find((x) => x.id === id);
    if (session?.recordingId) void recordings.remove(session.recordingId);
    store.set((s) => ({ ...s, sessions: s.sessions.filter((x) => x.id !== id) }));
  }, []);

  const deleteRecording = useCallback((sessionId: string) => {
    const session = store.get().sessions.find((x) => x.id === sessionId);
    if (session?.recordingId) void recordings.remove(session.recordingId);
    store.set((s) => ({
      ...s,
      sessions: s.sessions.map((x) => (x.id === sessionId ? { ...x, recordingId: null, recordingKind: null } : x)),
    }));
  }, []);

  const updateProfile = useCallback((patch: Partial<Profile>) => {
    store.set((s) => ({ ...s, profile: profileSchema.parse({ ...s.profile, ...patch }) }));
  }, []);

  const login = useCallback((user: any) => {
    store.set((s) => ({ ...s, user }));
    if (typeof window !== "undefined") {
      obterDadosIniciais({ data: { usuarioId: user.id } }).then((dados) => {
        store.set((s) => ({
          ...s,
          scripts: dados.scripts,
          sessions: dados.sessions,
          profile: dados.perfil,
        }));
      });
    }
  }, []);

  const logout = useCallback(() => {
    store.set((s) => ({
      ...s,
      user: null,
      scripts: [],
      sessions: [],
    }));
  }, []);

  return {
    createScript,
    updateScript,
    updateSettings,
    duplicateScript,
    deleteScript,
    saveSession,
    updateSession,
    deleteSession,
    deleteRecording,
    updateProfile,
    login,
    logout,
  };
}
