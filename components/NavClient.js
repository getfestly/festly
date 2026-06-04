'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ADMIN_USER_ID } from '@/lib/admin'

export default function NavClient({ initialUser = null, initialProfile = null, initialPendingCount = 0 }) {
  const router   = useRouter()
  const pathname = usePathname()

  // Initial state kommt vom Server — kein Flicker beim ersten Render
  const [user, setUser]                 = useState(initialUser)
  const [profile, setProfile]           = useState(initialProfile)
  const [pendingCount, setPendingCount] = useState(initialPendingCount)
  const [open, setOpen]                 = useState(false)
  const dropdownRef                     = useRef(null)

  // Nur auf Auth-Änderungen reagieren (Login/Logout innerhalb der SPA)
  // INITIAL_SESSION überspringen — server hat bereits korrekten Zustand geliefert
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'INITIAL_SESSION') return

        const newUser = session?.user ?? null
        setUser(newUser)

        if (newUser) {
          const [profileRes, pendingRes] = await Promise.all([
            supabase.from('profiles').select('display_name, role').eq('id', newUser.id).single(),
            supabase.from('bookings')
              .select('id', { count: 'exact', head: true })
              .eq('customer_id', newUser.id)
              .in('status', ['pending', 'accepted']),
          ])
          setProfile(profileRes.data)
          setPendingCount(pendingRes.count ?? 0)
        } else {
          setProfile(null)
          setPendingCount(0)
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    function onOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  async function handleLogout() {
    setOpen(false)
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Admin-Bereich hat eigene Navigation — kein Root-Nav anzeigen
  if (pathname.startsWith('/admin')) return null

  const isAdmin    = user?.id === ADMIN_USER_ID
  const hasPending = pendingCount > 0
  const initial    = profile?.display_name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? '?'

  const menuLink = (href, label, extra) => (
    <Link
      href={href}
      onClick={() => setOpen(false)}
      className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
    >
      {label}
      {extra}
    </Link>
  )

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center">

        {/* ── Links: Logo + Marktplatz ───────────────────────────── */}
        <div className="flex-1 flex items-center gap-5">
          <Link href="/" className="shrink-0 flex items-center gap-2">
            <Image src="/logo.png" alt="Festly" width={150} height={40} className="h-9 w-auto" />
            <span className="text-xl font-bold gradient-text leading-none">Festly</span>
          </Link>
          <Link
            href="/marktplatz"
            className="hidden sm:block text-sm font-medium gradient-text hover:opacity-80 transition-opacity"
          >
            Marktplatz
          </Link>
        </div>

        {/* ── Mitte: So funktioniert's ───────────────────────────── */}
        <div className="hidden md:flex justify-center">
          <Link
            href="/so-funktionierts"
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
              pathname === '/so-funktionierts'
                ? 'font-medium gradient-text'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            So funktioniert&apos;s
          </Link>
        </div>

        {/* ── Rechts: Avatar / Login ─────────────────────────────── */}
        <div className="flex-1 flex items-center justify-end gap-2">
          {!profile && (
            <>
              <Link
                href="/login"
                className="text-sm px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:border-gray-400 transition-colors hidden sm:block"
              >
                Anmelden
              </Link>
              <Link href="/register" className="text-sm px-4 py-2 btn-primary whitespace-nowrap">
                Registrieren
              </Link>
            </>
          )}

          {profile && (
            <div ref={dropdownRef} className="relative">
              {/* Avatar */}
              <button
                onClick={() => setOpen((o) => !o)}
                aria-label="Konto-Menü"
                className="relative w-9 h-9 rounded-full btn-primary flex items-center justify-center text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2"
              >
                {initial}
                {hasPending && (
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                )}
              </button>

              {/* Dropdown */}
              {open && (
                <div className="absolute right-0 top-12 w-60 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900 truncate">{profile.display_name}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{user?.email}</p>
                  </div>

                  <div className="py-1">
                    {menuLink('/mein-bereich', 'Mein Bereich')}
                    {menuLink(
                      '/mein-bereich/anfragen',
                      'Anfragen & Buchungen',
                      hasPending && (
                        <span className="ml-2 min-w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center px-1.5 font-medium">
                          {pendingCount}
                        </span>
                      )
                    )}
                    {menuLink('/anbieter/listings', 'Meine Angebote')}
                    {menuLink('/anbieter/listings/neu', '+ Neues Angebot')}
                    {isAdmin && menuLink('/admin', 'Admin')}
                  </div>

                  <div className="border-t border-gray-100 py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      Abmelden
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </nav>
  )
}
