
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio text NOT NULL CHECK (studio IN ('piccolo','ssg')),
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  total numeric NOT NULL DEFAULT 0,
  addons text[] NOT NULL DEFAULT '{}',
  email text,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled','pending')),
  videomaker boolean NOT NULL DEFAULT false,
  videomaker_days int NOT NULL DEFAULT 0,
  vfx_ai_seconds int NOT NULL DEFAULT 0,
  deposit_paid boolean NOT NULL DEFAULT false,
  final_paid boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bookings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
-- Allow anon to insert (public booking form)
GRANT INSERT ON public.bookings TO anon;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_confirmed" ON public.bookings FOR SELECT TO anon USING (status = 'confirmed');
CREATE POLICY "anon_insert" ON public.bookings FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "admin_select_all" ON public.bookings FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_insert" ON public.bookings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "admin_update" ON public.bookings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_delete" ON public.bookings FOR DELETE TO authenticated USING (true);

CREATE TABLE public.studio_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio text NOT NULL CHECK (studio IN ('piccolo','ssg')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.studio_blocks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.studio_blocks TO authenticated;
GRANT ALL ON public.studio_blocks TO service_role;
ALTER TABLE public.studio_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read" ON public.studio_blocks FOR SELECT TO anon USING (true);
CREATE POLICY "admin_read" ON public.studio_blocks FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_insert" ON public.studio_blocks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "admin_delete" ON public.studio_blocks FOR DELETE TO authenticated USING (true);
