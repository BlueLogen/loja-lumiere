// GET /api/mp-test — diagnóstico do token MP

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || 'APP_USR-5920068116698450-053116-2e06bd0832ac719f865c2319df7ee314-3440257066'

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  try {
    const mpRes = await fetch('https://api.mercadopago.com/users/me', {
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    })
    const data = await mpRes.json()

    if (mpRes.ok) {
      return res.status(200).json({ ok: true, email: data.email, id: data.id, site: data.site_id })
    }
    return res.status(200).json({ ok: false, status: mpRes.status, error: data.error || data.message })
  } catch (err) {
    return res.status(200).json({ ok: false, error: err.message })
  }
}
