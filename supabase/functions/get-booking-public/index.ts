import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  let booking_id: string | null = null;
  if (req.method === 'GET') {
    booking_id = new URL(req.url).searchParams.get('booking_id');
  } else if (req.method === 'POST') {
    try {
      const body = await req.json();
      booking_id = body?.booking_id ?? null;
    } catch {
      // ignore
    }
  } else {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!booking_id || typeof booking_id !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing booking_id' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data, error } = await supabase
    .from('bookings')
    .select('id, studio, date, start_time, end_time, total, status, deposit_paid, final_paid, videomaker, videomaker_days, vfx_ai_seconds')
    .eq('id', booking_id)
    .maybeSingle();

  if (error || !data) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ booking: data }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
