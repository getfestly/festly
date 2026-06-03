# Festly Launch Checklist

## Vercel Deployment
- [ ] Repository mit Vercel verbinden
- [ ] Build-Command: `next build`
- [ ] Root Directory: `/`

## Env-Variablen in Vercel setzen
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] STRIPE_SECRET_KEY (Live-Key)
- [ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (Live-Key)
- [ ] STRIPE_WEBHOOK_SECRET
- [ ] RESEND_API_KEY
- [ ] EMAIL_FROM (z.B. noreply@festly.de)
- [ ] CRON_SECRET (beliebiger langer zufälliger String)
- [ ] NEXT_PUBLIC_APP_URL (z.B. https://festly.de)

## Stripe
- [ ] Stripe Live-Modus aktivieren
- [ ] Webhook-Endpunkt in Stripe Dashboard eintragen: https://festly.de/api/stripe/webhook
- [ ] Webhook-Events aktivieren: payment_intent.succeeded, payment_intent.payment_failed, transfer.created

## Resend
- [ ] Domain festly.de in Resend verifizieren (DNS-Einträge setzen)
- [ ] EMAIL_FROM auf verifizierte Domain setzen

## Supabase
- [ ] Auth → E-Mail-Verifizierung wieder aktivieren (war fürs Testen deaktiviert)
- [ ] Auth → Site URL auf https://festly.de setzen
- [ ] Auth → Redirect URLs: https://festly.de/auth/reset-password

## Domain
- [ ] Domain auf Vercel zeigen lassen (DNS A/CNAME)
- [ ] SSL automatisch via Vercel

## Nach dem Deploy
- [ ] Testbuchung mit echtem Stripe durchführen
- [ ] Cron-Job in Vercel einrichten: GET /api/cron/auto-release täglich, Bearer = CRON_SECRET
