import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Per-user roadmap progress, persisted to localStorage.
 * Kept client-side for now; move to Supabase when the backend roadmap
 * engine exists so progress syncs across devices.
 */
export interface ProgressState {
  done: Set<string>;
  skipped: Set<string>;
  hoursOverride: number | null;
  startISO: string;
  toggleTask: (id: string) => void;
  toggleSkill: (id: string) => void;
  setHours: (n: number | null) => void;
  reset: () => void;
}

interface StoredShape {
  done: string[];
  skipped: string[];
  hoursOverride: number | null;
  startISO: string;
}

function keyFor(userId: string | undefined): string {
  return `ccp:${userId || 'anon'}`;
}

function read(userId: string | undefined): StoredShape {
  const fallback: StoredShape = {
    done: [],
    skipped: [],
    hoursOverride: null,
    startISO: new Date().toISOString(),
  };
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<StoredShape>;
    return {
      done: parsed.done ?? [],
      skipped: parsed.skipped ?? [],
      hoursOverride: parsed.hoursOverride ?? null,
      startISO: parsed.startISO ?? fallback.startISO,
    };
  } catch {
    return fallback;
  }
}

function write(userId: string | undefined, value: StoredShape): void {
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify(value));
  } catch {
    /* storage unavailable — progress just won't persist this session */
  }
}

export function useProgress(userId: string | undefined): ProgressState {
  const [state, setState] = useState<StoredShape>(() => read(userId));

  // Re-read and persist a start date when the user changes (e.g. after login).
  useEffect(() => {
    const fresh = read(userId);
    setState(fresh);
    write(userId, fresh);
  }, [userId]);

  const update = useCallback(
    (patch: Partial<StoredShape>) => {
      setState((prev) => {
        const next = { ...prev, ...patch };
        write(userId, next);
        return next;
      });
    },
    [userId],
  );

  const toggleTask = useCallback(
    (id: string) => {
      setState((prev) => {
        const done = prev.done.includes(id)
          ? prev.done.filter((x) => x !== id)
          : [...prev.done, id];
        const next = { ...prev, done };
        write(userId, next);
        return next;
      });
    },
    [userId],
  );

  const toggleSkill = useCallback(
    (id: string) => {
      setState((prev) => {
        const skipped = prev.skipped.includes(id)
          ? prev.skipped.filter((x) => x !== id)
          : [...prev.skipped, id];
        const next = { ...prev, skipped };
        write(userId, next);
        return next;
      });
    },
    [userId],
  );

  const setHours = useCallback((n: number | null) => update({ hoursOverride: n }), [update]);

  const reset = useCallback(() => {
    const fresh: StoredShape = {
      done: [],
      skipped: [],
      hoursOverride: null,
      startISO: new Date().toISOString(),
    };
    setState(fresh);
    write(userId, fresh);
  }, [userId]);

  const done = useMemo(() => new Set(state.done), [state.done]);
  const skipped = useMemo(() => new Set(state.skipped), [state.skipped]);

  return {
    done,
    skipped,
    hoursOverride: state.hoursOverride,
    startISO: state.startISO,
    toggleTask,
    toggleSkill,
    setHours,
    reset,
  };
}
