import { createAdminClient } from '@/lib/supabase-admin'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function POST(request) {
  try {
    const { event_name, properties, session_id } = await request.json()
    if (!event_name) return Response.json({ ok: false }, { status: 400 })

    const supabaseServer = await createSupabaseServer()
    const { data: { user } } = await supabaseServer.auth.getUser()

    const admin = createAdminClient()
    await admin.from('events').insert({
      event_name,
      user_id:    user?.id ?? null,
      session_id: session_id ?? null,
      properties: properties ?? {},
    })

    return Response.json({ ok: true })
  } catch {
    return Response.json({ ok: true }) // Fehler still ignorieren — kein UX-Impact
  }
}
