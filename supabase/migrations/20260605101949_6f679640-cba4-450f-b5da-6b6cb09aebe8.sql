ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS stripe_session_id text;
CREATE INDEX IF NOT EXISTS bookings_stripe_session_id_idx ON public.bookings(stripe_session_id);