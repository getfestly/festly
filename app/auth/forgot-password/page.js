'use client'
import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    setLoading(false)
    if (authError) { setError(authError.message); return }
    setSent(true)
  }

  if (sent) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📬</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">E-Mail gesendet</h1>
          <p className="text-gray-500 mb-6">
            Wir haben dir einen Link zum Zurücksetzen deines Passworts geschickt. Schau in dein Postfach.
          </p>
          <Link href="/login" className="text-sm text-gray-900 font-medium underline">
            Zurück zum Login
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <Link href="/login" className="text-sm text-gray-400 hover:text-gray-600 mb-8 block">
          ← Zurück zum Login
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Passwort vergessen</h1>
        <p className="text-gray-500 mb-8">Gib deine E-Mail-Adresse ein und wir schicken dir einen Reset-Link.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">E-Mail</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="name@beispiel.de"
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
            {loading ? 'Wird gesendet …' : 'Reset-Link senden'}
          </button>
        </form>
      </div>
    </main>
  )
}
