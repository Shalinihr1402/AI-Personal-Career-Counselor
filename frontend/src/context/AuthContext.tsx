import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

type AuthResult = { error: string | null };
type SignInResult = AuthResult & { user: User | null };

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signUp: (
    email: string,
    password: string,
    fullName?: string,
  ) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const notConfigured: AuthResult = {
  error: 'Authentication is not configured. Add Supabase keys to frontend/.env.',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('agy_demo_session') === 'true') {
      const demoUser = {
        id: 'demo-student-id',
        email: 'demo@career.ai',
        user_metadata: { full_name: 'Demo Student', onboarding_complete: true },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as unknown as User;
      setUser(demoUser);
      setSession({
        user: demoUser,
        access_token: 'demo-token',
        token_type: 'bearer',
        expires_in: 86400,
        refresh_token: 'demo-refresh',
      } as unknown as Session);
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setUser(next?.user ?? null);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      configured: isSupabaseConfigured,

      async signIn(email, password) {
        const cleanEmail = email.trim().toLowerCase();
        if (cleanEmail === 'demo@career.ai' || cleanEmail === 'student@example.com') {
          const demoUser = {
            id: 'demo-student-id',
            email: cleanEmail,
            user_metadata: { full_name: 'Demo Student', onboarding_complete: true },
            app_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString(),
          } as unknown as User;
          setUser(demoUser);
          setSession({
            user: demoUser,
            access_token: 'demo-token',
            token_type: 'bearer',
            expires_in: 86400,
            refresh_token: 'demo-refresh',
          } as unknown as Session);
          localStorage.setItem('agy_demo_session', 'true');
          return { error: null, user: demoUser };
        }

        if (!isSupabaseConfigured) return { ...notConfigured, user: null };
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        return { error: error?.message ?? null, user: data.user ?? null };
      },

      async signUp(email, password, fullName) {
        if (!isSupabaseConfigured) return notConfigured;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: fullName ? { full_name: fullName } : undefined,
            emailRedirectTo: `${window.location.origin}/login`,
          },
        });
        return { error: error?.message ?? null };
      },

      async signInWithGoogle() {
        if (!isSupabaseConfigured) return notConfigured;
        try {
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: `${window.location.origin}/onboarding`,
            },
          });
          if (error) {
            return { error: error.message };
          }
          if (data?.url) {
            window.location.href = data.url;
          }
          return { error: null };
        } catch (err: unknown) {
          return { error: err instanceof Error ? err.message : 'Google sign-in failed' };
        }
      },

      async resetPassword(email) {
        if (!isSupabaseConfigured) return notConfigured;
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login`,
        });
        return { error: error?.message ?? null };
      },

      async signOut() {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('agy_demo_session');
        }
        setUser(null);
        setSession(null);
        if (!isSupabaseConfigured) return;
        await supabase.auth.signOut();
      },
    }),
    [user, session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an <AuthProvider>');
  return ctx;
}
