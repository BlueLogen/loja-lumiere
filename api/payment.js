// Vercel Serverless Function — proxy Mercado Pago
// POST /api/payment

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || 'APP_USR-5920068116698450-053116-2e06bd0832ac719f865c2319df7ee314-3440257066'

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const idempotencyKey = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

  try {
    const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(req.body),
    })

    const data = await mpRes.json()
    if (!mpRes.ok) console.error('[MP] Erro:', mpRes.status, JSON.stringify(data))
    return res.status(mpRes.status).json(data)
  } catch (err) {
    console.error('[MP] Erro interno:', err)
    return res.status(500).json({ error: err.message })
  }
}
