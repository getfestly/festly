import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  // Performance monitoring — 10 % Sample Rate auf kostenlosem Plan ausreichend
  tracesSampleRate: 0.1,
  // Session Replay nur bei tatsächlichen Fehlern aufzeichnen
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0,
  integrations: [
    Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
  ],
  // Im Entwicklungsmodus deaktivieren, um DSN-Warnungen zu vermeiden
  enabled: process.env.NODE_ENV === 'production',
})
