'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ADMIN_USER_ID } from '@/lib/admin'

export default function Nav() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [hasListings, setHasListings] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setUser(user)
        const [profileRes, pendingRes, listingsRes] = await Promise.all([
          supabase.from('profiles').select('display_name, role').eq('id', user.id).single(),
          supabase.from('bookings')
            .select('id', { count: 'exact', head: true })
            .eq('customer_id', user.id)
            .in('status', ['pending', 'accepted']),
          supabase.from('listings')
            .select('id', { count: 'exact', head: true })
            .eq('provider_id', user.id),
        ])
        setProfile(profileRes.data)
        setPendingCount(pendingRes.count ?? 0)
        setHasListings((listingsRes.count ?? 0) > 0)
      }
      setAuthChecked(true)
    })
  }, [])

  useEffect(() => {
    function onOutsideClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutsideClick)
    return () => document.removeEventListener('mousedown', onOutsideClick)
  }, [])

  async function handleLogout() {
    setOpen(false)
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isAdmin = user?.id === ADMIN_USER_ID
  const showListings = hasListings || profile?.role === 'provider'
  const hasPending = pendingCount > 0
  const initial = profile?.display_name?.[0]?.toUpperCase() ?? '?'

  const navLink = (href, label, active) => (
    <Link
      href={href}
      className={`text-sm px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
        active
          ? 'bg-purple-50 font-medium gradient-text'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-2">

        {/* Logo */}
        <Link href="/" className="shrink-0 flex items-center gap-2 mr-2">
          <Image src="/logo.png" alt="Festly" width={150} height={40} className="h-10 w-auto" />
          <span className="text-xl font-bold gradient-text leading-none">Festly</span>
        </Link>

        {/* Navigationslinks */}
        <div className="flex items-center gap-0.5">
          {navLink('/so-funktionierts', "So funktioniert's", pathname === '/so-funktionierts')}
          {navLink('/marktplatz', 'Marktplatz', pathname.startsWith('/marktplatz'))}
        </div>

        {/* Auth-Bereich */}
        <div className="flex items-center gap-2 ml-auto">
          {authChecked && !profile && (
            <>
              {navLink('/login', 'Anmelden', false)}
              <Link href="/register" className="text-sm px-4 py-1.5 btn-primary whitespace-nowrap">
                Registrieren
              </Link>
            </>
          )}

          {profile && (
            <div ref={dropdownRef} className="relative">
              {/* Avatar-Button */}
              <button
                onClick={() => setOpen((o) => !o)}
                aria-label="Konto-Menü öffnen"
                className="relative w-9 h-9 rounded-full btn-primary flex items-center justify-center text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2"
              >
                {initial}
                {hasPending && (
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                )}
              </button>

              {/* Dropdown */}
              {open && (
                <div className="absolute right-0 top-11 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">

                  {/* Nutzerdaten (nicht klickbar) */}
                  <div className="px-4 py-3">
                    <p className="text-sm font-semibold text-gray-900 truncate">{profile.display_name}</p>
                    <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                  </div>
                  <div className="border-t border-gray-100 mx-2 mb-1" />

                  {/* Menüpunkte */}
                  <Link
                    href="/mein-bereich"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded-xl mx-1"
                  >
                    <span>👤</span> Mein Bereich
                  </Link>

                  <Link
                    href="/mein-bereich/anfragen"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded-xl mx-1"
                  >
                    <span>📋</span>
                    <span>Meine Anfragen</span>
                    {hasPending && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-red-500 shrink-0" />
                    )}
                  </Link>

                  {showListings && (
                    <Link
                      href="/anbieter/listings"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded-xl mx-1"
                    >
                      <span>🏷️</span> Meine Angebote
                    </Link>
                  )}

                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded-xl mx-1"
                    >
                      <span>⚙️</span> Admin
                    </Link>
                  )}

                  <div className="border-t border-gray-100 mx-2 my-1" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded-xl mx-1 text-left"
                  >
                    <span>🚪</span> Abmelden
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </nav>
  )
}
