ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS event_street      text,
  ADD COLUMN IF NOT EXISTS event_house_number text,
  ADD COLUMN IF NOT EXISTS event_zip         text,
  ADD COLUMN IF NOT EXISTS event_city        text;
