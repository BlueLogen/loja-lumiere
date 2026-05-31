const https = require('https')

const MP_TOKEN = process.env.MP_ACCESS_TOKEN || 'APP_USR-5920068116698450-053116-2e06bd0832ac719f865c2319df7ee314-3440257066'

function mpRequest(path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body)
    const options = {
      hostname: 'api.mercadopago.com',
      port: 443,
      path,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'X-Idempotency-Key': `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      },
    }
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }) }
        catch (e) { resolve({ status: res.statusCode, body: { error: data.slice(0, 200) } }) }
      })
    })
    req.on('error', reject)
    req.write(payload)
    req.end()
  })
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return }

  try {
    const body = req.body || {}
    const { status, body: data } = await mpRequest('/v1/payments', body)
    res.status(status).json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
