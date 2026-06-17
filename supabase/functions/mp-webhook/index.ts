const MP_TOKEN       = Deno.env.get('MP_ACCESS_TOKEN')          ?? ''
const WEBHOOK_SECRET = Deno.env.get('MP_WEBHOOK_SECRET')        ?? ''
const SB_URL         = Deno.env.get('SUPABASE_URL')             ?? ''
const SB_KEY         = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const SB_HEADERS = {
  'apikey':        SB_KEY,
  'Authorization': `Bearer ${SB_KEY}`,
  'Content-Type':  'application/json',
  'Prefer':        'return=representation',
}

async function sbGet(table: string, filter: string) {
  const res = await fetch(`${SB_URL}/rest/v1/${table}?${filter}`, {
    headers: { ...SB_HEADERS, Prefer: 'return=representation' },
  })
  return res.json()
}

async function sbPatch(table: string, filter: string, body: unknown) {
  const res = await fetch(`${SB_URL}/rest/v1/${table}?${filter}`, {
    method: 'PATCH',
    headers: SB_HEADERS,
    body: JSON.stringify(body),
  })
  return res.json()
}

async function sbRpc(fn: string, params: unknown) {
  const res = await fetch(`${SB_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: SB_HEADERS,
    body: JSON.stringify(params),
  })
  return { ok: res.ok, status: res.status, data: await res.json() }
}

async function validateSignature(req: Request, dataId: string): Promise<boolean> {
  if (!WEBHOOK_SECRET) return true
  const xSignature = req.headers.get('x-signature') ?? ''
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

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
  const encoder  = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  )
  const sig  = await crypto.subtle.sign('HMAC', key, encoder.encode(manifest))
  const hash = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0')).join('')
  return hash === v1
}

async function decrementStock(
  items: Array<{ id: number; name: string; qty: number }>,
  orderRef: string,
): Promise<void> {
  for (const item of items) {
    if (String(item.name ?? '').toLowerCase().includes('caixa misteriosa')) {
      console.log('[Stock] Pulando caixa surpresa:', item.name)
      continue
    }
    const r = await sbRpc('decrement_stock', { p_id: Number(item.id), p_qty: Number(item.qty ?? 1) })
    if (!r.ok) {
      console.error(`[Stock] Erro ao decrementar produto ${item.id}:`, r.data)
    } else {
      console.log(`[Stock] -${item.qty} unidade(s) de "${item.name}" (id ${item.id})`)
    }
  }
  await sbPatch('orders', `order_number=eq.${encodeURIComponent(orderRef)}`, { stock_decremented: true })
  console.log('[Stock] stock_decremented = true para pedido:', orderRef)
}

Deno.serve(async (req) => {
  if (req.method === 'GET') return new Response('OK', { status: 200 })

  let body: { type?: string; data?: { id?: string } } = {}

  try {
    body = await req.json()
    console.log('[Webhook] Notificação:', JSON.stringify(body))

    const xSig = req.headers.get('x-signature')
    if (xSig && WEBHOOK_SECRET) {
      const dataId = body?.data?.id ?? ''
      const valid  = await validateSignature(req, dataId)
      if (!valid) {
        console.error('[Webhook] Assinatura inválida!')
      }
    }

    if (body.type !== 'payment' || !body.data?.id) {
      return new Response('OK', { status: 200 })
    }

    const paymentId = String(body.data.id)
    console.log('[Webhook] Processando payment_id:', paymentId)

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${MP_TOKEN}` },
    })
    const payment = await mpRes.json()
    console.log('[Webhook] Status MP:', payment.status, '| preference_id:', payment.preference_id)

    const preferenceId      = payment.preference_id
    const externalReference = payment.external_reference
    const status            = payment.status

    let filter: string
    if (externalReference) {
      filter = `order_number=eq.${encodeURIComponent(externalReference)}`
    } else if (preferenceId) {
      filter = `payment_mp_id=eq.${encodeURIComponent(preferenceId)}`
    } else {
      filter = `payment_mp_id=eq.${encodeURIComponent(paymentId)}`
    }

    console.log('[Webhook] Atualizando pedido com filtro:', filter)

    const updated = await sbPatch('orders', filter, {
      payment_status: status,
      payment_mp_id:  paymentId,
    })

    console.log('[Webhook] Pedido atualizado:', JSON.stringify(updated))

    if (status === 'approved' && Array.isArray(updated) && updated.length > 0) {
      const order = updated[0]
      if (!order.stock_decremented && Array.isArray(order.items) && order.items.length > 0) {
        console.log('[Webhook] Iniciando decremento de estoque:', order.order_number)
        await decrementStock(order.items, order.order_number)
      } else if (order.stock_decremented) {
        console.log('[Webhook] Estoque já decrementado:', order.order_number)
      }
    }

    return new Response('OK', { status: 200 })

  } catch (err) {
    console.error('[Webhook] Erro:', String(err))
    return new Response('OK', { status: 200 })
  }
})
