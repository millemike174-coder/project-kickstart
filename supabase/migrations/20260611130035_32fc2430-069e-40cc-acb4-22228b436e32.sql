ALTER TABLE public.bookings ALTER COLUMN status SET DEFAULT 'pending';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bookings_status_check'
      AND conrelid = 'public.bookings'::regclass
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_status_check
      CHECK (status IN ('pending', 'confirmed', 'cancelled', 'expired'));
  END IF;
END $$;