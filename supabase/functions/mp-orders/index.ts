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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payments = (data.results ?? []).map((p: any) => ({
      // Identificadores
      mp_id:              p.id,
      mp_order_id:        p.order?.id ?? null,
      mp_order_type:      p.order?.type ?? null,
      preference_id:      p.preference_id ?? null,
      external_reference: p.external_reference ?? null,
      authorization_code: p.authorization_code ?? null,

      // Status
      status:             p.status,
      status_detail:      p.status_detail,
      live_mode:          p.live_mode,         // false = teste

      // Valores
      amount:             p.transaction_amount,
      amount_refunded:    p.transaction_amount_refunded ?? 0,
      net_amount:         p.transaction_details?.net_received_amount ?? null,
      total_paid:         p.transaction_details?.total_paid_amount ?? null,
      fee:                p.fee_details?.[0]?.amount ?? null,
      coupon_amount:      p.coupon_amount ?? 0,
      currency:           p.currency_id ?? 'BRL',

      // Método
      method:             p.payment_method_id,
      method_type:        p.payment_type_id,
      installments:       p.installments ?? 1,
      processing_mode:    p.processing_mode ?? null,

      // Cartão
      card_last4:         p.card?.last_four_digits ?? null,
      card_first6:        p.card?.first_six_digits ?? null,
      card_holder:        p.card?.cardholder?.name ?? null,
      card_exp_month:     p.card?.expiration_month ?? null,
      card_exp_year:      p.card?.expiration_year ?? null,

      // Pagador
      payer_email:        p.payer?.email ?? null,
      payer_id:           p.payer?.id ?? null,
      payer_type:         p.payer?.type ?? null,
      payer_doc_type:     p.payer?.identification?.type ?? null,
      payer_doc_number:   p.payer?.identification?.number ?? null,

      // Datas
      date_created:       p.date_created,
      date_approved:      p.date_approved ?? null,
      date_last_updated:  p.date_last_updated ?? null,
      date_expiration:    p.date_of_expiration ?? null,
      money_release_date: p.money_release_date ?? null,

      // Descrição / referência
      description:        p.description ?? null,
      statement_desc:     p.statement_descriptor ?? null,

      // PIX (se houver)
      pix_qr_code:        p.point_of_interaction?.transaction_data?.qr_code ?? null,
      pix_ticket_url:     p.point_of_interaction?.transaction_data?.ticket_url ?? null,
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
