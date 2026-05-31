'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const ROLE_LABEL = { provider: 'Anbieter', customer: 'Kunde' }

export default function MeinBereichPage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [email, setEmail] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      setEmail(user.email)
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
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Laden …</p>
      </main>
    )
  }

  const initial = profile?.display_name?.[0]?.toUpperCase() ?? '?'

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-sm w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">
            {initial}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{profile?.display_name ?? '–'}</h1>
          <p className="text-gray-500 mt-1">{ROLE_LABEL[profile?.role] ?? profile?.role}</p>
          <p className="text-gray-400 text-sm mt-1">{email}</p>
        </div>

        <div className="space-y-2 mb-6">
          {profile?.role === 'provider' && (
            <Link
              href="/anbieter/listings"
              className="flex items-center justify-between w-full border border-gray-200 rounded-xl px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">Meine Angebote</span>
              <span className="text-gray-400">→</span>
            </Link>
          )}
          <Link
            href="/mein-bereich/anfragen"
            className="flex items-center justify-between w-full border border-gray-200 rounded-xl px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-medium text-gray-700">
              {profile?.role === 'provider' ? 'Eingegangene Anfragen' : 'Meine Anfragen'}
            </span>
            <span className="text-gray-400">→</span>
          </Link>
          <Link
            href="/marktplatz"
            className="flex items-center justify-between w-full border border-gray-200 rounded-xl px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-medium text-gray-700">Marktplatz</span>
            <span className="text-gray-400">→</span>
          </Link>
        </div>

        <button
          onClick={handleLogout}
          className="w-full border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Ausloggen
        </button>
      </div>
    </main>
  )
}
