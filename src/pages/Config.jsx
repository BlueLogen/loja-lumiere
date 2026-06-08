import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const MP_ORDERS_URL = 'https://mvtdqwedgdcxjfvhfrdp.supabase.co/functions/v1/mp-orders'
const WEBHOOK_URL   = 'https://mvtdqwedgdcxjfvhfrdp.supabase.co/functions/v1/mp-webhook'

const STATUS_COLOR = { approved:'#22c55e', rejected:'#ef4444', pending:'#f59e0b', in_process:'#3b82f6', cancelled:'#6b7280', refunded:'#8b5cf6' }
const STATUS_LABEL = { approved:'✅ Aprovado', rejected:'❌ Recusado', pending:'⏳ Pendente', in_process:'🔄 Em processo', cancelled:'🚫 Cancelado', refunded:'↩️ Estornado' }

const cp = (v) => navigator.clipboard.writeText(String(v)).catch(()=>{})
const D  = (d) => d ? new Date(d).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}) : null
const R  = (v) => v != null && v !== '' ? `R$ ${Number(v).toFixed(2).replace('.',',')}` : null

// Renderiza qualquer valor recursivamente
function Val({ v, depth = 0 }) {
  if (v === null || v === undefined) return <span style={{color:'#9ca3af',fontStyle:'italic'}}>null</span>
  if (typeof v === 'boolean') return <span style={{color: v ? '#4ade80' : '#f87171'}}>{String(v)}</span>
  if (typeof v === 'number') return <span style={{color:'#93c5fd'}}>{v}</span>
  if (typeof v === 'string') {
    if (v === '') return <span style={{color:'#9ca3af',fontStyle:'italic'}}>&quot;&quot;</span>
    return <span style={{color:'#fcd34d'}}>{v}</span>
  }
  if (Array.isArray(v)) {
    if (v.length === 0) return <span style={{color:'#9ca3af',fontStyle:'italic'}}>[]</span>
    return (
      <div style={{marginLeft: 12 + depth * 4}}>
        {v.map((item, i) => (
          <div key={i} style={{borderLeft:'1px solid #2a2a2a', paddingLeft:8, marginBottom:2}}>
            <span style={{color:'#9ca3af',fontSize:9}}>[{i}]</span>
            {typeof item === 'object' && item !== null
              ? <Fields obj={item} depth={depth+1} />
              : <> <Val v={item} depth={depth+1} /></>
            }
          </div>
        ))}
      </div>
    )
  }
  if (typeof v === 'object') {
    return <Fields obj={v} depth={depth+1} />
  }
  return <span>{String(v)}</span>
}

// Renderiza um objeto como lista de chave:valor
function Fields({ obj, depth = 0 }) {
  if (!obj || typeof obj !== 'object') return <Val v={obj} />
  return (
    <div style={{marginLeft: depth > 0 ? 10 : 0}}>
      {Object.entries(obj).map(([k, v]) => (
        <div key={k} className="cfg-field">
          <span className="cfg-field__key">{k}</span>
          <span className="cfg-field__val">
            <Val v={v} depth={depth} />
            {(typeof v === 'string' || typeof v === 'number') && v !== '' && v !== null && (
              <button className="cfg-copy" onClick={() => cp(v)} title="copiar">⎘</button>
            )}
          </span>
        </div>
      ))}
    </div>
  )
}

function PaymentRow({ p, onSync, syncing }) {
  const [open, setOpen] = useState(false)
  const status = p.status

  return (
    <>
      <tr className={`config-row${open?' config-row--open':''}`} onClick={() => setOpen(o=>!o)}>
        <td><span className="config-expand">{open?'▼':'▶'}</span></td>
        <td>
          <code className="config-id" onClick={e=>{e.stopPropagation();cp(p.id)}} title="Copiar ID">#{p.id}</code>
          {p.order?.id && <><br/><code className="config-id config-id--order" onClick={e=>{e.stopPropagation();cp(p.order.id)}} title="Copiar Order ID">🛒 {p.order.id}</code></>}
        </td>
        <td>
          <span className="config-status" style={{color:STATUS_COLOR[status]??'#888'}}>{STATUS_LABEL[status]??status}</span>
          {p.status_detail && <small style={{display:'block',color:'var(--gray)',fontSize:10}}>{p.status_detail}</small>}
          {p.live_mode === false && <span className="config-tag-test">TESTE</span>}
        </td>
        <td><strong>R$ {Number(p.transaction_amount).toFixed(2).replace('.',',')}</strong>
          {p.installments > 1 && <small style={{display:'block',color:'var(--gray)',fontSize:10}}>{p.installments}×</small>}
        </td>
        <td>
          <span className="config-method">{p.payment_method_id}</span>
          <small style={{display:'block',color:'var(--gray)',fontSize:10}}>{p.payment_type_id}</small>
        </td>
        <td className="config-email">{p.payer?.email??'—'}</td>
        <td className="config-date">{D(p.date_created)}</td>
        <td onClick={e=>e.stopPropagation()}>
          {p.preference_id && (
            <button className="btn btn--gold" style={{fontSize:11,padding:'4px 10px'}}
              onClick={()=>onSync(p)} disabled={syncing===p.id}>
              {syncing===p.id?'…':'↺ Sync'}
            </button>
          )}
        </td>
      </tr>

      {open && (
        <tr className="config-detail-row">
          <td colSpan={8}>
            <div style={{padding:'16px 20px', background:'#111', borderBottom:'1px solid var(--border)'}}>
              <p style={{fontSize:11,color:'#9ca3af',marginBottom:10}}>
                Objeto completo retornado pelo Mercado Pago — todos os campos
              </p>
              <Fields obj={p} />
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function Config() {
  const [payments,  setPayments]  = useState([])
  const [loading,   setLoading]   = useState(false)
  const [syncing,   setSyncing]   = useState(null)
  const [syncMsg,   setSyncMsg]   = useState('')
  const [error,     setError]     = useState('')
  const [copied,    setCopied]    = useState(false)

  async function fetchPayments() {
    setLoading(true); setError('')
    try {
      const res  = await fetch(`${MP_ORDERS_URL}?action=list&limit=50`)
      const data = await res.json()
      if (!res.ok) { setError(data.error||'Erro'); return }
      setPayments(data.payments??[])
    } catch(e) { setError('Erro: '+e.message) }
    finally { setLoading(false) }
  }

  async function syncPayment(p) {
    setSyncing(p.id); setSyncMsg('')
    try {
      const res  = await fetch(`${MP_ORDERS_URL}?action=sync`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ mp_id: p.id, preference_id: p.preference_id, status: p.status }),
      })
      const data = await res.json()
      setSyncMsg(data.ok ? `✅ Pedido atualizado → "${p.status}"` : `❌ ${data.error}`)
    } catch(e) { setSyncMsg('❌ '+e.message) }
    finally { setSyncing(null) }
  }

  useEffect(() => { fetchPayments() }, [])

  const total    = payments.length
  const approved = payments.filter(p=>p.status==='approved').length
  const pending  = payments.filter(p=>p.status==='pending').length
  const tests    = payments.filter(p=>p.live_mode===false).length

  return (
    <main className="config-page">
      <div className="config-header">
        <Link to="/admin" className="config-back">← Admin</Link>
        <h1>⚙️ Mercado Pago — Config</h1>
      </div>

      <div className="config-stats">
        {[{l:'Total',value:total},{l:'✅ Aprovados',value:approved,c:'#22c55e'},{l:'⏳ Pendentes',value:pending,c:'#f59e0b'},{l:'🧪 Testes',value:tests,c:'#3b82f6'}].map(s=>(
          <div key={s.l} className="config-stat"><strong style={{color:s.c??'var(--text)'}}>{s.value}</strong><span>{s.l}</span></div>
        ))}
      </div>

      <section className="config-section">
        <h2>🔗 Webhook</h2>
        <div className="config-webhook-row">
          <code className="config-webhook-url">{WEBHOOK_URL}</code>
          <button className="btn btn--gold" onClick={()=>{cp(WEBHOOK_URL);setCopied(true);setTimeout(()=>setCopied(false),2000)}} style={{flexShrink:0}}>
            {copied?'✓ Copiado!':'Copiar'}
          </button>
        </div>
      </section>

      <section className="config-section">
        <div className="config-section-header">
          <h2>💳 Pagamentos ({total})</h2>
          <button className="btn btn--ghost" onClick={fetchPayments} disabled={loading}>{loading?'⏳':'🔄 Atualizar'}</button>
        </div>
        {error   && <p className="config-error">{error}</p>}
        {syncMsg && <p className="config-sync-msg">{syncMsg}</p>}
        {!loading && total===0 && <p className="config-empty">Nenhum pagamento encontrado.</p>}
        <p className="config-desc" style={{marginBottom:8}}>Clique em <strong>▶</strong> para ver o objeto completo do MP.</p>
        <div className="config-table-wrap">
          <table className="config-table">
            <thead>
              <tr><th></th><th>Payment ID / Order ID</th><th>Status</th><th>Valor</th><th>Método</th><th>Pagador</th><th>Data</th><th>Ação</th></tr>
            </thead>
            <tbody>
              {payments.map(p=><PaymentRow key={p.id} p={p} onSync={syncPayment} syncing={syncing}/>)}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
