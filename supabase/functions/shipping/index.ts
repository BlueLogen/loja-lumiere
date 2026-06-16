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

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { cep_destino, subtotal = 0, item_count = 1 } = await req.json()
    const cep = String(cep_destino ?? '').replace(/\D/g, '')

    if (cep.length !== 8) return json({ error: 'CEP inválido' }, 400)
    if (!ME_TOKEN)        return json({ error: 'Token Melhor Envio não configurado' }, 500)

    // Dimensões fixas do pacote padrão da loja
    const qty    = Math.max(1, Number(item_count))
    const weight = 0.5 * qty   // 0,5 kg por item
    const height = 9           // cm
    const width  = 13          // cm
    const length = 18 * qty    // comprimento cresce com qtd

    // Timeout de 10s para não travar em redes lentas
    const ctrl = new AbortController()
    const tid  = setTimeout(() => ctrl.abort(), 10000)

    let meRes: Response
    try {
      meRes = await fetch(ME_URL, {
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
        signal: ctrl.signal,
      })
    } catch (fetchErr) {
      clearTimeout(tid)
      // Timeout ou erro de rede → retorna erro para o frontend usar fallback estático
      return json({ error: String(fetchErr) }, 504)
    }
    clearTimeout(tid)

    const data = await meRes.json()
    return json(data, meRes.status)

  } catch (err) {
    return json({ error: String(err) }, 500)
  }
})
