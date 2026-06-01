'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ADMIN_USER_ID } from '@/lib/admin'

export default function Nav() {
  const router = useRouter()
  const pathname = usePathname()
  const [profile, setProfile] = useState(null)
  const [userId, setUserId] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        supabase.from('profiles').select('role').eq('id', user.id).single()
          .then(({ data }) => setProfile(data))
      }
      setAuthChecked(true)
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const kontoActive  = pathname.startsWith('/mein-bereich')
  const adminActive  = pathname.startsWith('/admin')
  const isAdmin      = userId === ADMIN_USER_ID

  const navBtn = (href, label, active) => (
    <Link
      href={href}
      className={`text-sm px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
        active
          ? 'bg-gray-100 text-gray-900 font-medium'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center">
        <Link href="/marktplatz" className="font-bold text-gray-900 text-base shrink-0">
          Festly
        </Link>

        <div className="flex items-center gap-1 ml-auto">
          {/* Nicht eingeloggt */}
          {authChecked && !profile && (
            <>
              {navBtn('/login', 'Anmelden', false)}
              <Link
                href="/register"
                className="text-sm px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition-colors whitespace-nowrap"
              >
                Registrieren
              </Link>
            </>
          )}

          {/* Eingeloggt */}
          {profile && (
            <>
              {isAdmin && navBtn('/admin', 'Admin', adminActive)}
              {navBtn('/mein-bereich', 'Konto', kontoActive)}
              <button
                onClick={handleLogout}
                className="text-sm px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                Abmelden
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
