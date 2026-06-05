
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE((auth.jwt() ->> 'email') = ANY (ARRAY['s.cristianwork@gmail.com']), false);
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

DROP VIEW IF EXISTS public.bookings_public;

GRANT SELECT (studio, date, start_time, end_time, status) ON public.bookings TO anon;

CREATE POLICY anon_read_conflict ON public.bookings
  FOR SELECT TO anon
  USING (status = 'confirmed');
