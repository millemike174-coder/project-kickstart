import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@17';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const bad = (status: number, message: string) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return bad(405, 'Method not allowed');

  const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeSecret) {
    return bad(500, 'Stripe non è configurato. Aggiungi STRIPE_SECRET_KEY nei segreti del backend.');
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return bad(400, 'Invalid JSON');
  }

  const { booking_id, payment_type } = body ?? {};
  if (typeof booking_id !== 'string' || booking_id.length < 8) return bad(400, 'Invalid booking_id');
  if (payment_type !== 'deposit' && payment_type !== 'balance') return bad(400, 'Invalid payment_type');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: booking, error: bErr } = await supabase
    .from('bookings')
    .select('id, studio, date, start_time, end_time, total, email, deposit_paid, final_paid, videomaker, videomaker_days, vfx_ai_seconds')
    .eq('id', booking_id)
    .maybeSingle();

  if (bErr || !booking) return bad(404, 'Booking not found');

  if (payment_type === 'deposit' && booking.deposit_paid) return bad(409, 'Deposit already paid');
  if (payment_type === 'balance') {
    if (!booking.videomaker) return bad(400, 'Balance only applies to videomaker bookings');
    if (!booking.deposit_paid) return bad(409, 'Deposit not paid yet');
    if (booking.final_paid) return bad(409, 'Balance already paid');
  }

  // Compute amount to charge.
  let amountCents: number;
  let label: string;
  if (booking.videomaker) {
    // Videomaker: 50% of videomaker subtotal (deposit or balance).
    const days = Number(booking.videomaker_days) || 0;
    const vfxSec = Number(booking.vfx_ai_seconds) || 0;
    if (days <= 0) return bad(400, 'Invalid videomaker days');
    const vmTotal = 800 + Math.max(0, days - 1) * 400 + (vfxSec > 0 ? 200 : 0);
    amountCents = Math.round(vmTotal * 100 * 0.5);
    label = `Trenches Records — ${payment_type === 'deposit' ? 'Acconto' : 'Saldo'} Videomaker`;
  } else {
    // Studio: 100% upfront. Balance payment_type not applicable.
    if (payment_type !== 'deposit') return bad(400, 'Studio bookings are paid in full upfront');
    amountCents = Math.round(Number(booking.total) * 100);
    label = `Trenches Records — Prenotazione studio`;
  }
  if (amountCents < 50) return bad(400, 'Amount too small');


  const stripe = new Stripe(stripeSecret, { apiVersion: '2024-12-18.acacia' });
  const origin = req.headers.get('origin') || 'https://bright-blossom-starter.lovable.app';

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: booking.email || undefined,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: amountCents,
            product_data: {
              name: label,
              description: `${booking.date} ${String(booking.start_time).slice(0, 5)}-${String(booking.end_time).slice(0, 5)}`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/booking-success?booking_id=${booking.id}`,
      cancel_url: `${origin}/booking-cancelled?booking_id=${booking.id}`,
      metadata: { booking_id: booking.id, payment_type },
    });
  } catch (err: any) {
    return bad(500, `Stripe error: ${err?.message ?? 'unknown'}`);
  }

  await supabase
    .from('bookings')
    .update({ stripe_session_id: session.id })
    .eq('id', booking.id);

  return new Response(JSON.stringify({ checkout_url: session.url, url: session.url, session_id: session.id }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
