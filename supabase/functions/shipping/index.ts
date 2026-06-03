import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const STORE_CEP  = '11735218'
const ME_TOKEN   = Deno.env.get('MELHOR_ENVIO_TOKEN') ?? ''
const ME_URL     = 'https://melhorenvio.com.br/api/v2/me/shipment/calculate'
const USER_AGENT = 'BasicBijus contato@basicbijus.com.br'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { cep_destino, subtotal = 0, item_count = 1 } = await req.json()
    const cep = String(cep_destino ?? '').replace(/\D/g, '')

    if (cep.length !== 8) {
      return new Response(JSON.stringify({ error: 'CEP inválido' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    if (!ME_TOKEN) {
      return new Response(JSON.stringify({ error: 'Token Melhor Envio não configurado' }), {
        status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    // Dimensões fixas do pacote padrão da loja
    const qty    = Math.max(1, Number(item_count))
    const weight = 0.5 * qty          // 0,5 kg por item
    const height = 9                  // cm
    const width  = 13                 // cm
    const length = 18 * qty           // comprimento cresce com qtd

    const meRes = await fetch(ME_URL, {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${ME_TOKEN}`,
        'Content-Type': 'application/json',
        Accept:         'application/json',
        'User-Agent':   USER_AGENT,
      },
      body: JSON.stringify({
        from:    { postal_code: STORE_CEP },
        to:      { postal_code: cep },
        package: { height, width, length, weight },
        options: { insurance_value: Number(subtotal) || 0, receipt: false, own_hand: false },
        services: '1,2', // PAC e SEDEX (Mini Envios nao aceita altura 9cm)
      }),
    })

    const data = await meRes.json()

    return new Response(JSON.stringify(data), {
      status: meRes.status,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
