import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const MP_TOKEN = Deno.env.get('MP_ACCESS_TOKEN') ?? ''

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

  try {
    const body = await req.json()

    // ── MODO TRANSPARENTE: cartão, PIX ou boleto direto ──────
    // Detecta pelo campo "payment_method_id" ou "token"
    if (body.payment_method_id || body.token) {
      const payment: Record<string, unknown> = {
        transaction_amount: Number(body.transaction_amount),
        description:        body.description ?? 'Pedido Basic & Bijus',
        external_reference: body.order_number ?? '',
        notification_url:  'https://mvtdqwedgdcxjfvhfrdp.supabase.co/functions/v1/mp-webhook',
        payer: {
          email:      body.payer?.email ?? '',
          first_name: body.payer?.first_name ?? '',
          last_name:  body.payer?.last_name  ?? '',
          identification: {
            type:   'CPF',
            number: body.payer?.cpf ?? '',
          },
        },
      }

      // Cartão (precisa de token)
      if (body.token) {
        payment.token              = body.token
        payment.payment_method_id  = body.payment_method_id
        payment.installments       = body.installments ?? 1
        payment.issuer_id          = body.issuer_id ?? undefined
      } else {
        // PIX ou Boleto (sem token)
        payment.payment_method_id  = body.payment_method_id
      }

      const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          Authorization:       `Bearer ${MP_TOKEN}`,
          'Content-Type':      'application/json',
          'X-Idempotency-Key': `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        },
        body: JSON.stringify(payment),
      })

      const data = await mpRes.json()
      if (!mpRes.ok) return json({ error: data.message ?? data.error }, mpRes.status)

      // Monta resposta com QR code (PIX) ou URL boleto
      return json({
        mode:          'transparent',
        id:            data.id,
        status:        data.status,
        status_detail: data.status_detail,
        // PIX
        qr_code:       data.point_of_interaction?.transaction_data?.qr_code       ?? null,
        qr_code_base64:data.point_of_interaction?.transaction_data?.qr_code_base64 ?? null,
        // Boleto
        boleto_url:    data.transaction_details?.external_resource_url ?? null,
        // Cartão
        installments:  data.installments ?? 1,
        payment_method_id: data.payment_method_id,
      })
    }

    // ── MODO CHECKOUT PRO: redireciona para página do MP ─────
    const { items, payer, shipping, origin, order_number } = body

    const mpItems = (items ?? []).map((i: {id:number,name:string,qty:number,price:number}) => ({
      id:          String(i.id),
      title:       i.name,
      quantity:    i.qty,
      unit_price:  Number(i.price),
      currency_id: 'BRL',
    }))

    if (shipping?.price > 0) {
      mpItems.push({ id:'frete', title:`Frete — ${shipping.name}`, quantity:1, unit_price:Number(shipping.price), currency_id:'BRL' })
    }

    const siteOrigin = origin ?? 'https://basicbijus.com.br'

    const preference = {
      items: mpItems,
      payer: { name: payer?.name ?? '', email: payer?.email ?? '', identification: { type:'CPF', number: payer?.cpf ?? '' } },
      back_urls: {
        success: `${siteOrigin}/pedido?status=aprovado`,
        failure: `${siteOrigin}/pedido?status=recusado`,
        pending: `${siteOrigin}/pedido?status=pendente`,
      },
      auto_return:          'approved',
      payment_methods:      { installments: 3 },
      statement_descriptor: 'BASIC E BIJUS',
      external_reference:   order_number ?? '',
      notification_url:     'https://mvtdqwedgdcxjfvhfrdp.supabase.co/functions/v1/mp-webhook',
    }

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { Authorization:`Bearer ${MP_TOKEN}`, 'Content-Type':'application/json' },
      body: JSON.stringify(preference),
    })

    const data = await mpRes.json()
    if (!mpRes.ok) return json({ error: data.message ?? data.error }, mpRes.status)

    return json({
      mode:          'pro',
      preference_id: data.id,
      checkout_url:  data.sandbox_init_point ?? data.init_point,
    })

  } catch (err) {
    return json({ error: String(err) }, 500)
  }
})
