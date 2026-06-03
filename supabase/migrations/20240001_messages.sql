-- Diese Migration dokumentiert die bestehende messages-Tabelle.
-- Vor Ausführung prüfen ob Tabelle bereits existiert (CREATE TABLE IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS messages (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid        NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  sender_id  uuid        NOT NULL REFERENCES profiles(id),
  content    text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  is_read    boolean     NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS messages_booking_id_idx ON messages (booking_id);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx  ON messages (sender_id);

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Lesen: Sender selbst ODER Beteiligter der zugehörigen Buchung
CREATE POLICY "messages_select" ON messages
  FOR SELECT USING (
    sender_id = auth.uid()
    OR booking_id IN (
      SELECT id FROM bookings
      WHERE customer_id = auth.uid()
         OR provider_id = auth.uid()
    )
  );

-- Schreiben: nur als eigener Sender
CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());
