'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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

  const kontoActive      = pathname.startsWith('/mein-bereich')
  const adminActive      = pathname.startsWith('/admin')
  const isAdmin          = userId === ADMIN_USER_ID
  const howItWorksActive = pathname === '/so-funktionierts'
  const marktplatzActive = pathname.startsWith('/marktplatz')

  const navLink = (href, label, active) => (
    <Link
      href={href}
      className={`text-sm px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
        active
          ? 'bg-gray-100 text-gray-900 font-medium'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-2">

        {/* Logo + Schriftzug */}
        <Link href="/" className="shrink-0 flex items-center gap-2 mr-2">
          <Image src="/logo.png" alt="Festly" width={150} height={40} className="h-10 w-auto" />
          <span className="text-xl font-bold gradient-text leading-none">Festly</span>
        </Link>

        {/* Navigationslinks */}
        <div className="flex items-center gap-0.5">
          {navLink('/so-funktionierts', "So funktioniert's", howItWorksActive)}
          {navLink('/marktplatz', 'Marktplatz', marktplatzActive)}
        </div>

        {/* Auth-Links */}
        <div className="flex items-center gap-1 ml-auto">
          {authChecked && !profile && (
            <>
              {navLink('/login', 'Anmelden', false)}
              <Link href="/register" className="text-sm px-4 py-1.5 btn-primary whitespace-nowrap">
                Registrieren
              </Link>
            </>
          )}
          {profile && (
            <>
              {isAdmin && navLink('/admin', 'Admin', adminActive)}
              {navLink('/mein-bereich', 'Konto', kontoActive)}
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
