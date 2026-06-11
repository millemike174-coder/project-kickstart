WITH deleted AS (
  DELETE FROM public.bookings
  WHERE date='2026-06-14'
    AND studio='piccolo'
    AND start_time='12:00:00'
    AND status='pending'
    AND deposit_paid=false
    AND stripe_session_id IS NULL
  RETURNING id
)
SELECT count(*) AS deleted_count FROM deleted;