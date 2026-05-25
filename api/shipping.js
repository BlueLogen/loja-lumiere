/**
 * Vercel Serverless Function — proxy para Melhor Envio
 * Rota: POST /api/shipping
 *
 * Body esperado:
 *   { cep_destino: "01310-100", subtotal: 200, item_count: 3 }
 *
 * Retorna array de opções de frete da Melhor Envio.
 */

const STORE_CEP   = process.env.STORE_CEP   || '01310100'   // CEP de origem (loja)
const ME_TOKEN    = process.env.MELHOR_ENVIO_TOKEN
const ME_URL      = 'https://melhorenvio.com.br/api/v2/me/shipment/calculate'
const USER_AGENT  = 'BasicBijus contato@basicbijus.com.br'

export default async function handler(req, res) {
  // CORS para dev local
  res.setHeader('Access-Control-Allow-Origin',  '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  if (!ME_TOKEN) {
    return res.status(500).json({ error: 'Token Melhor Envio não configurado' })
  }

  const { cep_destino, subtotal = 0, item_count = 1 } = req.body || {}
  const cepDigits = String(cep_destino || '').replace(/\D/g, '')

  if (cepDigits.length !== 8) {
    return res.status(400).json({ error: 'CEP inválido' })
  }

  // Dimensões estimadas do pacote
  const weight = Number((Math.max(0.1, item_count * 0.15)).toFixed(2))

  try {
    const meRes = await fetch(ME_URL, {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${ME_TOKEN}`,
        'Content-Type': 'application/json',
        Accept:         'application/json',
        'User-Agent':   USER_AGENT,
      },
      body: JSON.stringify({
        from: { postal_code: STORE_CEP },
        to:   { postal_code: cepDigits },
        package: {
          height: 10,
          width:  20,
          length: 15,
          weight,
        },
        options: {
          insurance_value: Number(subtotal) || 0,
          receipt:  false,
          own_hand: false,
        },
      }),
    })

    if (!meRes.ok) {
      const errText = await meRes.text()
      console.error('[MelhorEnvio] HTTP', meRes.status, errText)
      return res.status(meRes.status).json({ error: errText })
    }

    const data = await meRes.json()
    return res.status(200).json(data)
  } catch (err) {
    console.error('[MelhorEnvio] Erro:', err)
    return res.status(500).json({ error: err.message })
  }
}
