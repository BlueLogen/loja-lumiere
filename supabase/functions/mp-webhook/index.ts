import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MP_TOKEN   = Deno.env.get('MP_ACCESS_TOKEN')   ?? ''
const SB_URL     = Deno.env.get('SUPABASE_URL')       ?? ''
const SB_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

serve(async (req) => {
  // MP faz um GET inicial para verificar o endpoint
  if (req.method === 'GET') {
    return new Response('OK', { status: 200 })
  }

  try {
    const body = await req.json()
    console.log('[Webhook] Recebido:', JSON.stringify(body))

    // Só processa notificações de pagamento
    if (body.type !== 'payment' || !body.data?.id) {
      return new Response('OK', { status: 200 })
    }

    const paymentId = String(body.data.id)

    // 1. Busca os detalhes do pagamento no MP
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${MP_TOKEN}` },
    })
    const payment = await mpRes.json()
    console.log('[Webhook] Pagamento MP:', payment.id, payment.status, payment.preference_id)

    const preferenceId = payment.preference_id
    const status       = payment.status        // approved | rejected | pending | in_process
    const statusDetail = payment.status_detail ?? ''

    if (!preferenceId) {
      console.error('[Webhook] preference_id não encontrado no pagamento')
      return new Response('OK', { status: 200 })
    }

    // 2. Atualiza o pedido no Supabase pelo preference_id
    const sb = createClient(SB_URL, SB_SERVICE)
    const { data: orders, error } = await sb
      .from('orders')
      .update({
        payment_status: status,
        payment_mp_id:  paymentId,   // atualiza para o payment_id real
      })
      .eq('payment_mp_id', preferenceId)
      .select('order_number, customer_email, total')

    if (error) {
      console.error('[Webhook] Erro ao atualizar pedido:', error.message)
    } else {
      console.log('[Webhook] Pedido atualizado:', orders)
    }

    return new Response('OK', { status: 200 })

  } catch (err) {
    console.error('[Webhook] Erro:', String(err))
    // Sempre retorna 200 pro MP — se retornar erro ele fica tentando
    return new Response('OK', { status: 200 })
  }
})
