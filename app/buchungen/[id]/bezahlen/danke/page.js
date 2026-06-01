'use client'
import { Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/Nav'

// useSearchParams benötigt Suspense-Grenze
function DankeContent() {
  const { id: bookingId } = useParams()
  const searchParams = useSearchParams()
  const status = searchParams.get('redirect_status')

  const success = status === 'succeeded'

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="max-w-md mx-auto px-4 py-16 text-center">
        {success ? (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl">
              ✓
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Zahlung erfolgreich</h1>
            <p className="text-gray-500 mb-8">
              Deine Zahlung wurde empfangen. Der Anbieter wird nach dem Event
              bezahlt — du wirst benachrichtigt, wenn die Buchung abgeschlossen ist.
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl">
              !
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Zahlung fehlgeschlagen</h1>
            <p className="text-gray-500 mb-8">
              Die Zahlung konnte nicht abgeschlossen werden. Bitte versuche es erneut.
            </p>
            <Link
              href={`/buchungen/${bookingId}/bezahlen`}
              className="bg-gray-900 text-white rounded-xl px-6 py-3 font-medium hover:bg-gray-700 transition-colors"
            >
              Erneut versuchen
            </Link>
          </>
        )}

        <Link href="/mein-bereich/anfragen" className="block text-sm text-gray-400 hover:text-gray-600 mt-6">
          Zu meinen Buchungsanfragen
        </Link>
      </main>
    </div>
  )
}

export default function DankePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Laden …</p>
      </div>
    }>
      <DankeContent />
    </Suspense>
  )
}
