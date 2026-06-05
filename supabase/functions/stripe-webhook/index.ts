import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@17';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!stripeSecret || !webhookSecret) {
    return new Response('Stripe not configured', { status: 500 });
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: '2024-12-18.acacia' });
  const signature = req.headers.get('stripe-signature');
  if (!signature) return new Response('Missing signature', { status: 400 });

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.booking_id;
    const paymentType = session.metadata?.payment_type;
    if (bookingId) {
      // Look up the booking to know if it's a studio (100%) or videomaker (50%) payment.
      const { data: bk } = await supabase
        .from('bookings')
        .select('videomaker')
        .eq('id', bookingId)
        .maybeSingle();
      const isVm = !!bk?.videomaker;

      if (paymentType === 'balance') {
        await supabase
          .from('bookings')
          .update({ final_paid: true, final_paid_at: new Date().toISOString() })
          .eq('id', bookingId);
      } else if (isVm) {
        // Videomaker deposit (50%): mark deposit paid and confirm booking.
        await supabase
          .from('bookings')
          .update({
            deposit_paid: true,
            deposit_paid_at: new Date().toISOString(),
            status: 'confirmed',
          })
          .eq('id', bookingId);
      } else {
        // Studio booking: 100% paid upfront — set both deposit_paid AND final_paid.
        const now = new Date().toISOString();
        await supabase
          .from('bookings')
          .update({
            deposit_paid: true,
            deposit_paid_at: now,
            final_paid: true,
            final_paid_at: now,
            status: 'confirmed',
          })
          .eq('id', bookingId);
      }
    }
  }

  if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.booking_id;
    const paymentType = session.metadata?.payment_type;
    // Only cancel the booking when the DEPOSIT session fails — balance failures shouldn't cancel a confirmed booking
    if (bookingId && paymentType !== 'balance') {
      await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
