import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { supabase } from '../lib/supabase'

const MP_PUBLIC_KEY  = 'APP_USR-40d706cd-153e-4dd8-9953-20a1315ca390'
const MP_PAYMENT_URL = 'https://mvtdqwedgdcxjfvhfrdp.supabase.co/functions/v1/mp-payment'

const STEPS = ['Entrega', 'Pagamento', 'Confirmação']

// ── Explosão de emojis ─────────────────────────────────────
const BURST_EMOJIS = ['❤️','💛','🧡','💜','💕','💖','💗','💝','💘','🎉','✨','💫','🌟','❤️‍🔥','💓','💞','🩷','💚','🤍','😍','🥰','💎','⭐','🎊']

function spawnEmojiExplosion(originEl, onDone) {
  const rect = originEl.getBoundingClientRect()
  const cx   = rect.left + rect.width  / 2
  const cy   = rect.top  + rect.height / 2
  const count = 40

  const wrap = document.createElement('div')
  wrap.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;'
  document.body.appendChild(wrap)

  for (let i = 0; i < count; i++) {
    const el    = document.createElement('span')
    const angle = (Math.PI * 2 * i / count) + (Math.random() - 0.5) * 0.7
    const dist  = 100 + Math.random() * 220
    const dx    = Math.cos(angle) * dist
    const dy    = Math.sin(angle) * dist - 80
    const size  = 20 + Math.random() * 22
    const dur   = 650 + Math.random() * 500
    const delay = Math.random() * 120

    el.textContent = BURST_EMOJIS[Math.floor(Math.random() * BURST_EMOJIS.length)]
    el.style.cssText = `
      position:absolute;
      left:${cx}px; top:${cy}px;
      font-size:${size}px;
      line-height:1;
      user-select:none;
      animation: emojiBurst ${dur}ms cubic-bezier(.2,.6,.35,1) ${delay}ms forwards;
      --ex:${dx}px; --ey:${dy}px;
    `
    wrap.appendChild(el)
  }

  originEl.style.transition = 'transform .15s'
  originEl.style.transform  = 'scale(1.08)'
  setTimeout(() => { originEl.style.transform = 'scale(1)' }, 150)
  setTimeout(() => { wrap.remove(); onDone() }, 1100)
}

// ── Ícones por modalidade ──────────────────────────────────
const SERVICE_ICON = {
  'PAC':         '📦',
  'SEDEX':       '⚡',
  'Mini Envios': '📬',
  '.Package':    '📦',
  'Impresso':    '📮',
}
function serviceIcon(name = '') {
  for (const [key, icon] of Object.entries(SERVICE_ICON)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return icon
  }
  return '🚚'
}

// ── Normaliza resposta da Melhor Envio ─────────────────────
function normalizeME(data, subtotal) {
  const valid = (Array.isArray(data) ? data : [])
    .filter(s => !s.error && s.price != null)
    .sort((a, b) => Number(a.price) - Number(b.price))

  const opts = valid.map(s => ({
    id:      String(s.id),
    icon:    serviceIcon(s.name),
    name:    s.name,
    carrier: s.company?.name || 'Correios',
    price:   Number(s.custom_price ?? s.price),
    days:    s.custom_delivery_range
               ? `${s.custom_delivery_range.min} a ${s.custom_delivery_range.max} dias úteis`
               : `${s.delivery_time} dias úteis`,
    logo:    s.company?.picture || null,
  }))

  // Frete grátis no PAC quando subtotal >= 299
  if (subtotal >= 299 && opts.length > 0) {
    const pac = opts.find(o => o.name.toLowerCase().includes('pac')) || opts[0]
    opts.unshift({
      ...pac,
      id:    'gratis',
      icon:  '🎉',
      name:  `${pac.name} Grátis`,
      price: 0,
      free:  true,
    })
  }

  return opts
}

// ── Fallback estático (caso API falhe) ─────────────────────
const UF_TIER = {
  SP:1, MG:2, RJ:2, ES:2, PR:2, SC:2, RS:2,
  GO:3, MT:3, MS:3, DF:3,
  BA:4, PE:4, CE:4, MA:4, PB:4, RN:4, AL:4, SE:4, PI:4,
  PA:5, AM:5, TO:5, RO:5, AC:6, RR:6, AP:6,
}
const FRETE_TIERS = [
  { pac:[12.90,3,5],  mini:[15.90,2,4],  sedex:[22.90,1,2]  },
  { pac:[15.90,4,7],  mini:[19.90,3,5],  sedex:[27.90,1,3]  },
  { pac:[19.90,5,8],  mini:[23.90,4,6],  sedex:[32.90,2,4]  },
  { pac:[22.90,6,10], mini:[27.90,5,8],  sedex:[37.90,2,5]  },
  { pac:[26.90,7,12], mini:[31.90,6,9],  sedex:[42.90,3,6]  },
  { pac:[31.90,8,15], mini:[38.90,7,11], sedex:[52.90,4,8]  },
]
function staticFreteOptions(uf, subtotal) {
  const t = FRETE_TIERS[(UF_TIER[uf] ?? 4) - 1]
  const opts = [
    { id:'pac',   icon:'📦', name:'PAC',         carrier:'Correios', price:t.pac[0],   days:`${t.pac[1]} a ${t.pac[2]} dias úteis`   },
    { id:'mini',  icon:'📬', name:'Mini Envios', carrier:'Correios', price:t.mini[0],  days:`${t.mini[1]} a ${t.mini[2]} dias úteis`  },
    { id:'sedex', icon:'⚡', name:'SEDEX',       carrier:'Correios', price:t.sedex[0], days:`${t.sedex[1]} a ${t.sedex[2]} dias úteis` },
  ]
  if (subtotal >= 299) {
    opts.unshift({ id:'gratis', icon:'🎉', name:'PAC Grátis', carrier:'Correios', price:0,
      days:`${t.pac[1]} a ${t.pac[2]} dias úteis`, free:true })
  }
  return opts
}

// ── Máscaras ──────────────────────────────────────────────
function maskCep(v) {
  const d = v.replace(/\D/g, '').slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}
function maskCpf(v) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`
}
function maskPhone(v) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : d
  if (d.length <= 7) return `(${d.slice(0,2)}) ${d.slice(2)}`
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
}
function maskCard(v) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}
function maskExp(v) {
  const d = v.replace(/\D/g, '').slice(0, 4)
  return d.length > 2 ? `${d.slice(0,2)}/${d.slice(2)}` : d
}

// ── StepBar ───────────────────────────────────────────────
function StepBar({ current }) {
  return (
    <div className="checkout-steps">
      {STEPS.map((label, i) => (
        <div key={label} className={`checkout-step${i <= current ? ' active' : ''}${i < current ? ' done' : ''}`}>
          <div className="checkout-step__circle">
            {i < current ? '✓' : i + 1}
          </div>
          <span>{label}</span>
          {i < STEPS.length - 1 && <div className="checkout-step__line" />}
        </div>
      ))}
    </div>
  )
}

// ── OrderSummary ──────────────────────────────────────────
function OrderSummary({ items, subtotal, selectedShipping }) {
  const freteValue = selectedShipping ? selectedShipping.price : null
  const finalTotal = freteValue !== null ? subtotal + freteValue : null

  return (
    <div className="checkout-summary">
      <h3 className="checkout-summary__title">Resumo do pedido</h3>
      <div className="checkout-summary__items">
        {items.map(item => (
          <div key={item.id} className="checkout-summary__item">
            <div className="checkout-summary__img">
              <img src={item.image} alt={item.name} />
              <span className="checkout-summary__qty">{item.qty}</span>
            </div>
            <div className="checkout-summary__info">
              <p>{item.name}</p>
              {item.selectedSize && <span>Tamanho: {item.selectedSize}</span>}
            </div>
            <strong>R$ {(item.price * item.qty).toFixed(2).replace('.', ',')}</strong>
          </div>
        ))}
      </div>
      <div className="checkout-summary__totals">
        <div className="checkout-summary__row">
          <span>Subtotal</span>
          <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
        </div>
        <div className="checkout-summary__row">
          <span>
            Frete
            {selectedShipping && (
              <small className="summary-carrier"> · {selectedShipping.name}</small>
            )}
          </span>
          <span className={selectedShipping?.free ? 'free-shipping' : freteValue === null ? 'frete-pending' : ''}>
            {selectedShipping
              ? (selectedShipping.free
                  ? 'Grátis 🎉'
                  : `R$ ${freteValue.toFixed(2).replace('.', ',')}`)
              : 'Selecione o frete'}
          </span>
        </div>
        {selectedShipping && (
          <div className="checkout-summary__row">
            <small className="summary-days">⏱ {selectedShipping.days}</small>
          </div>
        )}
        <div className="checkout-summary__row checkout-summary__row--total">
          <span>Total</span>
          <strong>
            {finalTotal !== null
              ? `R$ ${finalTotal.toFixed(2).replace('.', ',')}`
              : '—'}
          </strong>
        </div>
      </div>
    </div>
  )
}

// ── STEP 1: ENTREGA ───────────────────────────────────────
function StepEntrega({ data, onChange, onBulkChange, onNext, subtotal, itemCount,
                       selectedShipping, onSelectShipping, freteOpts, freteLoading }) {
  const [cepLoading, setCepLoading] = useState(false)
  const [cepError,   setCepError]   = useState('')
  const [freteError, setFreteError] = useState('')
  const [bursting,   setBursting]   = useState(false)
  const btnRef = useRef(null)

  async function buscarCep(raw) {
    const digits = raw.replace(/\D/g, '')
    if (digits.length !== 8) return
    setCepLoading(true)
    setCepError('')
    try {
      const res  = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const json = await res.json()
      if (json.erro) {
        setCepError('CEP não encontrado. Verifique e tente novamente.')
      } else {
        onBulkChange({
          cep:    raw,
          rua:    json.logradouro || '',
          bairro: json.bairro     || '',
          cidade: json.localidade || '',
          estado: json.uf         || '',
        })
        onSelectShipping(null)
      }
    } catch {
      setCepError('Erro ao consultar CEP. Verifique sua conexão.')
    } finally {
      setCepLoading(false)
    }
  }

  function handleCepChange(e) {
    const masked = maskCep(e.target.value)
    onChange('cep', masked)
    if (masked.replace(/\D/g, '').length === 8) buscarCep(masked)
  }

  function handleStateChange(e) {
    onChange('estado', e.target.value)
    onSelectShipping(null)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!selectedShipping) {
      setFreteError('Selecione uma opção de frete para continuar.')
      return
    }
    setFreteError('')
    if (bursting) return
    setBursting(true)
    spawnEmojiExplosion(btnRef.current, () => {
      setBursting(false)
      onNext()
    })
  }

  return (
    <form className="checkout-form" onSubmit={handleSubmit}>
      <div className="checkout-form__section">
        <h3>Dados pessoais</h3>
        <div className="checkout-field-row">
          <div className="checkout-field">
            <label>Nome completo *</label>
            <input required placeholder="Seu nome" value={data.nome}
              onChange={e => onChange('nome', e.target.value)} />
          </div>
          <div className="checkout-field">
            <label>CPF *</label>
            <input required placeholder="000.000.000-00" value={data.cpf}
              onChange={e => onChange('cpf', maskCpf(e.target.value))} />
          </div>
        </div>
        <div className="checkout-field-row">
          <div className="checkout-field">
            <label>E-mail *</label>
            <input required type="email" placeholder="seu@email.com" value={data.email}
              onChange={e => onChange('email', e.target.value)} />
          </div>
          <div className="checkout-field">
            <label>Telefone *</label>
            <input required placeholder="(00) 00000-0000" value={data.telefone}
              onChange={e => onChange('telefone', maskPhone(e.target.value))} />
          </div>
        </div>
      </div>

      <div className="checkout-form__section">
        <h3>Endereço de entrega</h3>

        <div className="checkout-field-row">
          <div className="checkout-field checkout-field--sm">
            <label>CEP *</label>
            <div className="cep-wrapper">
              <input
                required
                placeholder="00000-000"
                value={data.cep}
                onChange={handleCepChange}
                maxLength={9}
                className={cepError ? 'input--error' : ''}
              />
              {cepLoading && <span className="cep-spinner" />}
            </div>
            {cepError && <span className="field-error">{cepError}</span>}
          </div>
          <div className="checkout-field checkout-field--lg">
            <label>Rua / Logradouro *</label>
            <input required placeholder="Rua das Flores" value={data.rua}
              onChange={e => onChange('rua', e.target.value)} />
          </div>
        </div>

        <div className="checkout-field-row">
          <div className="checkout-field checkout-field--sm">
            <label>Número *</label>
            <input required placeholder="123" value={data.numero}
              onChange={e => onChange('numero', e.target.value)} />
          </div>
          <div className="checkout-field">
            <label>Complemento</label>
            <input placeholder="Apto, bloco..." value={data.complemento}
              onChange={e => onChange('complemento', e.target.value)} />
          </div>
          <div className="checkout-field">
            <label>Bairro *</label>
            <input required placeholder="Seu bairro" value={data.bairro}
              onChange={e => onChange('bairro', e.target.value)} />
          </div>
        </div>

        <div className="checkout-field-row">
          <div className="checkout-field">
            <label>Cidade *</label>
            <input required placeholder="Sua cidade" value={data.cidade}
              onChange={e => onChange('cidade', e.target.value)} />
          </div>
          <div className="checkout-field checkout-field--sm">
            <label>Estado *</label>
            <select required value={data.estado} onChange={handleStateChange}>
              <option value="">UF</option>
              {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Opções de frete */}
      {data.estado && (
        <div className="checkout-form__section">
          <h3>Opções de entrega</h3>
          <p className="frete-subtitle">
            Envio para {data.cidade || data.estado}/{data.estado} · CEP {data.cep}
          </p>

          {freteLoading ? (
            <div className="frete-loading">
              <span className="frete-loading__spinner" />
              <span>Calculando frete com Melhor Envio…</span>
            </div>
          ) : (
            <div className="frete-options">
              {freteOpts.map(opt => (
                <label
                  key={opt.id}
                  className={`frete-option${selectedShipping?.id === opt.id ? ' frete-option--active' : ''}${opt.free ? ' frete-option--free' : ''}`}
                >
                  <input
                    type="radio"
                    name="frete"
                    value={opt.id}
                    checked={selectedShipping?.id === opt.id}
                    onChange={() => { onSelectShipping(opt); setFreteError('') }}
                  />
                  <span className="frete-option__icon">
                    {opt.logo
                      ? <img src={opt.logo} alt={opt.carrier} className="frete-option__logo" />
                      : opt.icon}
                  </span>
                  <span className="frete-option__info">
                    <strong>{opt.name}</strong>
                    <small>{opt.carrier} · {opt.days}</small>
                  </span>
                  <span className={`frete-option__price${opt.free ? ' free-shipping' : ''}`}>
                    {opt.free
                      ? <><s className="frete-option__crossed">
                          R$ {freteOpts.find(o => !o.free && o.name.toLowerCase().includes('pac'))?.price.toFixed(2).replace('.', ',') || '—'}
                        </s> Grátis</>
                      : `R$ ${opt.price.toFixed(2).replace('.', ',')}`
                    }
                  </span>
                </label>
              ))}
            </div>
          )}

          {freteError && <span className="field-error" style={{ display:'block', marginTop:8 }}>{freteError}</span>}
        </div>
      )}

      <button
        ref={btnRef}
        type="submit"
        className={`btn btn--gold btn--full btn--lg${bursting ? ' btn--bursting' : ''}`}
        disabled={cepLoading || bursting || freteLoading}
      >
        {cepLoading     ? 'Buscando CEP…'
          : freteLoading  ? 'Calculando frete…'
          : bursting      ? '🎉 Ótimo!'
          : 'Continuar para pagamento →'}
      </button>
    </form>
  )
}

// ── Mapeia detalhe de rejeição do MP para mensagem amigável ─
function mpRejectMsg(detail = '') {
  const map = {
    cc_rejected_insufficient_amount: 'Saldo insuficiente no cartão.',
    cc_rejected_bad_filled_card_number: 'Número do cartão inválido.',
    cc_rejected_bad_filled_security_code: 'CVV incorreto.',
    cc_rejected_bad_filled_date: 'Data de validade inválida.',
    cc_rejected_high_risk: 'Pagamento negado pela operadora. Tente outro cartão.',
    cc_rejected_blacklist: 'Cartão não autorizado. Tente outro.',
    cc_rejected_call_for_authorize: 'Ligue para a operadora para autorizar.',
    cc_rejected_duplicated_payment: 'Pagamento duplicado. Aguarde alguns minutos.',
  }
  return map[detail] || 'Pagamento não aprovado. Verifique os dados e tente novamente.'
}

// ── STEP 2: PAGAMENTO — Checkout Transparente ─────────────
function StepPagamento({ entrega, onApproved, onPending, onBack, subtotal, frete }) {
  const finalTotal = subtotal + (frete ?? 0)
  const [metodo,     setMetodo]     = useState('')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const cardFormRef  = useRef(null)
  const mpRef        = useRef(null)

  // Monta o cardForm do MP quando cartão for selecionado
  useEffect(() => {
    if (metodo !== 'cartao') {
      cardFormRef.current?.unmount?.()
      cardFormRef.current = null
      return
    }

    let cancelled = false
    const mount = () => {
      if (cancelled || cardFormRef.current) return
      if (!window.MercadoPago) { setTimeout(mount, 250); return }

      try {
        mpRef.current = mpRef.current ?? new window.MercadoPago(MP_PUBLIC_KEY, { locale: 'pt-BR' })

        cardFormRef.current = mpRef.current.cardForm({
          amount: finalTotal.toFixed(2),
          autoMount: true,
          form: {
            id: 'mp-card-form',
            cardholderName:       { id: 'mp-cardholderName',     placeholder: 'Nome como no cartão' },
            cardNumber:           { id: 'mp-cardNumber',         placeholder: '0000 0000 0000 0000' },
            expirationDate:       { id: 'mp-expirationDate',     placeholder: 'MM/AA' },
            securityCode:         { id: 'mp-securityCode',       placeholder: 'CVV' },
            installments:         { id: 'mp-installments' },
            identificationType:   { id: 'mp-identificationType' },
            identificationNumber: { id: 'mp-identificationNumber', placeholder: '000.000.000-00',
                                    value: entrega.cpf.replace(/\D/g, '') },
            issuer:               { id: 'mp-issuer' },
          },
          callbacks: {
            onFormMounted: err => { if (err) console.error('[MP] mount:', err) },
            onSubmit: async (e) => {
              e.preventDefault()
              const d = cardFormRef.current.getCardFormData()
              if (!d.token) { setError('Verifique os dados do cartão.'); return }
              await processPayment({
                token:              d.token,
                payment_method_id:  d.paymentMethodId,
                installments:       parseInt(d.installments) || 1,
                transaction_amount: finalTotal,
                description:        'Pedido Basic & Bijus',
                payer: {
                  email:      entrega.email,
                  first_name: entrega.nome.split(' ')[0]  || '',
                  last_name:  entrega.nome.split(' ').slice(1).join(' ') || '',
                  identification: {
                    type:   d.identificationType  || 'CPF',
                    number: d.identificationNumber || entrega.cpf.replace(/\D/g, ''),
                  },
                },
              })
            },
            onFetching: () => setLoading(true),
            onCardTokenChange: () => setLoading(false),
          },
        })
      } catch (err) {
        console.error('[MP] cardForm init:', err)
        setError('Erro ao carregar formulário. Recarregue a página.')
      }
    }

    const t = setTimeout(mount, 80)
    return () => {
      cancelled = true
      clearTimeout(t)
      cardFormRef.current?.unmount?.()
      cardFormRef.current = null
    }
  }, [metodo]) // eslint-disable-line

  async function processPayment(body) {
    setLoading(true)
    setError('')
    try {
      const res    = await fetch(MP_PAYMENT_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const result = await res.json()

      if (!res.ok) {
        const msg = result.error || result.message || ''
        setError(
          (msg === 'unauthorized' || res.status === 401)
            ? '⚠️ Token do Mercado Pago inválido ou expirado. Gere um novo Access Token em mercadopago.com.br/developers'
            : msg || `Erro ${res.status}.`
        )
        return
      }

      if (result.status === 'approved') {
        onApproved(result)
      } else if (['pending', 'in_process', 'authorized'].includes(result.status)) {
        onPending(result)
      } else {
        setError(mpRejectMsg(result.status_detail))
      }
    } catch (err) {
      setError('Erro de conexão: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function pagarDireto(pmId) {
    await processPayment({
      payment_method_id:  pmId,
      transaction_amount: finalTotal,
      description:        'Pedido Basic & Bijus',
      payer: {
        email:      entrega.email,
        first_name: entrega.nome.split(' ')[0]  || '',
        last_name:  entrega.nome.split(' ').slice(1).join(' ') || '',
        identification: { type: 'CPF', number: entrega.cpf.replace(/\D/g, '') },
      },
    })
  }

  return (
    <div className="checkout-form">

      {/* Seletor de método */}
      <div className="checkout-form__section">
        <h3>Forma de pagamento</h3>
        <div className="payment-methods">
          {[
            { id: 'cartao', icon: '💳', label: 'Cartão de crédito / débito', sub: 'até 3× sem juros' },
            { id: 'pix',    icon: '⚡', label: 'PIX',                        sub: 'aprovação imediata' },
            { id: 'boleto', icon: '📄', label: 'Boleto bancário',             sub: 'vence em 3 dias úteis' },
          ].map(m => (
            <label key={m.id} className={`payment-option${metodo === m.id ? ' active' : ''}`}>
              <input type="radio" name="metodo" value={m.id}
                checked={metodo === m.id}
                onChange={() => { setMetodo(m.id); setError('') }} />
              <span className="payment-option__icon">{m.icon}</span>
              <span className="payment-option__text">
                <strong>{m.label}</strong>
                <small>{m.sub}</small>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* ── Cartão ── */}
      {metodo === 'cartao' && (
        <div className="checkout-form__section">
          <form id="mp-card-form" autoComplete="off">
            <div className="checkout-field">
              <label>Número do cartão</label>
              <div id="mp-cardNumber" className="mp-iframe-field" />
            </div>
            <div className="checkout-field">
              <label>Nome no cartão</label>
              <div id="mp-cardholderName" className="mp-iframe-field" />
            </div>
            <div className="checkout-field-row">
              <div className="checkout-field">
                <label>Validade</label>
                <div id="mp-expirationDate" className="mp-iframe-field" />
              </div>
              <div className="checkout-field checkout-field--sm">
                <label>CVV</label>
                <div id="mp-securityCode" className="mp-iframe-field" />
              </div>
            </div>
            <div className="checkout-field">
              <label>CPF do titular</label>
              <div id="mp-identificationNumber" className="mp-iframe-field" />
            </div>
            <div className="checkout-field">
              <label>Parcelas</label>
              <select id="mp-installments" className="mp-installments-select" />
            </div>
            {/* Campos ocultos que o MP lê */}
            <select id="mp-identificationType" style={{ display:'none' }} />
            <select id="mp-issuer"             style={{ display:'none' }} />

            {error && <p className="field-error mp-field-error">{error}</p>}
            <button
              type="submit"
              className="btn btn--gold btn--full btn--lg"
              style={{ marginTop: 16 }}
              disabled={loading}
            >
              {loading ? 'Processando…' : `🔒 Pagar R$ ${finalTotal.toFixed(2).replace('.', ',')}`}
            </button>
          </form>
        </div>
      )}

      {/* ── PIX ── */}
      {metodo === 'pix' && (
        <div className="checkout-form__section">
          <div className="tp-info-box">
            <span className="tp-info-box__icon">⚡</span>
            <div>
              <p><strong>Pagamento via PIX</strong></p>
              <p className="pix-note">Após confirmar, exibiremos o QR Code para você pagar no app do banco.</p>
              <p className="pix-note" style={{ marginTop:6 }}>
                Pagador: <strong>{entrega.nome}</strong> · CPF: <strong>{entrega.cpf}</strong>
              </p>
            </div>
          </div>
          {error && <p className="field-error mp-field-error">{error}</p>}
          <button
            className="btn btn--gold btn--full btn--lg"
            style={{ marginTop: 16 }}
            onClick={() => pagarDireto('pix')}
            disabled={loading}
          >
            {loading ? 'Gerando PIX…' : `⚡ Gerar QR Code PIX — R$ ${finalTotal.toFixed(2).replace('.', ',')}`}
          </button>
        </div>
      )}

      {/* ── Boleto ── */}
      {metodo === 'boleto' && (
        <div className="checkout-form__section">
          <div className="tp-info-box">
            <span className="tp-info-box__icon">📄</span>
            <div>
              <p><strong>Boleto bancário</strong></p>
              <p className="pix-note">Gerado na hora, válido por 3 dias úteis.</p>
              <p className="pix-note" style={{ marginTop:6 }}>
                Pagador: <strong>{entrega.nome}</strong> · CPF: <strong>{entrega.cpf}</strong>
              </p>
            </div>
          </div>
          {error && <p className="field-error mp-field-error">{error}</p>}
          <button
            className="btn btn--gold btn--full btn--lg"
            style={{ marginTop: 16 }}
            onClick={() => pagarDireto('bolbradesco')}
            disabled={loading}
          >
            {loading ? 'Gerando boleto…' : `📄 Gerar Boleto — R$ ${finalTotal.toFixed(2).replace('.', ',')}`}
          </button>
        </div>
      )}

      {!metodo && (
        <p className="pix-note" style={{ textAlign:'center', padding:'16px 0' }}>
          ☝️ Selecione uma forma de pagamento acima
        </p>
      )}

      <div className="checkout-nav">
        <button type="button" className="btn btn--ghost" onClick={onBack} disabled={loading}>
          ← Voltar
        </button>
      </div>
    </div>
  )
}

// Mapeia IDs do MP para nomes legíveis
function mpMethodLabel(id = '') {
  const map = {
    visa: 'Visa', master: 'Mastercard', elo: 'Elo', hipercard: 'Hipercard',
    amex: 'American Express', pix: 'PIX', bolbradesco: 'Boleto Bradesco',
    pec: 'Boleto', paymentez: 'Boleto',
  }
  return map[id] || id.toUpperCase()
}

// ── STEP 3: CONFIRMAÇÃO ───────────────────────────────────
function StepConfirmacao({ entrega, items, subtotal, shipping, orderNum, mpResult }) {
  const freteVal   = shipping?.price ?? 0
  const finalTotal = subtotal + freteVal
  const isPending  = mpResult?.status === 'pending' || mpResult?.status === 'in_process'
  const isPix      = mpResult?.payment_method_id === 'pix'
  const pixData    = mpResult?.point_of_interaction?.transaction_data
  const boletoUrl  = mpResult?.transaction_details?.external_resource_url

  return (
    <div className="checkout-success">
      {isPending ? (
        <>
          {isPix ? (
            <>
              <div className="checkout-success__icon" style={{ background: '#00b1ea' }}>⚡</div>
              <h2>Quase lá! Pague com PIX</h2>
              <p>Escaneie o QR code ou copie o código para finalizar o pedido.</p>

              {pixData?.qr_code_base64 && (
                <div className="pix-qr-real">
                  <img
                    src={`data:image/png;base64,${pixData.qr_code_base64}`}
                    alt="QR Code PIX"
                  />
                </div>
              )}

              {pixData?.qr_code && (
                <div className="pix-copy-wrap">
                  <p className="pix-code-label">Código PIX Copia e Cola:</p>
                  <div className="pix-copy-box">
                    <code className="pix-code-text">{pixData.qr_code.slice(0, 40)}…</code>
                    <button
                      className="btn btn--gold"
                      style={{ fontSize: 12, padding: '6px 14px' }}
                      onClick={() => navigator.clipboard.writeText(pixData.qr_code)}
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              )}

              <p className="pix-note" style={{ marginTop: 12 }}>
                ⏱ O código expira em <strong>30 minutos</strong>. Após o pagamento, seu pedido é confirmado automaticamente.
              </p>
            </>
          ) : (
            <>
              <div className="checkout-success__icon" style={{ background: '#6c757d' }}>📄</div>
              <h2>Boleto gerado!</h2>
              <p>Pague o boleto para confirmar seu pedido.</p>
              {boletoUrl && (
                <a
                  href={boletoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn--gold btn--full btn--lg"
                  style={{ marginBottom: 16 }}
                >
                  📄 Abrir boleto
                </a>
              )}
              <p style={{ fontSize: 12, color: 'var(--gray)' }}>
                Vencimento em 3 dias úteis. Não pague após o vencimento.
              </p>
            </>
          )}
        </>
      ) : (
        <>
          <div className="checkout-success__icon">✓</div>
          <h2>Pedido aprovado!</h2>
        </>
      )}

      <p style={{ marginTop: 8 }}>
        Pedido <strong>#{orderNum}</strong> · confirmação enviada para <strong>{entrega.email}</strong>
      </p>

      <div className="checkout-success__card">
        <div className="checkout-success__row">
          <span>Entrega para</span>
          <strong>{entrega.nome}</strong>
        </div>
        <div className="checkout-success__row">
          <span>Endereço</span>
          <strong>
            {entrega.rua}, {entrega.numero}
            {entrega.complemento ? ` — ${entrega.complemento}` : ''}<br/>
            {entrega.bairro}, {entrega.cidade}/{entrega.estado} · CEP {entrega.cep}
          </strong>
        </div>
        <div className="checkout-success__row">
          <span>Frete</span>
          <strong className={freteVal === 0 ? 'free-shipping' : ''}>
            {shipping?.icon} {shipping?.name} ·{' '}
            {freteVal === 0 ? 'Grátis 🎉' : `R$ ${freteVal.toFixed(2).replace('.', ',')}`}
          </strong>
        </div>
        <div className="checkout-success__row">
          <span>Previsão</span>
          <strong>⏱ {shipping?.days ?? '3 a 7 dias úteis'}</strong>
        </div>
        <div className="checkout-success__row">
          <span>Pagamento</span>
          <strong>
            {mpResult ? mpMethodLabel(mpResult.payment_method_id) : 'Mercado Pago'}
            {mpResult?.installments > 1 ? ` · ${mpResult.installments}x` : ''}
          </strong>
        </div>
        <div className="checkout-success__row">
          <span>Total</span>
          <strong className="checkout-success__total">
            R$ {finalTotal.toFixed(2).replace('.', ',')}
          </strong>
        </div>
      </div>

      <div className="checkout-success__items">
        {items.map(item => (
          <div key={item.id} className="checkout-success__item">
            <img src={item.image} alt={item.name} />
            <span>{item.qty}x {item.name}</span>
          </div>
        ))}
      </div>

      <Link to="/" className="btn btn--gold btn--full btn--lg">Continuar comprando</Link>
    </div>
  )
}

// ── MAIN ─────────────────────────────────────────────────
export default function Checkout() {
  const { items, total, setOpen, clearCart } = useCart()
  const navigate  = useNavigate()
  const [step,     setStep]     = useState(0)
  const [orderNum, setOrderNum] = useState('')
  const [saving,   setSaving]   = useState(false)
  const [mpResult, setMpResult] = useState(null)   // resultado do pagamento MP

  const [entrega, setEntrega] = useState({
    nome: '', cpf: '', email: '', telefone: '',
    cep: '', rua: '', numero: '', complemento: '',
    bairro: '', cidade: '', estado: '',
  })
  const [selectedShipping, setSelectedShipping] = useState(null)
  const [freteOpts,   setFreteOpts]   = useState([])
  const [freteLoading, setFreteLoading] = useState(false)

  const freteVal = selectedShipping?.price ?? 0

  function handleEntregaChange(field, val) {
    setEntrega(p => ({ ...p, [field]: val }))
  }
  function handleEntregaBulk(fields) {
    setEntrega(p => ({ ...p, ...fields }))
    // Trigger frete fetch when CEP resolves via ViaCEP bulk update
    if (fields.estado && fields.cep) {
      fetchFrete(fields.cep, fields.estado)
    }
  }

  async function fetchFrete(cep, estado) {
    const cepDigits = String(cep).replace(/\D/g, '')
    if (cepDigits.length !== 8 || !estado) return
    setFreteLoading(true)
    setSelectedShipping(null)
    try {
      const res  = await fetch('/api/shipping', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cep_destino: cepDigits,
          subtotal:    total,
          item_count:  items.reduce((s, i) => s + i.qty, 0),
        }),
      })
      const data = await res.json()
      if (res.ok && Array.isArray(data) && data.length > 0) {
        setFreteOpts(normalizeME(data, total))
      } else {
        // API respondeu mas sem opções válidas → fallback estático
        setFreteOpts(staticFreteOptions(estado, total))
      }
    } catch {
      setFreteOpts(staticFreteOptions(estado, total))
    } finally {
      setFreteLoading(false)
    }
  }

  async function confirmOrder(mp) {
    const finalTotal = total + freteVal
    const num = String(Math.floor(Math.random() * 900000) + 100000)
    setOrderNum(num)
    setMpResult(mp)
    setSaving(true)
    try {
      await supabase.from('orders').insert({
        order_number:          num,
        customer_name:         entrega.nome,
        customer_email:        entrega.email,
        customer_phone:        entrega.telefone,
        customer_cpf:          entrega.cpf,
        address_cep:           entrega.cep,
        address_street:        entrega.rua,
        address_number:        entrega.numero,
        address_complement:    entrega.complemento || null,
        address_neighborhood:  entrega.bairro,
        address_city:          entrega.cidade,
        address_state:         entrega.estado,
        payment_method:        mp?.payment_method_id  || 'mercadopago',
        payment_installments:  mp?.installments       || 1,
        payment_mp_id:         mp?.id?.toString()     || null,
        payment_status:        mp?.status             || 'pending',
        subtotal:              total,
        shipping:              freteVal,
        total:                 finalTotal,
        items:                 items.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price })),
      })
    } catch (e) {
      console.error('[Supabase] Erro ao salvar pedido:', e)
    } finally {
      setSaving(false)
      setOpen(false)
      clearCart()
      setStep(2)
    }
  }

  if (items.length === 0 && step < 2) {
    return (
      <main className="checkout-page">
        <div className="checkout-empty">
          <span>🛒</span>
          <h2>Seu carrinho está vazio</h2>
          <Link to="/produtos" className="btn btn--gold">Ver produtos</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="checkout-page">
      <div className="checkout-header">
        <Link to="/" className="checkout-header__logo">
          <img src="/logo.png" alt="Basic & Bijus" />
        </Link>
        <h1>Checkout</h1>
        <button className="checkout-header__close" onClick={() => navigate(-1)}>✕</button>
      </div>

      <div className="checkout-body">
        <div className="checkout-main">
          <StepBar current={step} />

          {step === 0 && (
            <StepEntrega
              data={entrega}
              onChange={handleEntregaChange}
              onBulkChange={handleEntregaBulk}
              onNext={() => setStep(1)}
              subtotal={total}
              itemCount={items.reduce((s, i) => s + i.qty, 0)}
              selectedShipping={selectedShipping}
              onSelectShipping={setSelectedShipping}
              freteOpts={freteOpts}
              freteLoading={freteLoading}
            />
          )}
          {step === 1 && (
            <StepPagamento
              entrega={entrega}
              onApproved={confirmOrder}
              onPending={confirmOrder}
              onBack={() => setStep(0)}
              subtotal={total}
              frete={freteVal}
            />
          )}
          {step === 2 && (
            <StepConfirmacao
              entrega={entrega}
              items={items}
              subtotal={total}
              shipping={selectedShipping}
              orderNum={orderNum}
              mpResult={mpResult}
            />
          )}
        </div>

        {step < 2 && (
          <div className="checkout-aside">
            <OrderSummary
              items={items}
              subtotal={total}
              selectedShipping={selectedShipping}
            />
          </div>
        )}
      </div>
    </main>
  )
}
