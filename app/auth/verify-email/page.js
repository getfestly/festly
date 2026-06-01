'use client'
import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function VerifyEmailPage() {
  const [resent, setResent] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleResend() {
    setError(null)
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) { setError('Kein Nutzer gefunden. Bitte neu einloggen.'); setLoading(false); return }

    const { error: authError } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
    })

    setLoading(false)
    if (authError) { setError(authError.message); return }
    setResent(true)
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✉️</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">E-Mail bestätigen</h1>
        <p className="text-gray-500 mb-6">
          Bitte bestätige deine E-Mail-Adresse. Schau in dein Postfach und klicke auf den Bestätigungslink.
        </p>

        {resent && (
          <p className="text-green-700 text-sm bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
            E-Mail erneut gesendet. Bitte überprüfe dein Postfach.
          </p>
        )}

        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">{error}</p>
        )}

        <button
          onClick={handleResend} disabled={loading || resent}
          className="w-full bg-gray-900 text-white rounded-xl py-3 font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors mb-4"
        >
          {loading ? 'Wird gesendet …' : resent ? 'E-Mail gesendet' : 'E-Mail erneut senden'}
        </button>

        <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700">
          Zurück zum Login
        </Link>
      </div>
    </main>
  )
}
