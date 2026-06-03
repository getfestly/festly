import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { ADMIN_USER_ID } from '@/lib/admin'

const COMING_SOON_HTML = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Festly – Demnächst verfügbar</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      background: #ffffff;
      color: #171717;
      min-height: 100svh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      text-align: center;
    }
    .logo {
      font-size: 2.5rem;
      font-weight: 700;
      letter-spacing: -0.04em;
      color: #171717;
      margin-bottom: 2rem;
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 500;
      color: #374151;
      margin-bottom: 1.25rem;
      line-height: 1.4;
    }
    a {
      color: #171717;
      text-decoration: underline;
      text-underline-offset: 3px;
      font-size: 0.95rem;
    }
    footer {
      position: fixed;
      bottom: 1.5rem;
      display: flex;
      gap: 1.5rem;
      font-size: 0.8rem;
    }
    footer a { color: #6b7280; text-decoration: none; }
    footer a:hover { color: #171717; }
  </style>
</head>
<body>
  <div class="logo">festly</div>
  <h1>Wir sind bald für euch da.</h1>
  <a href="mailto:hallo@festly.de">hallo@festly.de</a>
  <footer>
    <a href="/impressum">Impressum</a>
    <a href="/datenschutz">Datenschutz</a>
  </footer>
</body>
</html>`

export async function proxy(request) {
  if (process.env.COMING_SOON === 'true') {
    const { pathname } = new URL(request.url)
    if (pathname !== '/impressum' && pathname !== '/datenschutz') {
      return new NextResponse(COMING_SOON_HTML, {
        headers: { 'content-type': 'text/html; charset=utf-8' },
      })
    }
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value, options)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresht abgelaufene Sessions und schreibt neue Tokens in die Response-Cookies.
  // Ohne diesen Aufruf sieht createSupabaseServer() in Server Components keine Session.
  const { data: { user } } = await supabase.auth.getUser()

  // Admin-Schutz: serverseitig, bevor die Seite gerendert wird
  const { pathname } = new URL(request.url)
  if (pathname.startsWith('/admin')) {
    if (!user || user.id !== ADMIN_USER_ID) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('error', 'unauthorized')
      return NextResponse.redirect(loginUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
