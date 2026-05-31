'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (authError) { setError(authError.message); setLoading(false); return }

    router.push('/mein-bereich')
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 mb-8 block">
          ← Zurück zur Startseite
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Einloggen</h1>
        <p className="text-gray-500 mb-8">Willkommen zurück bei Festly</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
            <input
              type="email" required value={form.email} onChange={set('email')}
              placeholder="name@beispiel.de"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Passwort</label>
            <input
              type="password" required value={form.password} onChange={set('password')}
              placeholder="Dein Passwort"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full bg-gray-900 text-white rounded-xl py-3 font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Wird angemeldet …' : 'Einloggen'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Noch kein Konto?{' '}
          <Link href="/register" className="text-gray-900 font-medium underline">Registrieren</Link>
        </p>
      </div>
    </main>
  )
}
