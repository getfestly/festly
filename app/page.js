import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex-1 bg-white flex flex-col items-center justify-center px-4 py-16">
      <div className="text-center max-w-lg">
        <h1 className="text-6xl font-bold text-gray-900 mb-3">Festly</h1>
        <p className="text-xl text-gray-500 mb-10">
          Der Marktplatz für Event-Dienstleistungen
        </p>

        <div className="flex gap-3 justify-center mb-10">
          <Link
            href="/register"
            className="bg-gray-900 text-white rounded-xl px-6 py-3 font-medium hover:bg-gray-700 transition-colors"
          >
            Registrieren
          </Link>
          <Link
            href="/login"
            className="border border-gray-200 text-gray-700 rounded-xl px-6 py-3 font-medium hover:bg-gray-50 transition-colors"
          >
            Einloggen
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
          <div className="bg-gray-50 rounded-xl px-4 py-3">
            <p className="font-medium text-gray-600 mb-1">Provision</p>
            15 % automatisch
          </div>
          <div className="bg-gray-50 rounded-xl px-4 py-3">
            <p className="font-medium text-gray-600 mb-1">Treuhand</p>
            Stripe Escrow
          </div>
          <div className="bg-gray-50 rounded-xl px-4 py-3">
            <p className="font-medium text-gray-600 mb-1">Datenbank</p>
            Supabase + RLS
          </div>
          <div className="bg-gray-50 rounded-xl px-4 py-3">
            <p className="font-medium text-gray-600 mb-1">Storno</p>
            Gestaffelt nach Vorlauf
          </div>
        </div>
      </div>
    </main>
  )
}
