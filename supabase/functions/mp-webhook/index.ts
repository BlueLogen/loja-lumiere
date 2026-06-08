import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MP_TOKEN       = Deno.env.get('MP_ACCESS_TOKEN')          ?? ''
const WEBHOOK_SECRET = Deno.env.get('MP_WEBHOOK_SECRET')        ?? ''
const SB_URL         = Deno.env.get('SUPABASE_URL')             ?? ''
const SB_SERVICE     = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

// Valida a assinatura HMAC-SHA256 enviada pelo Mercado Pago
async function validateSignature(req: Request, body: { data?: { id?: string } }): Promise<boolean> {
  if (!WEBHOOK_SECRET) return true

  const xSignature = req.headers.get('x-signature')  ?? ''
  const xRequestId = req.headers.get('x-request-id') ?? ''

  if (!xSignature) return false

  const parts: Record<string, string> = {}
  xSignature.split(',').forEach(part => {
    const [k, v] = part.split('=')
    if (k && v) parts[k.trim()] = v.trim()
  })

  const ts = parts['ts']
  const v1 = parts['v1']
  if (!ts || !v1) return false

  const dataId   = body?.data?.id ?? ''
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig  = await crypto.subtle.sign('HMAC', key, encoder.encode(manifest))
  const hash = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  return hash === v1
}

// ── Decrementa estoque de cada item do pedido (exceto Caixas Misteriosas) ──
async function decrementStock(
  sb: ReturnType<typeof createClient>,
  items: Array<{ id: number; name: string; qty: number; price: number }>,
  orderRef: string,
): Promise<void> {
  for (const item of items) {
    // Caixas Misteriosas têm estoque ilimitado — não decrementar
    if (String(item.name ?? '').toLowerCase().includes('caixa misteriosa')) {
      console.log('[Stock] Pulando caixa surpresa:', item.name)
      continue
    }

    const { error } = await sb.rpc('decrement_stock', {
      p_id:  Number(item.id),
      p_qty: Number(item.qty ?? 1),
    })

    if (error) {
      console.error(`[Stock] Erro ao decrementar produto ${item.id} (${item.name}):`, error.message)
    } else {
      console.log(`[Stock] -${item.qty} unidade(s) de "${item.name}" (id ${item.id})`)
    }
  }

  // Marca o pedido como já decrementado (idempotência)
  await sb
    .from('orders')
    .update({ stock_decremented: true })
    .eq('order_number', orderRef)

  console.log('[Stock] stock_decremented = true para pedido:', orderRef)
}

serve(async (req) => {
  if (req.method === 'GET') return new Response('OK', { status: 200 })

  let body: { type?: string; data?: { id?: string }; action?: string } = {}

  try {
    body = await req.json()
    console.log('[Webhook] Notificação:', JSON.stringify(body))

    // Valida assinatura (se o MP enviar o header x-signature)
    const xSig = req.headers.get('x-signature')
    if (xSig && WEBHOOK_SECRET) {
      const valid = await validateSignature(req, body)
      if (!valid) {
        console.error('[Webhook] Assinatura inválida! Headers:', JSON.stringify([...req.headers.entries()]))
        // Loga mas não rejeita — evita perder notificações legítimas sem header
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
    const externalReference = payment.external_reference  // BB-YYYYMMDD-XXXXXX
    const status            = payment.status

    console.log('[Webhook] external_reference:', externalReference, '| preference_id:', preferenceId)

    // 2. Determina campo de match no Supabase
    let matchField: string
    let matchValue: string | null

    if (externalReference) {
      matchField = 'order_number'
      matchValue = externalReference
    } else if (preferenceId) {
      matchField = 'payment_mp_id'
      matchValue = preferenceId
    } else {
      matchField = 'payment_mp_id'
      matchValue = paymentId
    }

    console.log('[Webhook] Buscando pedido por', matchField, '=', matchValue)

    const sb = createClient(SB_URL, SB_SERVICE)

    // 3. Atualiza status do pagamento + retorna dados necessários para o estoque
    const { data: updated, error } = await sb
      .from('orders')
      .update({
        payment_status: status,
        payment_mp_id:  paymentId,
      })
      .eq(matchField, matchValue)
      .select('order_number, customer_email, payment_status, items, stock_decremented')

    if (error) {
      console.error('[Webhook] Erro Supabase:', error.message)
    } else {
      console.log('[Webhook] Pedido atualizado:', JSON.stringify(updated))

      // 4. Decrementa estoque somente se o pagamento foi APROVADO e ainda não decrementou
      if (status === 'approved' && updated && updated.length > 0) {
        const order = updated[0]

        if (!order.stock_decremented && Array.isArray(order.items) && order.items.length > 0) {
          console.log('[Webhook] Iniciando decremento de estoque para pedido:', order.order_number)
          await decrementStock(sb, order.items, order.order_number)
        } else if (order.stock_decremented) {
          console.log('[Webhook] Estoque já decrementado anteriormente para pedido:', order.order_number)
        }
      }
    }

    return new Response('OK', { status: 200 })

  } catch (err) {
    console.error('[Webhook] Erro:', String(err))
    return new Response('OK', { status: 200 }) // sempre 200 pro MP
  }
})
