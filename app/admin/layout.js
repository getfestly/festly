import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase-server'
import { ADMIN_USER_ID } from '@/lib/admin'

export const metadata = { title: 'Admin — Festly' }

export default async function AdminLayout({ children }) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.id !== ADMIN_USER_ID) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <span className="font-semibold text-sm tracking-widest text-gray-200">ADMIN</span>
          <nav className="flex gap-1">
            {[
              ['/admin',           'Dashboard'],
              ['/admin/nutzer',    'Nutzer'],
              ['/admin/listings',  'Listings'],
              ['/admin/buchungen', 'Buchungen'],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg px-3 py-1.5 transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <Link href="/mein-bereich" className="text-xs text-gray-400 hover:text-white transition-colors">
          ← Mein Bereich
        </Link>
      </header>

      <main className="px-6 py-8 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  )
}
