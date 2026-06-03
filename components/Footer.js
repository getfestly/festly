import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-wrap gap-x-6 gap-y-3 items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold gradient-text">Festly</span>
          <span className="text-sm text-gray-500">© 2026 Festly</span>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-1">
          <Link href="/impressum"   className="text-sm text-gray-400 hover:text-white transition-colors">Impressum</Link>
          <Link href="/datenschutz" className="text-sm text-gray-400 hover:text-white transition-colors">Datenschutz</Link>
          <Link href="/agb"         className="text-sm text-gray-400 hover:text-white transition-colors">AGB</Link>
          <Link href="/widerruf"    className="text-sm text-gray-400 hover:text-white transition-colors">Widerruf</Link>
        </nav>
      </div>
    </footer>
  )
}
