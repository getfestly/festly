'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ADMIN_USER_ID } from '@/lib/admin'

export default function NavClient() {
  const router   = useRouter()
  const pathname = usePathname()

  const [user, setUser]                 = useState(null)
  const [profile, setProfile]           = useState(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [open, setOpen]                 = useState(false)
  const dropdownRef                     = useRef(null)

  useEffect(() => {
    // getSession() liest aus Cookie-Cache — kein Netzwerk-Request, kein Hänger
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        const [profileRes, pendingRes] = await Promise.all([
          supabase.from('profiles').select('display_name, role').eq('id', u.id).single(),
          supabase.from('bookings')
            .select('id', { count: 'exact', head: true })
            .eq('customer_id', u.id)
            .in('status', ['pending', 'accepted']),
        ])
        setProfile(profileRes.data ?? null)
        setPendingCount(pendingRes.count ?? 0)
      }
    })

    // Auth-Änderungen (Login/Logout innerhalb der SPA)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'INITIAL_SESSION') return // bereits durch getSession() behandelt
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

  if (pathname.startsWith('/admin')) return null

  const isAdmin    = user?.id === ADMIN_USER_ID
  const hasPending = pendingCount > 0
  const initial    = profile?.display_name?.[0]?.toUpperCase()
                  ?? user?.email?.[0]?.toUpperCase()
                  ?? '?'

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">

        {/* ── Logo ──────────────────────────────────────────────────────── */}
        <Link href="/" className="shrink-0 flex items-center gap-1.5 mr-2">
          <Image src="/logo.png" alt="Festly" width={120} height={36} className="h-8 w-auto" />
          <span className="text-lg font-bold gradient-text leading-none hidden sm:block">Festly</span>
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* ── Rechts: Auth ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/so-funktionierts"
            className="hidden md:block text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors whitespace-nowrap"
          >
            So funktioniert&apos;s
          </Link>

          {/* Nicht eingeloggt */}
          {!profile && (
            <Link
              href="/login"
              className="flex items-center gap-2 border border-gray-200 rounded-full px-3 py-1.5 hover:shadow-md transition-shadow text-sm text-gray-700 font-medium"
            >
              <span className="text-base">☰</span>
              <span className="hidden sm:block">Anmelden</span>
            </Link>
          )}

          {/* Eingeloggt */}
          {profile && (
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setOpen(o => !o)}
                aria-label="Konto-Menü"
                className="flex items-center gap-2 border border-gray-200 rounded-full pl-3 pr-1 py-1 hover:shadow-md transition-shadow"
              >
                <span className="text-gray-600 text-sm">☰</span>
                <div className="relative w-8 h-8 rounded-full btn-primary flex items-center justify-center text-white text-sm font-bold">
                  {initial}
                  {hasPending && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                  )}
                </div>
              </button>

              {open && (
                <div className="absolute right-0 top-12 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">

                  {/* Gruppe 1 */}
                  <div className="py-1">
                    <Link href="/mein-bereich/anfragen" onClick={() => setOpen(false)}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span>📋</span>
                        <span className="text-sm text-gray-800 font-medium">Meine Anfragen</span>
                      </div>
                      {hasPending && (
                        <span className="min-w-[20px] h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center px-1.5 font-semibold">
                          {pendingCount}
                        </span>
                      )}
                    </Link>
                    <Link href="/mein-bereich" onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                      <span>👤</span>
                      <span className="text-sm text-gray-800 font-medium">Profil</span>
                    </Link>
                  </div>

                  <div className="border-t border-gray-100" />

                  {/* Gruppe 2 */}
                  <div className="py-1">
                    <div className="flex items-center gap-3 px-4 py-3 text-gray-300 cursor-not-allowed select-none">
                      <span>🔔</span>
                      <span className="text-sm font-medium">Benachrichtigungen</span>
                    </div>
                    <Link href="/mein-bereich" onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                      <span>⚙️</span>
                      <span className="text-sm text-gray-800 font-medium">Kontoeinstellungen</span>
                    </Link>
                  </div>

                  <div className="border-t border-gray-100" />

                  {/* Gruppe 3: CTA */}
                  <Link href="/anbieter/listings/neu" onClick={() => setOpen(false)}
                    className="flex gap-3 items-start px-4 py-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                    <span className="text-2xl shrink-0 mt-0.5">🎪</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Anbieter werden</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        Erstelle dein erstes Angebot und verdiene auf Festly
                      </p>
                    </div>
                  </Link>

                  {isAdmin && (
                    <>
                      <div className="border-t border-gray-100" />
                      <Link href="/admin" onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                        <span>🛠️</span>
                        <span className="text-sm text-gray-800 font-medium">Admin</span>
                      </Link>
                    </>
                  )}

                  <div className="border-t border-gray-100" />

                  {/* Gruppe 4: Abmelden */}
                  <div className="py-1">
                    <button onClick={handleLogout}
                      className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left">
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
