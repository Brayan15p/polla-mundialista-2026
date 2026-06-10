// supabase.ts — Browser Supabase client (optional).
//
// Configured only with the browser-safe keys (Project URL + publishable/anon
// key). When these env vars are absent the app runs in local demo mode and
// never touches the network. Row Level Security (see supabase/schema.sql)
// is what makes the anon key safe to ship in the client bundle.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseEnabled = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = supabaseEnabled
  ? createClient(url!, anonKey!, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;
