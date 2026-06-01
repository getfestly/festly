import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-wrap gap-x-6 gap-y-3 items-center justify-between">
        <span className="text-sm text-gray-400">© 2026 Festly</span>
        <nav className="flex flex-wrap gap-x-6 gap-y-1">
          <Link href="/impressum"  className="text-sm text-gray-500 hover:text-gray-800 transition-colors">Impressum</Link>
          <Link href="/datenschutz" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">Datenschutz</Link>
          <Link href="/agb"        className="text-sm text-gray-500 hover:text-gray-800 transition-colors">AGB</Link>
          <Link href="/widerruf"   className="text-sm text-gray-500 hover:text-gray-800 transition-colors">Widerruf</Link>
        </nav>
      </div>
    </footer>
  )
}
