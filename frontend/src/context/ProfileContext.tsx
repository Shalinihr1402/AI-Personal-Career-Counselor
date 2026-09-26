import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import {
  isMissingTable,
  legacyProfileFromMetadata,
  loadLatestAssessment,
  loadProfile,
  saveAssessment as saveAssessmentRow,
  saveProfile as saveProfileRow,
  type Profile,
  type SavedAssessment,
} from '../lib/profile';

interface ProfileContextValue {
  profile: Profile | null;
  assessment: SavedAssessment | null;
  loading: boolean;
  /** Set when the Supabase tables haven't been created yet. */
  setupNeeded: boolean;
  saveProfile: (patch: Partial<Profile>) => Promise<Profile>;
  saveAssessment: (a: Parameters<typeof saveAssessmentRow>[1]) => Promise<SavedAssessment>;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, configured } = useAuth();
  const userId = user?.id;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [assessment, setAssessment] = useState<SavedAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupNeeded, setSetupNeeded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!configured || !user) {
      setProfile(null);
      setAssessment(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    (async () => {
      try {
        let p = await loadProfile(user.id);
        if (!p) {
          const legacy = legacyProfileFromMetadata(user);
          if (legacy) p = await saveProfileRow(user.id, legacy);
        }
        const a = await loadLatestAssessment(user.id);
        if (cancelled) return;
        setProfile(p);
        setAssessment(a);
        setSetupNeeded(false);
      } catch (err) {
        if (cancelled) return;
        if (isMissingTable(err as { code?: string })) {
          setSetupNeeded(true);
          // Keep the app usable with whatever was saved before the database existed.
          const legacy = legacyProfileFromMetadata(user);
          setProfile(legacy ? ({ onboardingComplete: false, ...legacy } as Profile) : null);
        }
        // eslint-disable-next-line no-console
        console.warn('[profile] could not load profile:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Reload only when the signed-in user changes, not on token refreshes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured, userId]);

  const saveProfile = useCallback(
    async (patch: Partial<Profile>) => {
      if (!userId) throw new Error('Not signed in.');
      const saved = await saveProfileRow(userId, patch);
      setProfile(saved);
      if ('onboardingComplete' in patch) {
        // Login reads this flag before the profile loads, to pick the landing page.
        await supabase.auth.updateUser({ data: { onboarding_complete: saved.onboardingComplete } });
      }
      return saved;
    },
    [userId],
  );

  const saveAssessment = useCallback(
    async (a: Parameters<typeof saveAssessmentRow>[1]) => {
      if (!userId) throw new Error('Not signed in.');
      const saved = await saveAssessmentRow(userId, a);
      setAssessment(saved);
      return saved;
    },
    [userId],
  );

  const value = useMemo<ProfileContextValue>(
    () => ({ profile, assessment, loading, setupNeeded, saveProfile, saveAssessment }),
    [profile, assessment, loading, setupNeeded, saveProfile, saveAssessment],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within a <ProfileProvider>');
  return ctx;
}
