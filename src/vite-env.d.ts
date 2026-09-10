/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Legacy persona lock — no longer used by the Bellatrix shell, kept for old builds. */
  readonly VITE_PERSONA?: 'employee' | 'manager' | 'executive'
  /** Supabase project URL (https://xxxx.supabase.co). When absent the app runs on the on-device adapter. */
  readonly VITE_SUPABASE_URL?: string
  /** Supabase anon (public) key — never the service role key. */
  readonly VITE_SUPABASE_ANON_KEY?: string
}
