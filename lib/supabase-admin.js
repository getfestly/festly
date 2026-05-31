import { createClient } from '@supabase/supabase-js'

// Server-side only — nie in Client Components importieren.
// Benötigt SUPABASE_SERVICE_ROLE_KEY in .env.local (siehe FORTSCHRITT.md).
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY fehlt in .env.local — siehe FORTSCHRITT.md')
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
