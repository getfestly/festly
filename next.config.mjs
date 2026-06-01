import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {}

export default withSentryConfig(nextConfig, {
  org: 'festly',
  project: 'festly-nextjs',
  // SENTRY_AUTH_TOKEN in Vercel hinterlegen für Source-Map-Uploads
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Kein Build-Fehler wenn Auth Token fehlt
  silent: true,
  // Source Maps nicht im Production-Bundle ausliefern
  hideSourceMaps: true,
  // Tunnel-Route, um Ad-Blocker zu umgehen
  tunnelRoute: '/monitoring',
})
