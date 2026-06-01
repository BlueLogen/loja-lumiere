import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const MP_TOKEN = Deno.env.get('MP_ACCESS_TOKEN') ?? ''

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { items, payer, shipping, origin, order_number } = await req.json()

    // Monta os itens para o MP
    const mpItems = items.map((i: {id:number,name:string,qty:number,price:number}) => ({
      id:          String(i.id),
      title:       i.name,
      quantity:    i.qty,
      unit_price:  Number(i.price),
      currency_id: 'BRL',
    }))

    // Adiciona frete como item se houver
    if (shipping && shipping.price > 0) {
      mpItems.push({
        id:          'frete',
        title:       `Frete — ${shipping.name}`,
        quantity:    1,
        unit_price:  Number(shipping.price),
        currency_id: 'BRL',
      })
    }

    const siteOrigin = origin ?? 'https://basicbijus.com.br'

    const preference = {
      items: mpItems,
      payer: {
        name:  payer.name  ?? '',
        email: payer.email ?? '',
        identification: {
          type:   'CPF',
          number: payer.cpf ?? '',
        },
      },
      back_urls: {
        success: `${siteOrigin}/pedido?status=aprovado`,
        failure: `${siteOrigin}/pedido?status=recusado`,
        pending: `${siteOrigin}/pedido?status=pendente`,
      },
      auto_return: 'approved',
      payment_methods: {
        installments: 3,
      },
      statement_descriptor: 'BASIC E BIJUS',
      external_reference:  order_number ?? '',   // ID do pedido na sua loja
      notification_url: 'https://mvtdqwedgdcxjfvhfrdp.supabase.co/functions/v1/mp-webhook',
    }

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${MP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    })

    const data = await mpRes.json()

    if (!mpRes.ok) {
      return new Response(JSON.stringify({ error: data.message ?? data.error ?? 'Erro MP' }), {
        status: mpRes.status,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    // sandbox_init_point = ambiente de teste / init_point = produção real
    return new Response(JSON.stringify({
      preference_id: data.id,
      checkout_url:  data.sandbox_init_point ?? data.init_point,
    }), {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
