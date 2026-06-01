import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MP_TOKEN   = Deno.env.get('MP_ACCESS_TOKEN')            ?? ''
const SB_URL     = Deno.env.get('SUPABASE_URL')               ?? ''
const SB_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')  ?? ''

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const url    = new URL(req.url)
  const action = url.searchParams.get('action') ?? 'list'

  // ── GET /mp-orders?action=list — lista pagamentos recentes do MP ──
  if (action === 'list') {
    const limit = url.searchParams.get('limit') ?? '20'
    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&limit=${limit}`,
      { headers: { Authorization: `Bearer ${MP_TOKEN}` } }
    )
    const data = await mpRes.json()

    const payments = (data.results ?? []).map((p: {
      id: number; status: string; status_detail: string;
      payment_method_id: string; transaction_amount: number;
      date_created: string; date_approved: string | null;
      preference_id: string; payer: { email: string };
      order: { id: number; type: string } | null;
      external_reference: string | null;
    }) => ({
      mp_id:              p.id,
      mp_order_id:        p.order?.id ?? null,
      mp_order_type:      p.order?.type ?? null,
      status:             p.status,
      status_detail:      p.status_detail,
      method:             p.payment_method_id,
      amount:             p.transaction_amount,
      date_created:       p.date_created,
      date_approved:      p.date_approved,
      preference_id:      p.preference_id,
      external_reference: p.external_reference,
      payer_email:        p.payer?.email,
    }))

    return json({ total: data.paging?.total ?? 0, payments })
  }

  // ── POST /mp-orders?action=sync — sincroniza pagamento com Supabase ──
  if (action === 'sync' && req.method === 'POST') {
    const { mp_id, preference_id, status } = await req.json()

    const sb = createClient(SB_URL, SB_SERVICE)
    const { data: rows, error } = await sb
      .from('orders')
      .update({ payment_status: status, payment_mp_id: String(mp_id) })
      .eq('payment_mp_id', preference_id)
      .select('order_number, payment_status')

    if (error) return json({ ok: false, error: error.message }, 400)
    return json({ ok: true, updated: rows })
  }

  return json({ error: 'action inválida' }, 400)
})
