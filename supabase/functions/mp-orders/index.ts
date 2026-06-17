const MP_TOKEN   = Deno.env.get('MP_ACCESS_TOKEN')           ?? ''
const SB_URL     = Deno.env.get('SUPABASE_URL')              ?? ''
const SB_KEY     = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

async function sbPatch(table: string, filter: string, body: unknown) {
  const res = await fetch(`${SB_URL}/rest/v1/${table}?${filter}`, {
    method: 'PATCH',
    headers: {
      'apikey':        SB_KEY,
      'Authorization': `Bearer ${SB_KEY}`,
      'Content-Type':  'application/json',
      'Prefer':        'return=representation',
    },
    body: JSON.stringify(body),
  })
  return res.json()
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const url    = new URL(req.url)
  const action = url.searchParams.get('action') ?? 'list'

  if (action === 'list') {
    const limit = url.searchParams.get('limit') ?? '20'
    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&limit=${limit}`,
      { headers: { Authorization: `Bearer ${MP_TOKEN}` } }
    )
    const data = await mpRes.json()
    return json({ total: data.paging?.total ?? 0, payments: data.results ?? [] })
  }

  if (action === 'sync' && req.method === 'POST') {
    const { mp_id, preference_id, status } = await req.json()
    const filter = `payment_mp_id=eq.${encodeURIComponent(preference_id)}`
    const rows = await sbPatch('orders', filter, {
      payment_status: status,
      payment_mp_id:  String(mp_id),
    })
    return json({ ok: true, updated: rows })
  }

  return json({ error: 'action inválida' }, 400)
})
