/**
 * Analytics — PostHog (visuelles Dashboard) + eigene events-Tabelle (Rohdaten).
 *
 * SQL-Migration in Supabase ausführen:
 * ─────────────────────────────────────────────────────────────────────────────
 * CREATE TABLE IF NOT EXISTS events (
 *   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   event_name text NOT NULL,
 *   user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
 *   session_id text,
 *   properties jsonb DEFAULT '{}',
 *   created_at timestamptz DEFAULT now()
 * );
 * CREATE INDEX IF NOT EXISTS events_event_name_idx ON events(event_name);
 * CREATE INDEX IF NOT EXISTS events_created_at_idx ON events(created_at);
 * CREATE INDEX IF NOT EXISTS events_user_id_idx ON events(user_id);
 * ALTER TABLE events ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "events_insert" ON events FOR INSERT WITH CHECK (true);
 * CREATE POLICY "events_select_admin" ON events FOR SELECT USING (false);
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * .env.local ergänzen:
 * NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
 * NEXT_PUBLIC_POSTHOG_HOST=https://eu.posthog.com
 *
 * DSGVO-Hinweise:
 * - EU-Server (eu.posthog.com) verwenden
 * - Kein Screen Recording (disabled)
 * - IP-Anonymisierung in PostHog-Settings aktivieren
 * - In Datenschutzerklärung erwähnen
 */

import posthog from 'posthog-js'

function getSessionId() {
  if (typeof window === 'undefined') return null
  try {
    let sid = sessionStorage.getItem('festly_sid')
    if (!sid) {
      sid = Math.random().toString(36).slice(2) + Date.now().toString(36)
      sessionStorage.setItem('festly_sid', sid)
    }
    return sid
  } catch {
    return null
  }
}

export function initPosthog() {
  if (typeof window === 'undefined') return
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return
  if (window.__posthog_initialized) return
  window.__posthog_initialized = true

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.posthog.com',
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
    session_recording: { enabled: false }, // Datenschutz: kein Screen Recording
  })
}

/**
 * Event in PostHog + eigener Supabase-Tabelle tracken (fire-and-forget).
 */
export function trackEvent(eventName, properties = {}) {
  if (typeof window === 'undefined') return

  // PostHog
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    try { posthog.capture(eventName, properties) } catch {}
  }

  // Eigene events-Tabelle
  fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_name: eventName,
      properties,
      session_id: getSessionId(),
    }),
  }).catch(() => {})
}

export function identifyUser(userId, traits = {}) {
  if (typeof window === 'undefined') return
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return
  try { posthog.identify(userId, traits) } catch {}
}
