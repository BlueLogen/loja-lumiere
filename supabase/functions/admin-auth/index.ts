const PASS_HASH      = Deno.env.get('ADMIN_PASS_HASH')       ?? ''
const SESSION_SECRET = Deno.env.get('ADMIN_SESSION_SECRET')  ?? ''

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ ok: false }, 405)

  try {
    const { password } = await req.json()
    if (!password || typeof password !== 'string') return json({ ok: false }, 400)

    const encoder = new TextEncoder()

    // Hash da senha enviada
    const hashBuf = await crypto.subtle.digest('SHA-256', encoder.encode(password))
    const hashHex = Array.from(new Uint8Array(hashBuf))
      .map(b => b.toString(16).padStart(2, '0')).join('')

    if (hashHex !== PASS_HASH) {
      return json({ ok: false }, 401)
    }

    // Gera token de sessão: HMAC-SHA256("admin-session:{timestamp}") com SESSION_SECRET
    const ts  = Date.now().toString()
    const key = await crypto.subtle.importKey(
      'raw', encoder.encode(SESSION_SECRET),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
    )
    const sig    = await crypto.subtle.sign('HMAC', key, encoder.encode(`admin-session:${ts}`))
    const sigHex = Array.from(new Uint8Array(sig))
      .map(b => b.toString(16).padStart(2, '0')).join('')

    const token = `${ts}.${sigHex}`
    return json({ ok: true, token })

  } catch {
    return json({ ok: false }, 500)
  }
})
