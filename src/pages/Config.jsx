import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const MP_ORDERS_URL = 'https://mvtdqwedgdcxjfvhfrdp.supabase.co/functions/v1/mp-orders'
const WEBHOOK_URL   = 'https://mvtdqwedgdcxjfvhfrdp.supabase.co/functions/v1/mp-webhook'

const STATUS_COLOR = { approved:'#22c55e', rejected:'#ef4444', pending:'#f59e0b', in_process:'#3b82f6', cancelled:'#6b7280', refunded:'#8b5cf6' }
const STATUS_LABEL = { approved:'✅ Aprovado', rejected:'❌ Recusado', pending:'⏳ Pendente', in_process:'🔄 Em processo', cancelled:'🚫 Cancelado', refunded:'↩️ Estornado' }

const cp = (v) => navigator.clipboard?.writeText(String(v)).catch(()=>{})
const D  = (d) => d ? new Date(d).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'}) : '—'
const R  = (v) => v != null && v !== '' ? `R$ ${Number(v).toFixed(2).replace('.',',')}` : null

// ── Val / Fields (JSON viewer) ──────────────────────────────
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
  if (typeof v === 'object') return <Fields obj={v} depth={depth+1} />
  return <span>{String(v)}</span>
}

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

// ── PaymentRow (MP raw) ─────────────────────────────────────
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

// ── OrderRow (pedidos Supabase) ─────────────────────────────
function OrderRow({ o }) {
  const [open, setOpen] = useState(false)
  const status = o.payment_status ?? 'pending'
  const items  = Array.isArray(o.items) ? o.items : []

  return (
    <>
      <tr className={`config-row${open?' config-row--open':''}`} onClick={() => setOpen(s=>!s)}>
        <td><span className="config-expand">{open?'▼':'▶'}</span></td>
        <td>
          <code className="config-id" onClick={e=>{e.stopPropagation();cp(o.order_number)}} title="Copiar nº pedido">
            {o.order_number}
          </code>
        </td>
        <td>
          <span className="config-status" style={{color:STATUS_COLOR[status]??'#888'}}>
            {STATUS_LABEL[status]??status}
          </span>
        </td>
        <td>
          <strong style={{fontSize:12}}>{o.customer_name}</strong>
          <small style={{display:'block',color:'var(--gray)',fontSize:10}}>{o.customer_email}</small>
        </td>
        <td><strong>R$ {Number(o.total).toFixed(2).replace('.',',')}</strong></td>
        <td className="config-date">{D(o.created_at)}</td>
      </tr>

      {open && (
        <tr className="config-detail-row">
          <td colSpan={6}>
            <div className="order-detail-panel">

              {/* Cliente */}
              <div className="order-detail-group">
                <h4>👤 Cliente</h4>
                <div className="order-detail-grid">
                  <div className="order-detail-field"><span>Nome</span><strong>{o.customer_name}</strong></div>
                  <div className="order-detail-field"><span>Email</span>
                    <strong style={{cursor:'pointer'}} onClick={()=>cp(o.customer_email)}>{o.customer_email} <small>⎘</small></strong>
                  </div>
                  <div className="order-detail-field"><span>Telefone</span><strong>{o.customer_phone||'—'}</strong></div>
                  <div className="order-detail-field"><span>CPF</span><strong>{o.customer_cpf||'—'}</strong></div>
                </div>
              </div>

              {/* Endereço */}
              <div className="order-detail-group">
                <h4>📍 Endereço de entrega</h4>
                <div className="order-detail-address">
                  {o.address_street}, {o.address_number}
                  {o.address_complement ? ` — ${o.address_complement}` : ''}
                  <br/>
                  {o.address_neighborhood} · {o.address_city}/{o.address_state} · CEP {o.address_cep}
                </div>
              </div>

              {/* Itens */}
              <div className="order-detail-group">
                <h4>🛍️ Itens comprados</h4>
                <div className="order-items-list">
                  {items.length === 0
                    ? <span style={{color:'var(--gray)',fontSize:12}}>Sem itens</span>
                    : items.map((item, i) => (
                      <div key={i} className="order-item-row">
                        <span className="order-item-qty">{item.qty}×</span>
                        <span className="order-item-name">{item.name}</span>
                        <span className="order-item-price">R$ {(Number(item.price) * Number(item.qty)).toFixed(2).replace('.',',')}</span>
                      </div>
                    ))
                  }
                </div>
              </div>

              {/* Valores + Pagamento */}
              <div className="order-detail-group">
                <h4>💰 Valores e pagamento</h4>
                <div className="order-totals">
                  <div className="order-total-row"><span>Subtotal</span><span>{R(o.subtotal)}</span></div>
                  <div className="order-total-row"><span>Frete</span><span>{o.shipping > 0 ? R(o.shipping) : <span style={{color:'#4ade80'}}>Grátis</span>}</span></div>
                  <div className="order-total-row order-total-row--total"><span>Total</span><strong>{R(o.total)}</strong></div>
                  <div className="order-total-row" style={{marginTop:8,paddingTop:8,borderTop:'1px solid var(--border)'}}>
                    <span>Método</span>
                    <span style={{textTransform:'capitalize'}}>{o.payment_method||'—'}</span>
                  </div>
                  {o.payment_mp_id && (
                    <div className="order-total-row">
                      <span>ID MP</span>
                      <code className="config-id" style={{fontSize:11}} onClick={()=>cp(o.payment_mp_id)}>
                        {o.payment_mp_id} <small>⎘</small>
                      </code>
                    </div>
                  )}
                  <div className="order-total-row">
                    <span>Estoque debitado</span>
                    <span style={{color: o.stock_decremented ? '#4ade80' : '#f59e0b'}}>
                      {o.stock_decremented ? '✅ Sim' : '⏳ Não'}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ── MAIN ────────────────────────────────────────────────────
export default function Config() {
  // MP Payments
  const [payments,  setPayments]  = useState([])
  const [loading,   setLoading]   = useState(false)
  const [syncing,   setSyncing]   = useState(null)
  const [syncMsg,   setSyncMsg]   = useState('')
  const [error,     setError]     = useState('')
  const [copied,    setCopied]    = useState(false)

  // Orders
  const [orders,       setOrders]       = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError,   setOrdersError]   = useState('')

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

  async function fetchOrders() {
    setOrdersLoading(true); setOrdersError('')
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw new Error(error.message)
      setOrders(data ?? [])
    } catch(e) { setOrdersError('Erro ao carregar pedidos: ' + e.message) }
    finally { setOrdersLoading(false) }
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
      fetchOrders() // atualiza a lista de pedidos após sync
    } catch(e) { setSyncMsg('❌ '+e.message) }
    finally { setSyncing(null) }
  }

  useEffect(() => { fetchPayments(); fetchOrders() }, [])

  const total    = payments.length
  const approved = payments.filter(p=>p.status==='approved').length
  const pending  = payments.filter(p=>p.status==='pending').length
  const tests    = payments.filter(p=>p.live_mode===false).length

  const ordersApproved = orders.filter(o=>o.payment_status==='approved').length
  const ordersPending  = orders.filter(o=>o.payment_status==='pending').length
  const ordersRevenue  = orders
    .filter(o=>o.payment_status==='approved')
    .reduce((s,o) => s + Number(o.total||0), 0)

  return (
    <main className="config-page">
      <div className="config-header">
        <Link to="/admin" className="config-back">← Admin</Link>
        <h1>⚙️ Painel — Config</h1>
      </div>

      {/* Stats */}
      <div className="config-stats">
        {[
          {l:'Pedidos',      value: orders.length},
          {l:'✅ Aprovados', value: ordersApproved, c:'#22c55e'},
          {l:'⏳ Pendentes', value: ordersPending,  c:'#f59e0b'},
          {l:'💰 Receita',   value: `R$ ${ordersRevenue.toFixed(2).replace('.',',')}`, c:'#93c5fd'},
        ].map(s=>(
          <div key={s.l} className="config-stat">
            <strong style={{color:s.c??'var(--text)', fontSize: typeof s.value === 'string' ? '1.1rem' : undefined}}>
              {s.value}
            </strong>
            <span>{s.l}</span>
          </div>
        ))}
      </div>

      {/* ── PEDIDOS ── */}
      <section className="config-section">
        <div className="config-section-header">
          <h2>📦 Pedidos ({orders.length})</h2>
          <button className="btn btn--ghost" onClick={fetchOrders} disabled={ordersLoading}>
            {ordersLoading ? '⏳' : '🔄 Atualizar'}
          </button>
        </div>
        {ordersError && <p className="config-error">{ordersError}</p>}
        {!ordersLoading && orders.length === 0 && !ordersError && (
          <p className="config-empty">Nenhum pedido encontrado.</p>
        )}
        <p className="config-desc" style={{marginBottom:8}}>
          Clique em <strong>▶</strong> para ver cliente, endereço, itens e valores.
        </p>
        <div className="config-table-wrap">
          <table className="config-table">
            <thead>
              <tr>
                <th></th>
                <th>Nº Pedido</th>
                <th>Status</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => <OrderRow key={o.id ?? o.order_number} o={o} />)}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── WEBHOOK ── */}
      <section className="config-section">
        <h2>🔗 Webhook MP</h2>
        <div className="config-webhook-row">
          <code className="config-webhook-url">{WEBHOOK_URL}</code>
          <button className="btn btn--gold"
            onClick={()=>{cp(WEBHOOK_URL);setCopied(true);setTimeout(()=>setCopied(false),2000)}}
            style={{flexShrink:0}}>
            {copied?'✓ Copiado!':'Copiar'}
          </button>
        </div>
      </section>

      {/* ── PAGAMENTOS MP (raw) ── */}
      <section className="config-section">
        <div className="config-section-header">
          <h2>💳 Pagamentos MP ({total})</h2>
          <button className="btn btn--ghost" onClick={fetchPayments} disabled={loading}>{loading?'⏳':'🔄 Atualizar'}</button>
        </div>
        {error   && <p className="config-error">{error}</p>}
        {syncMsg && <p className="config-sync-msg">{syncMsg}</p>}
        {!loading && total===0 && <p className="config-empty">Nenhum pagamento encontrado.</p>}
        <p className="config-desc" style={{marginBottom:8}}>Dados brutos do Mercado Pago. Clique em <strong>▶</strong> para ver o objeto completo.</p>
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
