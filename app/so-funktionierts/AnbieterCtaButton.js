'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function AnbieterCtaButton() {
  const [href, setHref] = useState('/register')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return // bleibt /register

      const { count } = await supabase
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('provider_id', user.id)

      setHref(count > 0 ? '/anbieter/listings' : '/anbieter/listings/neu')
    })
  }, [])

  return (
    <Link
      href={href}
      className="px-8 py-3 rounded-full text-sm font-semibold border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-white transition-all"
    >
      Als Anbieter starten
    </Link>
  )
}
