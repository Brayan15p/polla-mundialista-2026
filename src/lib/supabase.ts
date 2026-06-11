// supabase.ts — Browser Supabase client (optional).
//
// Configured only with the browser-safe keys (Project URL + publishable/anon
// key). When these env vars are absent the app runs in local demo mode and
// never touches the network. Row Level Security (see supabase/schema.sql)
// is what makes the anon key safe to ship in the client bundle.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Sanitize env values: trim whitespace/newlines and strip accidental quotes —
// a stray space or quote is the usual cause of "Failed to fetch".
const clean = (v?: string) => v?.trim().replace(/^['"]+|['"]+$/g, '');

const rawUrl = clean(import.meta.env.VITE_SUPABASE_URL as string | undefined);
// Drop any trailing slash so the REST/auth paths build correctly.
const url = rawUrl?.replace(/\/+$/, '');
const anonKey = clean(import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined);

const looksValid = Boolean(url && /^https:\/\/.+\.supabase\.co$/.test(url) && anonKey);

export const supabaseEnabled = Boolean(url && anonKey);

// Help diagnose a misconfigured URL early, in the browser console.
if (supabaseEnabled && !looksValid) {
  // eslint-disable-next-line no-console
  console.warn(
    '[Supabase] La URL no parece válida. Debe ser exactamente ' +
    'https://TU-PROYECTO.supabase.co (sin barra final, sin espacios). Recibido:',
    JSON.stringify(rawUrl),
  );
}

export const supabase: SupabaseClient | null = supabaseEnabled
  ? createClient(url!, anonKey!, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;
