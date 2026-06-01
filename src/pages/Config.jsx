import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const MP_ORDERS_URL = 'https://mvtdqwedgdcxjfvhfrdp.supabase.co/functions/v1/mp-orders'
const WEBHOOK_URL   = 'https://mvtdqwedgdcxjfvhfrdp.supabase.co/functions/v1/mp-webhook'

const STATUS_COLOR = {
  approved:   '#22c55e',
  rejected:   '#ef4444',
  pending:    '#f59e0b',
  in_process: '#3b82f6',
  cancelled:  '#6b7280',
}
const STATUS_LABEL = {
  approved:   '✅ Aprovado',
  rejected:   '❌ Recusado',
  pending:    '⏳ Pendente',
  in_process: '🔄 Em processo',
  cancelled:  '🚫 Cancelado',
}

function fmt(v) {
  return `R$ ${Number(v).toFixed(2).replace('.', ',')}`
}
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
}
function copied(text) {
  navigator.clipboard.writeText(text).catch(() => {})
}

export default function Config() {
  const [payments,  setPayments]  = useState([])
  const [loading,   setLoading]   = useState(false)
  const [syncing,   setSyncing]   = useState(null)
  const [syncMsg,   setSyncMsg]   = useState('')
  const [error,     setError]     = useState('')
  const [copiedUrl, setCopiedUrl] = useState(false)

  async function fetchPayments() {
    setLoading(true)
    setError('')
    try {
      const res  = await fetch(`${MP_ORDERS_URL}?action=list&limit=30`)
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao buscar pagamentos'); return }
      setPayments(data.payments ?? [])
    } catch (e) {
      setError('Erro de conexão: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  async function syncPayment(p) {
    setSyncing(p.mp_id)
    setSyncMsg('')
    try {
      const res  = await fetch(`${MP_ORDERS_URL}?action=sync`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mp_id: p.mp_id, preference_id: p.preference_id, status: p.status }),
      })
      const data = await res.json()
      setSyncMsg(data.ok
        ? `✅ Pedido ${data.updated?.[0]?.order_number ?? ''} atualizado para "${p.status}"`
        : `❌ ${data.error}`)
    } catch (e) {
      setSyncMsg('❌ ' + e.message)
    } finally {
      setSyncing(null)
    }
  }

  function handleCopyWebhook() {
    copied(WEBHOOK_URL)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  useEffect(() => { fetchPayments() }, [])

  return (
    <main className="config-page">
      <div className="config-header">
        <Link to="/admin" className="config-back">← Admin</Link>
        <h1>⚙️ Configurações — Mercado Pago</h1>
      </div>

      {/* Webhook */}
      <section className="config-section">
        <h2>🔗 Webhook URL</h2>
        <p className="config-desc">
          Registre esta URL no painel do Mercado Pago em <strong>Configurações → Webhooks</strong>.
          O MP vai notificar automaticamente quando um pagamento for feito.
        </p>
        <div className="config-webhook-row">
          <code className="config-webhook-url">{WEBHOOK_URL}</code>
          <button className="btn btn--gold" onClick={handleCopyWebhook} style={{ flexShrink:0 }}>
            {copiedUrl ? '✓ Copiado!' : 'Copiar'}
          </button>
        </div>
        <div className="config-tags">
          <span className="config-tag config-tag--ok">✅ Secret configurado</span>
          <span className="config-tag config-tag--ok">✅ Validação HMAC-SHA256</span>
          <span className="config-tag config-tag--ok">✅ Atualiza Supabase automaticamente</span>
        </div>
      </section>

      {/* Pagamentos MP */}
      <section className="config-section">
        <div className="config-section-header">
          <h2>💳 Pagamentos no Mercado Pago</h2>
          <button className="btn btn--ghost" onClick={fetchPayments} disabled={loading}>
            {loading ? '⏳ Carregando…' : '🔄 Atualizar'}
          </button>
        </div>

        {error && <p className="config-error">{error}</p>}
        {syncMsg && <p className="config-sync-msg">{syncMsg}</p>}

        {payments.length === 0 && !loading && (
          <p className="config-empty">Nenhum pagamento encontrado.</p>
        )}

        <div className="config-table-wrap">
          <table className="config-table">
            <thead>
              <tr>
                <th>MP ID</th>
                <th>Status</th>
                <th>Valor</th>
                <th>Método</th>
                <th>Pagador</th>
                <th>Data</th>
                <th>Preference ID</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.mp_id}>
                  <td>
                    <code className="config-id" onClick={() => copied(String(p.mp_id))} title="Clique para copiar">
                      {p.mp_id}
                    </code>
                  </td>
                  <td>
                    <span className="config-status" style={{ color: STATUS_COLOR[p.status] ?? '#888' }}>
                      {STATUS_LABEL[p.status] ?? p.status}
                    </span>
                  </td>
                  <td>{fmt(p.amount)}</td>
                  <td><span className="config-method">{p.method}</span></td>
                  <td className="config-email">{p.payer_email ?? '—'}</td>
                  <td className="config-date">{fmtDate(p.date_created)}</td>
                  <td>
                    <code className="config-pref" onClick={() => copied(p.preference_id ?? '')} title="Clique para copiar">
                      {p.preference_id ? p.preference_id.slice(0, 20) + '…' : '—'}
                    </code>
                  </td>
                  <td>
                    {p.preference_id && (
                      <button
                        className="btn btn--gold"
                        style={{ fontSize:11, padding:'4px 10px' }}
                        onClick={() => syncPayment(p)}
                        disabled={syncing === p.mp_id}
                      >
                        {syncing === p.mp_id ? '…' : 'Sync'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
