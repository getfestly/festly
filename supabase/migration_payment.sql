-- ============================================================================
-- MIGRATION: Stripe Zahlungen (Etappe 4)
-- Ausführen in: Supabase Dashboard → SQL Editor
--
-- HINWEIS: stripe_payment_intent_id, stripe_transfer_id und status existieren
-- bereits im Initialschema (IF NOT EXISTS verhindert Fehler).
-- payments.status ist ein 'payment_status'-Enum (pending/held/released/refunded).
-- 'held' = Zahlung eingegangen und treuhänderisch gehalten.
-- ============================================================================

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS stripe_transfer_id        text;
-- status-Spalte existiert bereits als payment_status enum

-- RLS: Kunden dürfen Zahlungen für eigene angenommene Buchungen anlegen
-- (Alternativ: Festly-Backend nutzt Service Role Key — dann nicht nötig)
DO $$ BEGIN
  CREATE POLICY "Kunden legen Zahlung an"
    ON payments FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.id = payments.booking_id
          AND auth.uid() = b.customer_id
          AND b.status = 'accepted'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
