'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // PASSWORD_RECOVERY wird gefeuert bei implizitem Flow (#access_token Fragment)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })

    // PKCE-Flow: ?code= Parameter in der URL → Session tauschen
    const code = new URLSearchParams(window.location.search).get('code')
    if (code) {
      supabase.auth.exchangeCodeForSession(code)
        .then(() => setReady(true))
        .catch((e) => {
          console.error('[reset-password] exchangeCodeForSession fehlgeschlagen:', e)
        })
    }

    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) { setError('Die Passwörter stimmen nicht überein.'); return }
    setLoading(true)

    const { error: authError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (authError) { setError(authError.message); return }
    router.push('/login?reset=success')
  }

  if (!ready) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <p className="text-gray-500 mb-4">Link wird überprüft …</p>
          <p className="text-sm text-gray-400">
            Falls du nicht weitergeleitet wirst,{' '}
            <Link href="/auth/forgot-password" className="underline text-gray-700">
              fordere einen neuen Link an
            </Link>.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Neues Passwort</h1>
        <p className="text-gray-500 mb-8">Wähle ein neues Passwort für dein Konto.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Neues Passwort</label>
            <input
              type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Mindestens 6 Zeichen"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Passwort bestätigen</label>
            <input
              type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)}
              placeholder="Passwort wiederholen"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full bg-gray-900 text-white rounded-xl py-3 font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Wird gespeichert …' : 'Passwort speichern'}
          </button>
        </form>
      </div>
    </main>
  )
}
