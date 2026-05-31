import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const MP_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')
  ?? 'APP_USR-5920068116698450-053116-2e06bd0832ac719f865c2319df7ee314-3440257066'

// Modo simulação: true = resposta fake para testar o fluxo
// Troque para false quando tiver o token de produção real
const MODO_TESTE = true

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function jsonRes(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const body = await req.json()
    const pm = body.payment_method_id ?? ''
    const amount: number = body.transaction_amount ?? 0
    const fakeId = Math.floor(Math.random() * 9000000000) + 1000000000

    // ── MODO SIMULAÇÃO ────────────────────────────────────────
    if (MODO_TESTE) {
      if (pm === 'pix') {
        return jsonRes({
          id: fakeId,
          status: 'pending',
          payment_method_id: 'pix',
          transaction_amount: amount,
          point_of_interaction: {
            transaction_data: {
              qr_code: '00020126580014br.gov.bcb.pix013611111111-1111-1111-1111-11111111111152040000530398654' + String(amount.toFixed(2)).replace('.','') + '5802BR5925BASIC E BIJUS ACESSORIOS6009SAO PAULO62140510basicbijus63041D3D',
              qr_code_base64: '',
              ticket_url: 'https://www.mercadopago.com.br/sandbox/payments/' + fakeId + '/ticket',
            },
          },
        })
      }

      if (pm === 'bolbradesco' || pm === 'boleto') {
        return jsonRes({
          id: fakeId,
          status: 'pending',
          payment_method_id: pm,
          transaction_amount: amount,
          transaction_details: {
            external_resource_url: 'https://www.mercadopago.com.br/sandbox/payments/' + fakeId + '/ticket',
          },
        })
      }

      // Cartão: aprovado
      return jsonRes({
        id: fakeId,
        status: 'approved',
        status_detail: 'accredited',
        payment_method_id: body.payment_method_id ?? 'visa',
        installments: body.installments ?? 1,
        transaction_amount: amount,
      })
    }

    // ── MODO PRODUÇÃO (MODO_TESTE = false) ────────────────────
    const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${MP_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      },
      body: JSON.stringify(body),
    })

    const data = await mpRes.json()
    return jsonRes(data, mpRes.status)

  } catch (err) {
    return jsonRes({ error: String(err) }, 500)
  }
})
