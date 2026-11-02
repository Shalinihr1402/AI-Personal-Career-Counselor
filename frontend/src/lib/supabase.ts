import { createClient } from '@supabase/supabase-js';

const supabaseUrl: string =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://gkgwinmbmxdohlygvjge.supabase.co';

const supabaseAnonKey: string =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_zJabNtDEHzEHXPLYT2wEvg_W9E8Jqit';

/**
 * True when both env vars are present. When false, the app still renders but
 * auth calls will fail fast with a clear message instead of crashing at import.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    '[auth] Supabase is not configured. Create frontend/.env with ' +
      'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see frontend/.env.example).',
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
