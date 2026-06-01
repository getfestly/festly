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
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      supabase.from('profiles').select('role, display_name').eq('id', user.id).single()
        .then(({ data }) => {
          setProfile(data)
          if (data?.role === 'provider') {
            supabase
              .from('bookings')
              .select('id', { count: 'exact', head: true })
              .eq('provider_id', user.id)
              .eq('status', 'pending')
              .then(({ count }) => setPendingCount(count ?? 0))
          }
        })
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navLink = (href, label) => {
    const active = href === '/mein-bereich'
      ? pathname === '/mein-bereich'
      : pathname.startsWith(href)
    return (
      <Link
        key={href}
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
  }

  const anfragenActive = pathname.startsWith('/mein-bereich/anfragen')

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-2">
        <Link
          href={userId ? '/mein-bereich' : '/'}
          className="font-bold text-gray-900 text-base mr-3 shrink-0"
        >
          Festly
        </Link>

        {profile && (
          <>
            <div className="flex items-center gap-1 overflow-x-auto flex-1 min-w-0">
              {navLink('/marktplatz', 'Marktplatz')}

              {/* Anfragen-Link mit Badge */}
              <Link
                href="/mein-bereich/anfragen"
                className={`relative text-sm px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  anfragenActive
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                Anfragen
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </Link>

              {profile.role === 'provider' && navLink('/anbieter/listings', 'Meine Angebote')}
              {userId === ADMIN_USER_ID && navLink('/admin', 'Admin')}
            </div>
            <div className="flex items-center gap-1 shrink-0 border-l border-gray-100 pl-3 ml-1">
              {navLink('/mein-bereich', 'Konto')}
              <button
                onClick={handleLogout}
                className="text-sm px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                Abmelden
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  )
}
