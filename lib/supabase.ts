import { createClient, SupabaseClient } from "@supabase/supabase-js";

const env = typeof process !== "undefined" ? process.env : {};

const supabaseUrl =
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  import.meta.env.VITE_SUPABASE_URL?.trim() ||
  import.meta.env.SUPABASE_URL?.trim() ||
  env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  env.VITE_SUPABASE_URL?.trim() ||
  env.SUPABASE_URL?.trim();
const supabaseAnonKey =
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ||
  import.meta.env.SUPABASE_ANON_KEY?.trim() ||
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  env.VITE_SUPABASE_ANON_KEY?.trim() ||
  env.SUPABASE_ANON_KEY?.trim();

export const isSupabaseEnabled = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseEnabled) {
  console.warn(
    "Supabase is disabled because environment variables are missing."
  );
}

export const supabase: SupabaseClient | null = isSupabaseEnabled
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  : null;
