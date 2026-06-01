import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const MP_ORDERS_URL  = 'https://mvtdqwedgdcxjfvhfrdp.supabase.co/functions/v1/mp-orders'
const WEBHOOK_URL    = 'https://mvtdqwedgdcxjfvhfrdp.supabase.co/functions/v1/mp-webhook'

const STATUS_COLOR = { approved:'#22c55e', rejected:'#ef4444', pending:'#f59e0b', in_process:'#3b82f6', cancelled:'#6b7280', refunded:'#8b5cf6' }
const STATUS_LABEL = { approved:'✅ Aprovado', rejected:'❌ Recusado', pending:'⏳ Pendente', in_process:'🔄 Em processo', cancelled:'🚫 Cancelado', refunded:'↩️ Estornado' }

const R = (v) => v != null ? `R$ ${Number(v).toFixed(2).replace('.',',')}` : '—'
const D = (d) => d ? new Date(d).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—'
const CP = (t) => { navigator.clipboard.writeText(String(t)).catch(()=>{}) }

function Row({ p, onSync, syncing }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <tr className={`config-row${open ? ' config-row--open' : ''}`} onClick={() => setOpen(o => !o)}>
        <td><span className="config-expand">{open ? '▼' : '▶'}</span></td>
        <td>
          <code className="config-id" onClick={e=>{e.stopPropagation();CP(p.mp_id)}} title="Copiar Payment ID">#{p.mp_id}</code>
          {p.mp_order_id && <><br/><code className="config-id config-id--order" onClick={e=>{e.stopPropagation();CP(p.mp_order_id)}} title="Copiar Order ID">🛒 {p.mp_order_id}</code></>}
        </td>
        <td>
          <span className="config-status" style={{color: STATUS_COLOR[p.status]??'#888'}}>{STATUS_LABEL[p.status]??p.status}</span>
          {p.status_detail && <small style={{display:'block',color:'var(--gray)',fontSize:10}}>{p.status_detail}</small>}
          {p.live_mode === false && <span className="config-tag-test">TESTE</span>}
        </td>
        <td>
          <strong>{R(p.amount)}</strong>
          {p.installments > 1 && <small style={{display:'block',color:'var(--gray)',fontSize:10}}>{p.installments}×</small>}
        </td>
        <td>
          <span className="config-method">{p.method}</span>
          <small style={{display:'block',color:'var(--gray)',fontSize:10}}>{p.method_type}</small>
        </td>
        <td className="config-email">{p.payer_email??'—'}</td>
        <td className="config-date">{D(p.date_created)}</td>
        <td onClick={e=>e.stopPropagation()}>
          {p.preference_id && (
            <button className="btn btn--gold" style={{fontSize:11,padding:'4px 10px'}} onClick={()=>onSync(p)} disabled={syncing===p.mp_id}>
              {syncing===p.mp_id ? '…' : '↺ Sync'}
            </button>
          )}
        </td>
      </tr>

      {open && (
        <tr className="config-detail-row">
          <td colSpan={8}>
            <div className="config-detail">

              <div className="config-detail-group">
                <h4>🔑 Identificadores</h4>
                <Field label="Payment ID"        value={p.mp_id}              copy />
                <Field label="Order ID (MP)"     value={p.mp_order_id}        copy />
                <Field label="Order Type"        value={p.mp_order_type} />
                <Field label="Preference ID"     value={p.preference_id}      copy />
                <Field label="External Ref"      value={p.external_reference} copy />
                <Field label="Authorization"     value={p.authorization_code} copy />
                <Field label="Ambiente"          value={p.live_mode === false ? '🧪 Teste (sandbox)' : '🚀 Produção'} />
              </div>

              <div className="config-detail-group">
                <h4>💰 Valores</h4>
                <Field label="Total pago"        value={R(p.amount)} />
                <Field label="Valor líquido"     value={R(p.net_amount)} />
                <Field label="Total c/ taxas"    value={R(p.total_paid)} />
                <Field label="Taxa MP"           value={R(p.fee)} />
                <Field label="Desconto cupom"    value={R(p.coupon_amount)} />
                <Field label="Estornado"         value={R(p.amount_refunded)} />
                <Field label="Parcelas"          value={p.installments > 1 ? `${p.installments}×` : '1× (à vista)'} />
                <Field label="Moeda"             value={p.currency} />
              </div>

              <div className="config-detail-group">
                <h4>💳 Método & Cartão</h4>
                <Field label="Método"            value={p.method} />
                <Field label="Tipo"              value={p.method_type} />
                <Field label="Processamento"     value={p.processing_mode} />
                <Field label="Últimos 4 dígitos" value={p.card_last4 ? `•••• ${p.card_last4}` : null} />
                <Field label="Primeiros 6 (BIN)" value={p.card_first6} />
                <Field label="Titular cartão"    value={p.card_holder} />
                <Field label="Validade"          value={p.card_exp_month && p.card_exp_year ? `${p.card_exp_month}/${p.card_exp_year}` : null} />
              </div>

              <div className="config-detail-group">
                <h4>👤 Pagador</h4>
                <Field label="E-mail"            value={p.payer_email}      copy />
                <Field label="ID MP"             value={p.payer_id}         copy />
                <Field label="Tipo"              value={p.payer_type} />
                <Field label="Doc. tipo"         value={p.payer_doc_type} />
                <Field label="Doc. número"       value={p.payer_doc_number} copy />
              </div>

              <div className="config-detail-group">
                <h4>📅 Datas</h4>
                <Field label="Criado em"         value={D(p.date_created)} />
                <Field label="Aprovado em"       value={D(p.date_approved)} />
                <Field label="Última atualiz."   value={D(p.date_last_updated)} />
                <Field label="Expira em"         value={D(p.date_expiration)} />
                <Field label="Liberação $"       value={D(p.money_release_date)} />
              </div>

              <div className="config-detail-group">
                <h4>📝 Descrição / PIX</h4>
                <Field label="Descrição"         value={p.description} />
                <Field label="Statement desc"    value={p.statement_desc} />
                {p.pix_qr_code && <Field label="PIX Copia e Cola" value={p.pix_qr_code?.slice(0,40)+'…'} copy fullValue={p.pix_qr_code} />}
                {p.pix_ticket_url && <Field label="PIX Ticket URL" value={p.pix_ticket_url} link />}
              </div>

            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function Field({ label, value, copy, fullValue, link }) {
  if (value == null || value === '' || value === '—') return null
  return (
    <div className="config-field">
      <span className="config-field__label">{label}</span>
      <span className="config-field__value">
        {link
          ? <a href={value} target="_blank" rel="noreferrer" style={{color:'var(--gold)'}}>Abrir →</a>
          : value
        }
        {copy && (
          <button className="config-copy-btn" onClick={() => CP(fullValue ?? value)} title="Copiar">⎘</button>
        )}
      </span>
    </div>
  )
}

export default function Config() {
  const [payments,  setPayments]  = useState([])
  const [loading,   setLoading]   = useState(false)
  const [syncing,   setSyncing]   = useState(null)
  const [syncMsg,   setSyncMsg]   = useState('')
  const [error,     setError]     = useState('')
  const [copiedUrl, setCopiedUrl] = useState(false)

  async function fetchPayments() {
    setLoading(true); setError('')
    try {
      const res  = await fetch(`${MP_ORDERS_URL}?action=list&limit=50`)
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao buscar pagamentos'); return }
      setPayments(data.payments ?? [])
    } catch (e) { setError('Erro: ' + e.message) }
    finally { setLoading(false) }
  }

  async function syncPayment(p) {
    setSyncing(p.mp_id); setSyncMsg('')
    try {
      const res  = await fetch(`${MP_ORDERS_URL}?action=sync`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ mp_id: p.mp_id, preference_id: p.preference_id, status: p.status }),
      })
      const data = await res.json()
      setSyncMsg(data.ok
        ? `✅ Pedido ${data.updated?.[0]?.order_number ?? ''} → status "${p.status}"`
        : `❌ ${data.error}`)
    } catch (e) { setSyncMsg('❌ ' + e.message) }
    finally { setSyncing(null) }
  }

  function handleCopyWebhook() {
    CP(WEBHOOK_URL); setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  useEffect(() => { fetchPayments() }, [])

  const total   = payments.length
  const approved  = payments.filter(p => p.status === 'approved').length
  const pending   = payments.filter(p => p.status === 'pending').length
  const tests     = payments.filter(p => p.live_mode === false).length

  return (
    <main className="config-page">
      <div className="config-header">
        <Link to="/admin" className="config-back">← Admin</Link>
        <h1>⚙️ Mercado Pago — Config</h1>
      </div>

      {/* Stats */}
      <div className="config-stats">
        {[
          { label:'Total pagamentos', value: total },
          { label:'✅ Aprovados',     value: approved, color:'#22c55e' },
          { label:'⏳ Pendentes',     value: pending,  color:'#f59e0b' },
          { label:'🧪 Testes',        value: tests,    color:'#3b82f6' },
        ].map(s => (
          <div key={s.label} className="config-stat">
            <strong style={{color: s.color ?? 'var(--text)'}}>{s.value}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Webhook */}
      <section className="config-section">
        <h2>🔗 Webhook URL</h2>
        <p className="config-desc">Registre no painel MP → <strong>Configurações → Notificações → Webhooks</strong></p>
        <div className="config-webhook-row">
          <code className="config-webhook-url">{WEBHOOK_URL}</code>
          <button className="btn btn--gold" onClick={handleCopyWebhook} style={{flexShrink:0}}>
            {copiedUrl ? '✓ Copiado!' : 'Copiar'}
          </button>
        </div>
        <div className="config-tags">
          <span className="config-tag config-tag--ok">✅ HMAC-SHA256</span>
          <span className="config-tag config-tag--ok">✅ Atualiza Supabase</span>
          <span className="config-tag config-tag--ok">✅ Sempre retorna 200</span>
        </div>
      </section>

      {/* Pagamentos */}
      <section className="config-section">
        <div className="config-section-header">
          <h2>💳 Pagamentos ({total})</h2>
          <button className="btn btn--ghost" onClick={fetchPayments} disabled={loading}>
            {loading ? '⏳' : '🔄 Atualizar'}
          </button>
        </div>

        {error    && <p className="config-error">{error}</p>}
        {syncMsg  && <p className="config-sync-msg">{syncMsg}</p>}
        {!loading && total === 0 && <p className="config-empty">Nenhum pagamento encontrado.</p>}

        <p className="config-desc" style={{marginBottom:8}}>
          Clique em <strong>▶</strong> para expandir todos os dados de um pagamento.
        </p>

        <div className="config-table-wrap">
          <table className="config-table">
            <thead>
              <tr>
                <th></th>
                <th>Payment ID / Order ID</th>
                <th>Status</th>
                <th>Valor</th>
                <th>Método</th>
                <th>Pagador</th>
                <th>Data</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <Row key={p.mp_id} p={p} onSync={syncPayment} syncing={syncing} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
