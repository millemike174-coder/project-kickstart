
-- 1. is_admin() helper
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT (auth.jwt() ->> 'email') = ANY (ARRAY['s.cristianwork@gmail.com']);
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

-- 2. Add ip_hash column for rate limiting
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS ip_hash text;
CREATE INDEX IF NOT EXISTS bookings_ip_hash_created_at_idx
  ON public.bookings (ip_hash, created_at);

-- 3. Drop existing policies on bookings
DROP POLICY IF EXISTS anon_read_confirmed ON public.bookings;
DROP POLICY IF EXISTS anon_insert ON public.bookings;
DROP POLICY IF EXISTS admin_select_all ON public.bookings;
DROP POLICY IF EXISTS admin_update ON public.bookings;
DROP POLICY IF EXISTS admin_delete ON public.bookings;
DROP POLICY IF EXISTS admin_insert ON public.bookings;

-- 4. Revoke direct anon access; only service_role + admins via policies
REVOKE ALL ON public.bookings FROM anon;
REVOKE INSERT ON public.bookings FROM anon;
GRANT SELECT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;

-- 5. Admin-only policies on bookings
CREATE POLICY admin_full_select ON public.bookings
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY admin_full_update ON public.bookings
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY admin_full_delete ON public.bookings
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- 6. Public view exposing only conflict-check columns
DROP VIEW IF EXISTS public.bookings_public;
CREATE VIEW public.bookings_public
WITH (security_invoker = false) AS
SELECT studio, date, start_time, end_time, status
FROM public.bookings
WHERE status = 'confirmed';

GRANT SELECT ON public.bookings_public TO anon, authenticated;

-- 7. studio_blocks policies
DROP POLICY IF EXISTS anon_read ON public.studio_blocks;
DROP POLICY IF EXISTS admin_read ON public.studio_blocks;
DROP POLICY IF EXISTS admin_insert ON public.studio_blocks;
DROP POLICY IF EXISTS admin_update ON public.studio_blocks;
DROP POLICY IF EXISTS admin_delete ON public.studio_blocks;

GRANT SELECT ON public.studio_blocks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.studio_blocks TO authenticated;
GRANT ALL ON public.studio_blocks TO service_role;

CREATE POLICY public_read_blocks ON public.studio_blocks
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY admin_blocks_insert ON public.studio_blocks
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY admin_blocks_update ON public.studio_blocks
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY admin_blocks_delete ON public.studio_blocks
  FOR DELETE TO authenticated
  USING (public.is_admin());
