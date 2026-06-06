'use client'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { trackEvent, identifyUser } from '@/lib/analytics'

function LoginForm() {
  const searchParams = useSearchParams()
  const resetSuccess = searchParams.get('reset') === 'success'
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })

      if (authError) {
        const msg = authError.message ?? ''
        if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
          setError('E-Mail oder Passwort falsch.')
        } else if (msg.includes('Too many requests') || msg.includes('over_request_rate_limit')) {
          setError('Zu viele Versuche. Bitte warte kurz.')
        } else if (msg.includes('Email not confirmed')) {
          window.location.href = '/auth/verify-email'
        } else {
          setError('Anmeldung fehlgeschlagen. Bitte versuche es erneut.')
        }
        return
      }

      trackEvent('user_logged_in', {})
      identifyUser(data.user.id, { email: data.user.email })
      window.location.href = '/mein-bereich'
    } catch (err) {
      setError('Anmeldung fehlgeschlagen. Bitte versuche es erneut.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 mb-8 block">
          ← Zurück zur Startseite
        </Link>
        <div className="flex justify-center mb-6">
          <Image src="/logo.png" alt="Festly" width={160} height={64} className="h-16 w-auto" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Einloggen</h1>
        <p className="text-gray-500 mb-8">Willkommen zurück bei Festly</p>

        {resetSuccess && (
          <p className="text-green-700 text-sm bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
            Passwort erfolgreich geändert. Du kannst dich jetzt einloggen.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">E-Mail</label>
            <input
              type="email" required value={form.email} onChange={set('email')}
              autoComplete="email"
              placeholder="name@beispiel.de"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-700">Passwort</label>
              <Link href="/auth/forgot-password" className="text-xs text-gray-500 hover:text-gray-700">
                Passwort vergessen?
              </Link>
            </div>
            <input
              type="password" required value={form.password} onChange={set('password')}
              autoComplete="current-password"
              placeholder="Dein Passwort"
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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
