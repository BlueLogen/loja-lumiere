const https = require('https')

const MP_TOKEN = process.env.MP_ACCESS_TOKEN || 'APP_USR-5920068116698450-053116-2e06bd0832ac719f865c2319df7ee314-3440257066'

function mpGet(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.mercadopago.com',
      port: 443,
      path,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${MP_TOKEN}` },
    }
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }) }
        catch (e) { resolve({ status: res.statusCode, body: data }) }
      })
    })
    req.on('error', reject)
    req.end()
  })
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  try {
    const { status, body } = await mpGet('/users/me')
    if (status === 200) {
      res.status(200).json({ ok: true, email: body.email, id: body.id, site: body.site_id })
    } else {
      res.status(200).json({ ok: false, status, error: body.error || body.message || body })
    }
  } catch (err) {
    res.status(200).json({ ok: false, error: err.message })
  }
}
