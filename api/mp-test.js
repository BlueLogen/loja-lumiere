/**
 * Endpoint de diagnóstico — GET /api/mp-test
 * Verifica se o token está carregado e testa a conexão com o MP.
 * REMOVA este arquivo após confirmar que o pagamento funciona.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const token = process.env.MP_ACCESS_TOKEN

  if (!token) {
    return res.status(200).json({
      ok: false,
      step: 'env_var',
      msg: 'MP_ACCESS_TOKEN NÃO está carregado neste deploy. Faça um novo Redeploy no Vercel.',
    })
  }

  // Testa o token chamando um endpoint simples do MP (sem criar pagamento)
  try {
    const mpRes = await fetch('https://api.mercadopago.com/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await mpRes.json()

    if (mpRes.ok) {
      return res.status(200).json({
        ok: true,
        step: 'token_valid',
        msg: 'Token válido!',
        mp_email: data.email,
        mp_id: data.id,
        mp_site: data.site_id,
      })
    } else {
      return res.status(200).json({
        ok: false,
        step: 'token_invalid',
        msg: `Token rejeitado pelo MP: ${data.message || data.error || mpRes.status}`,
        hint: 'Gere um novo Access Token em mercadopago.com.br/developers',
      })
    }
  } catch (err) {
    return res.status(200).json({ ok: false, step: 'network', msg: err.message })
  }
}
