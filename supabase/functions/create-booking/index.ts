import { createClient } from 'npm:@supabase/supabase-js@2';

const ALLOWED_ORIGINS = new Set([
  'https://trenchesrecords.net',
  'https://www.trenchesrecords.net',
  'https://trenchesrecord.lovable.app',
  'https://trenchesrecords.lovable.app',
  'https://bright-blossom-starter.lovable.app',
  'https://id-preview--70726a02-3309-4ee8-aa14-0c070edfb535.lovable.app',
  'http://localhost:5173',
  'http://localhost:3000',
]);
function buildCors(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allow = ALLOWED_ORIGINS.has(origin) || /\.lovable\.app$/.test(new URL(origin || 'http://x').hostname || '');
  return {
    'Access-Control-Allow-Origin': allow ? origin : '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  } as Record<string, string>;
}
// Back-compat alias used throughout the file. Replaced per-request in handler.
let corsHeaders: Record<string, string> = {
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

// 'videomaker' is treated as its own resource with an independent calendar.
const ALLOWED_STUDIOS = new Set(['piccolo', 'ssg', 'videomaker']);
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
  const duration = e - s;
  if (duration < 120) return bad(400, 'Minimum 2 hours');
  const hours = duration / 60;

  // Resource-specific rules.
  const isVideomakerResource = studio === 'videomaker';
  if (isVideomakerResource) {
    if (!videomaker) return bad(400, 'Videomaker resource requires videomaker=true');
    if (duration > 600) return bad(400, 'Maximum 10 hours for videomaker');
    if (videomaker_days < 1) return bad(400, 'Invalid videomaker days');
  } else {
    // Studio bookings never carry videomaker billing — strip it server-side.
    if (videomaker) return bad(400, 'Studio bookings cannot include videomaker');
  }

  // Authoritative server-side price calculation. The client-supplied total is
  // ignored to prevent price manipulation.
  const STUDIO_RATES: Record<string, number> = { piccolo: 35, ssg: 60 };
  const ADDON_RATES: Record<string, number> = { producer: 20, fonico: 25 };
  let total = 0;
  if (isVideomakerResource) {
    const days = videomaker_days;
    total = 800 + Math.max(0, days - 1) * 400 + (vfx_ai_seconds > 0 ? 200 : 0);
  } else {
    const rate = STUDIO_RATES[studio] ?? 0;
    total = rate * hours;
    for (const a of addons) {
      total += (ADDON_RATES[a] ?? 0) * hours;
    }
  }
  total = Math.round(total * 100) / 100;
  if (total <= 0 || total > 100000) return bad(400, 'Invalid computed total');


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
    .in('status', ['confirmed', 'pending']);
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
      addons: isVideomakerResource ? [] : addons,
      email: email || null,
      // All bookings start as pending. Stripe webhook flips them to confirmed
      // once payment succeeds (100% for studios, 50% deposit for videomaker).
      status: 'pending',
      videomaker: isVideomakerResource,
      videomaker_days: isVideomakerResource ? videomaker_days : 0,
      vfx_ai_seconds: isVideomakerResource ? vfx_ai_seconds : 0,
      ip_hash,
    })
    .select('id')
    .single();

  if (insErr || !inserted) return bad(500, 'Insert failed');

  return new Response(JSON.stringify({ ok: true, booking_id: inserted.id, total }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
