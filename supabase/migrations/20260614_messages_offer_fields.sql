-- Angebot-Felder für die messages-Tabelle
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS message_type    text NOT NULL DEFAULT 'text'
    CHECK (message_type IN ('text', 'offer')),
  ADD COLUMN IF NOT EXISTS offer_data      jsonb,
  ADD COLUMN IF NOT EXISTS offer_booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL;

-- UPDATE-Policy: Buchungsbeteiligte dürfen Nachrichten aktualisieren (für Angebots-Status)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'messages' AND policyname = 'messages_update'
  ) THEN
    CREATE POLICY "messages_update" ON messages
      FOR UPDATE USING (
        booking_id IN (
          SELECT id FROM bookings
          WHERE customer_id = auth.uid()
             OR provider_id = auth.uid()
        )
      )
      WITH CHECK (
        booking_id IN (
          SELECT id FROM bookings
          WHERE customer_id = auth.uid()
             OR provider_id = auth.uid()
        )
      );
  END IF;
END $$;
