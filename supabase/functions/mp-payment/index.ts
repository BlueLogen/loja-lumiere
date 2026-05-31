import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const MP_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')
  ?? 'APP_USR-5920068116698450-053116-2e06bd0832ac719f865c2319df7ee314-3440257066'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    const body = await req.json()

    const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${MP_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      },
      body: JSON.stringify(body),
    })

    const data = await mpRes.json()

    return new Response(JSON.stringify(data), {
      status: mpRes.status,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
