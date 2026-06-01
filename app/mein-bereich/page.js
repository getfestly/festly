'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ADMIN_USER_ID } from '@/lib/admin'
import Nav from '@/components/Nav'

const ROLE_LABEL = { provider: 'Anbieter', customer: 'Kunde' }

export default function MeinBereichPage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [email, setEmail] = useState(null)
  const [userId, setUserId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      setEmail(user.email)
      setUserId(user.id)
      const { data } = await supabase
        .from('profiles').select('display_name, role').eq('id', user.id).single()
      setProfile(data)
      setLoading(false)
    }
    load()
  }, [router])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Nav />
        <main className="flex items-center justify-center h-48">
          <p className="text-gray-400">Laden …</p>
        </main>
      </div>
    )
  }

  const initial = profile?.display_name?.[0]?.toUpperCase() ?? '?'

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Profil-Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gray-900 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">{profile?.display_name ?? '–'}</h1>
              <p className="text-gray-500 text-sm">{ROLE_LABEL[profile?.role] ?? profile?.role}</p>
              <p className="text-gray-400 text-sm truncate">{email}</p>
            </div>
          </div>
        </div>

        {/* Schnellzugriff */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <Link
            href="/mein-bereich/anfragen"
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <p className="font-semibold text-gray-900 mb-1">
              {profile?.role === 'provider' ? 'Eingegangene Anfragen' : 'Meine Anfragen'}
            </p>
            <p className="text-sm text-gray-500">Buchungsanfragen verwalten</p>
          </Link>

          <Link
            href="/marktplatz"
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <p className="font-semibold text-gray-900 mb-1">Marktplatz</p>
            <p className="text-sm text-gray-500">Event-Dienstleistungen entdecken</p>
          </Link>

          {profile?.role === 'provider' && (
            <Link
              href="/anbieter/listings"
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <p className="font-semibold text-gray-900 mb-1">Meine Angebote</p>
              <p className="text-sm text-gray-500">Angebote erstellen und verwalten</p>
            </Link>
          )}

          {userId === ADMIN_USER_ID && (
            <Link
              href="/admin"
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <p className="font-semibold text-gray-900 mb-1">Admin-Bereich</p>
              <p className="text-sm text-gray-500">Plattform verwalten</p>
            </Link>
          )}
        </div>

        <div className="pt-2">
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            Ausloggen
          </button>
        </div>
      </main>
    </div>
  )
}
