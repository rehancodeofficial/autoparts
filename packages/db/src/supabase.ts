import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Server-side Supabase client (used by Express / Vercel API functions)
let supabaseAdmin: SupabaseClient | null = null;
let supabaseAnon: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (supabaseAdmin) return supabaseAdmin;

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    return supabaseAdmin;
  }

  return null;
}

export function getSupabaseAnon(): SupabaseClient | null {
  if (supabaseAnon) return supabaseAnon;

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && anonKey) {
    supabaseAnon = createClient(supabaseUrl, anonKey, {
      auth: {
        persistSession: false,
      },
    });
    return supabaseAnon;
  }

  return null;
}
