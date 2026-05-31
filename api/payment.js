/**
 * Vercel Serverless Function — proxy para Mercado Pago
 * Rota: POST /api/payment
 *
 * O access token fica APENAS neste server-side function,
 * nunca exposto ao browser.
 */

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin',  '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  if (!MP_ACCESS_TOKEN) {
    console.error('[MP] MP_ACCESS_TOKEN não configurado')
    return res.status(500).json({ error: 'Token Mercado Pago não configurado' })
  }

  // Idempotency key único por requisição
  const idempotencyKey = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

  try {
    const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
      method:  'POST',
      headers: {
        Authorization:       `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type':      'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(req.body),
    })

    const data = await mpRes.json()

    if (!mpRes.ok) {
      console.error('[MP] Erro na API:', mpRes.status, JSON.stringify(data))
    }

    return res.status(mpRes.status).json(data)
  } catch (err) {
    console.error('[MP] Erro interno:', err)
    return res.status(500).json({ error: err.message })
  }
}
