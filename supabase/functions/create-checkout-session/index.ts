import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@17';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;

const ALLOWED_STUDIOS = new Set(['piccolo', 'ssg']);
const ALLOWED_ADDONS = new Set(['producer', 'fonico']);

const bad = (status: number, message: string) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

async function sha256(input: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return bad(405, 'Method not allowed');

  const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeSecret) {
    return bad(
      500,
      'Stripe non è configurato. Aggiungi STRIPE_SECRET_KEY nelle impostazioni del backend.',
    );
  }

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

  // Conflict check (against confirmed only)
  const { data: conflicts, error: confErr } = await supabase
    .from('bookings')
    .select('start_time,end_time')
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

  // Insert booking as pending
  const { data: booking, error: insErr } = await supabase
    .from('bookings')
    .insert({
      studio,
      date,
      start_time,
      end_time,
      total,
      addons,
      email: email || null,
      status: 'pending',
      videomaker,
      videomaker_days,
      vfx_ai_seconds,
      ip_hash,
    })
    .select('id')
    .single();
  if (insErr || !booking) return bad(500, 'Insert failed');

  // 50% deposit
  const depositCents = Math.round(total * 100 * 0.5);

  const stripe = new Stripe(stripeSecret, { apiVersion: '2024-12-18.acacia' });

  const origin = req.headers.get('origin') || 'https://bright-blossom-starter.lovable.app';

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email || undefined,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: depositCents,
            product_data: {
              name: `Acconto 50% - Studio ${studio === 'piccolo' ? 'Piccolo' : 'SSG'}`,
              description: `${date} ${start_time}-${end_time}`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/booking/cancelled?session_id={CHECKOUT_SESSION_ID}`,
      metadata: { booking_id: booking.id },
    });
  } catch (err: any) {
    await supabase.from('bookings').delete().eq('id', booking.id);
    return bad(500, `Stripe error: ${err?.message ?? 'unknown'}`);
  }

  await supabase
    .from('bookings')
    .update({ stripe_session_id: session.id })
    .eq('id', booking.id);

  return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
