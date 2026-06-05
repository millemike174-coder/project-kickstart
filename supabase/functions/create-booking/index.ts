import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function bad(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const ALLOWED_STUDIOS = new Set(['piccolo', 'ssg']);
const ALLOWED_ADDONS = new Set(['producer', 'fonico']);

const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return bad(405, 'Method not allowed');

  let body: any;
  try {
    body = await req.json();
  } catch {
    return bad(400, 'Invalid JSON');
  }

  const {
    studio,
    date,
    start_time,
    end_time,
    total,
    addons,
    email,
    videomaker,
    videomaker_days,
    vfx_ai_seconds,
  } = body ?? {};

  if (typeof studio !== 'string' || !ALLOWED_STUDIOS.has(studio)) return bad(400, 'Invalid studio');
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return bad(400, 'Invalid date');
  if (typeof start_time !== 'string' || !/^\d{2}:\d{2}(:\d{2})?$/.test(start_time))
    return bad(400, 'Invalid start_time');
  if (typeof end_time !== 'string' || !/^\d{2}:\d{2}(:\d{2})?$/.test(end_time))
    return bad(400, 'Invalid end_time');
  if (typeof total !== 'number' || total <= 0 || total > 100000) return bad(400, 'Invalid total');
  if (!Array.isArray(addons) || addons.some((a) => typeof a !== 'string' || !ALLOWED_ADDONS.has(a)))
    return bad(400, 'Invalid addons');
  if (email != null && (typeof email !== 'string' || email.length > 254)) return bad(400, 'Invalid email');
  if (typeof videomaker !== 'boolean') return bad(400, 'Invalid videomaker');
  if (typeof videomaker_days !== 'number' || videomaker_days < 0 || videomaker_days > 30)
    return bad(400, 'Invalid videomaker_days');
  if (typeof vfx_ai_seconds !== 'number' || vfx_ai_seconds < 0 || vfx_ai_seconds > 60)
    return bad(400, 'Invalid vfx_ai_seconds');

  const s = toMin(start_time);
  const e = toMin(end_time);
  if (e - s < 120) return bad(400, 'Minimum 2 hours');

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('cf-connecting-ip') ||
    'unknown';
  const ipSalt = Deno.env.get('SUPABASE_DB_URL') ?? 'rondo-salt';
  const ip_hash = await sha256(`${ipSalt}:${ip}`);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Rate limit
  const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
  const { count, error: countErr } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ip_hash)
    .gte('created_at', since);
  if (countErr) return bad(500, 'Rate check failed');
  if ((count ?? 0) >= RATE_LIMIT) return bad(429, 'Too many bookings, try again later');

  // Conflict check
  const { data: conflicts, error: confErr } = await supabase
    .from('bookings')
    .select('id,start_time,end_time')
    .eq('studio', studio)
    .eq('date', date)
    .eq('status', 'confirmed');
  if (confErr) return bad(500, 'Conflict check failed');
  const hasConflict = (conflicts ?? []).some((b: any) => {
    const bs = toMin(b.start_time);
    const be = toMin(b.end_time);
    return s < be && e > bs;
  });
  if (hasConflict) return bad(409, 'Slot already booked');

  // Block check
  const { data: blocks, error: blockErr } = await supabase
    .from('studio_blocks')
    .select('id')
    .eq('studio', studio)
    .lte('start_date', date)
    .gte('end_date', date);
  if (blockErr) return bad(500, 'Block check failed');
  if ((blocks ?? []).length > 0) return bad(409, 'Studio unavailable on this date');

  const { data: inserted, error: insErr } = await supabase
    .from('bookings')
    .insert({
      studio,
      date,
      start_time,
      end_time,
      total,
      addons,
      email: email || null,
      // Studio-only bookings don't require deposit → confirm immediately.
      // Videomaker bookings stay pending until Stripe deposit is paid.
      status: videomaker ? 'pending' : 'confirmed',
      videomaker,
      videomaker_days,
      vfx_ai_seconds,
      ip_hash,
    })
    .select('id')
    .single();

  if (insErr || !inserted) return bad(500, 'Insert failed');

  return new Response(JSON.stringify({ ok: true, booking_id: inserted.id }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
