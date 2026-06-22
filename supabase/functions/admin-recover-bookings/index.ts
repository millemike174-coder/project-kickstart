import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@17';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const whsec = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';
  const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
  const info = {
    webhook_secret_prefix: whsec.slice(0, 6),
    webhook_secret_length: whsec.length,
    stripe_key_prefix: stripeSecret.slice(0, 8),
  };
  console.log('SECRET INFO', info);

  const stripe = new Stripe(stripeSecret, { apiVersion: '2024-12-18.acacia' });
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: pendings } = await supabase
    .from('bookings')
    .select('id, stripe_session_id, email, videomaker, studio, date, start_time, end_time')
    .like('stripe_session_id', 'cs_live_%')
    .eq('status', 'pending');

  const results: any[] = [];
  for (const b of pendings ?? []) {
    try {
      const s = await stripe.checkout.sessions.retrieve(b.stripe_session_id!);
      const entry: any = {
        booking_id: b.id,
        email: b.email ?? s.customer_details?.email ?? null,
        studio: b.studio,
        date: b.date,
        payment_status: s.payment_status,
        status: s.status,
        action: 'none',
      };

      if (s.payment_status === 'paid') {
        const now = new Date().toISOString();
        const update: any = {
          deposit_paid: true,
          deposit_paid_at: now,
          status: 'confirmed',
        };
        if (!b.videomaker) {
          update.final_paid = true;
          update.final_paid_at = now;
        }
        if (!b.email && s.customer_details?.email) {
          update.email = s.customer_details.email;
        }
        await supabase.from('bookings').update(update).eq('id', b.id);
        entry.action = 'recovered_confirmed';
      } else if (s.status === 'expired') {
        await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', b.id);
        entry.action = 'cancelled_expired';
      }
      results.push(entry);
    } catch (err: any) {
      results.push({ booking_id: b.id, error: err.message });
    }
  }

  return new Response(JSON.stringify({ info, results }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
