import Anthropic from '@anthropic-ai/sdk'
import { createSupabaseServer } from '@/lib/supabase-server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Nicht autorisiert.' }, { status: 401 })

  try {
    const { keywords, category } = await request.json()
    if (!keywords?.trim()) {
      return Response.json({ error: 'Keine Stichworte angegeben.' }, { status: 400 })
    }

    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system:
        'Du bist Assistent für Festly, einen deutschen Event-Marktplatz für Schausteller und ' +
        'Veranstaltungsdienstleister. Schreibe eine professionelle, einladende Listing-Beschreibung ' +
        'auf Deutsch. Maximal 120 Wörter. Kein Markdown, keine Aufzählungen, nur Fließtext.',
      messages: [
        {
          role: 'user',
          content: `Stichworte: ${keywords.trim()}\nKategorie: ${category ?? 'Sonstiges'}`,
        },
      ],
    })

    const text = msg.content[0]?.text ?? ''
    return Response.json({ text })
  } catch (err) {
    console.error('AI describe error:', err)
    return Response.json({ error: 'KI-Anfrage fehlgeschlagen.' }, { status: 500 })
  }
}
