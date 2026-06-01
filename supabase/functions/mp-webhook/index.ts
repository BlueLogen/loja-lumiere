import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MP_TOKEN      = Deno.env.get('MP_ACCESS_TOKEN')         ?? ''
const WEBHOOK_SECRET = Deno.env.get('MP_WEBHOOK_SECRET')      ?? ''
const SB_URL        = Deno.env.get('SUPABASE_URL')            ?? ''
const SB_SERVICE    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

// Valida a assinatura HMAC-SHA256 enviada pelo Mercado Pago
// Docs: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
async function validateSignature(req: Request, body: { data?: { id?: string } }): Promise<boolean> {
  if (!WEBHOOK_SECRET) return true // sem secret configurado, aceita tudo

  const xSignature  = req.headers.get('x-signature')  ?? ''
  const xRequestId  = req.headers.get('x-request-id') ?? ''

  if (!xSignature) return false

  // Extrai ts e v1 do header: "ts=...,v1=..."
  const parts: Record<string, string> = {}
  xSignature.split(',').forEach(part => {
    const [k, v] = part.split('=')
    if (k && v) parts[k.trim()] = v.trim()
  })

  const ts = parts['ts']
  const v1 = parts['v1']
  if (!ts || !v1) return false

  // Monta a string de assinatura
  const dataId  = body?.data?.id ?? ''
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`

  // HMAC-SHA256
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(manifest))
  const hash = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  return hash === v1
}

serve(async (req) => {
  // MP faz GET para verificar o endpoint
  if (req.method === 'GET') {
    return new Response('OK', { status: 200 })
  }

  let body: { type?: string; data?: { id?: string }; action?: string } = {}

  try {
    body = await req.json()
    console.log('[Webhook] Notificação:', JSON.stringify(body))

    // Valida a assinatura (se o MP enviar o header x-signature)
    const xSig = req.headers.get('x-signature')
    if (xSig && WEBHOOK_SECRET) {
      const valid = await validateSignature(req, body)
      if (!valid) {
        console.error('[Webhook] Assinatura inválida! Headers:', JSON.stringify([...req.headers.entries()]))
        // Loga mas não rejeita — aceita mesmo com assinatura inválida para não perder notificações
        // return new Response('Unauthorized', { status: 401 })
      }
    }

    // Só processa notificações de pagamento
    if (body.type !== 'payment' || !body.data?.id) {
      return new Response('OK', { status: 200 })
    }

    const paymentId = String(body.data.id)
    console.log('[Webhook] Processando payment_id:', paymentId)

    // 1. Busca detalhes do pagamento no MP
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${MP_TOKEN}` },
    })
    const payment = await mpRes.json()
    console.log('[Webhook] Status MP:', payment.status, '| preference_id:', payment.preference_id)

    const preferenceId      = payment.preference_id
    const externalReference = payment.external_reference  // order_number BB-YYYYMMDD-XXXXXX
    const status            = payment.status
    const mpOrderId         = payment.order?.id ?? null

    console.log('[Webhook] external_reference:', externalReference, '| preference_id:', preferenceId, '| mp_order_id:', mpOrderId)

    // 2. Atualiza pedido no Supabase
    // Prioridade: external_reference (order_number) → preference_id
    const sb = createClient(SB_URL, SB_SERVICE)

    const matchField = externalReference ? 'order_number' : 'payment_mp_id'
    const matchValue = externalReference ? externalReference : preferenceId

    if (!matchValue) {
      console.error('[Webhook] Sem external_reference nem preference_id')
      return new Response('OK', { status: 200 })
    }

    const { data: updated, error } = await sb
      .from('orders')
      .update({
        payment_status: status,
        payment_mp_id:  paymentId,
      })
      .eq(matchField, matchValue)
      .select('order_number, customer_email, payment_status')

    if (error) {
      console.error('[Webhook] Erro Supabase:', error.message)
    } else {
      console.log('[Webhook] Pedido atualizado:', JSON.stringify(updated))
    }

    return new Response('OK', { status: 200 })

  } catch (err) {
    console.error('[Webhook] Erro:', String(err))
    return new Response('OK', { status: 200 }) // sempre 200 pro MP
  }
})
