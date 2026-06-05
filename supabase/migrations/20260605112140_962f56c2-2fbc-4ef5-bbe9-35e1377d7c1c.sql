ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_studio_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_studio_check CHECK (studio = ANY (ARRAY['piccolo'::text,'ssg'::text,'videomaker'::text]));
ALTER TABLE public.studio_blocks DROP CONSTRAINT IF EXISTS studio_blocks_studio_check;
ALTER TABLE public.studio_blocks ADD CONSTRAINT studio_blocks_studio_check CHECK (studio = ANY (ARRAY['piccolo'::text,'ssg'::text,'videomaker'::text]));