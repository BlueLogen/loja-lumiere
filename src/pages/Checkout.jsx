import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { supabase } from '../lib/supabase'

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
    const dy    = Math.sin(angle) * dist - 80   // puxa levemente para cima
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

  // Botão pulsa
  originEl.style.transition = 'transform .15s'
  originEl.style.transform  = 'scale(1.08)'
  setTimeout(() => { originEl.style.transform = 'scale(1)' }, 150)

  setTimeout(() => { wrap.remove(); onDone() }, 1100)
}

// ── Tabela de frete por UF ──────────────────────────────────
const FRETE_UF = {
  SP: 12.90,
  MG: 15.90, RJ: 15.90, ES: 15.90,
  PR: 15.90, SC: 15.90, RS: 15.90,
  GO: 19.90, MT: 19.90, MS: 19.90, DF: 19.90,
  BA: 22.90, PE: 22.90, CE: 22.90, MA: 22.90,
  PB: 22.90, RN: 22.90, AL: 22.90, SE: 22.90, PI: 22.90,
  PA: 24.90, AM: 24.90, TO: 24.90, RO: 24.90,
  AC: 29.90, RR: 29.90, AP: 29.90,
}

function calcFrete(estado, subtotal) {
  if (subtotal >= 299) return 0
  if (!estado) return null
  return FRETE_UF[estado] ?? 24.90
}

function freteInfo(estado, subtotal) {
  if (subtotal >= 299) return { label: 'Grátis 🎉', value: 0, free: true }
  if (!estado) return { label: 'Informe o CEP', value: null, free: false }
  const v = FRETE_UF[estado] ?? 24.90
  return { label: `R$ ${v.toFixed(2).replace('.', ',')}`, value: v, free: false }
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
function OrderSummary({ items, subtotal, estado }) {
  const frete = freteInfo(estado, subtotal)
  const finalTotal = frete.value !== null ? subtotal + frete.value : null

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
          <span>Frete</span>
          <span className={frete.free ? 'free-shipping' : frete.value === null ? 'frete-pending' : ''}>
            {frete.label}
          </span>
        </div>
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
function StepEntrega({ data, onChange, onBulkChange, onNext, subtotal }) {
  const [cepLoading, setCepLoading] = useState(false)
  const [cepError, setCepError]     = useState('')
  const [bursting, setBursting]     = useState(false)
  const cepRef = useRef(null)
  const btnRef = useRef(null)

  const frete = freteInfo(data.estado, subtotal)

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
          rua:    json.logradouro || '',
          bairro: json.bairro     || '',
          cidade: json.localidade || '',
          estado: json.uf         || '',
        })
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

  function handleSubmit(e) {
    e.preventDefault()
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
                ref={cepRef}
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
            <select required value={data.estado} onChange={e => onChange('estado', e.target.value)}>
              <option value="">UF</option>
              {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Frete calculado */}
        {data.estado && (
          <div className={`frete-badge${frete.free ? ' frete-badge--free' : ''}`}>
            <span className="frete-badge__icon">{frete.free ? '🎉' : '🚚'}</span>
            <div>
              <strong>{frete.free ? 'Frete Grátis!' : `Frete: ${frete.label}`}</strong>
              {frete.free
                ? <small>Parabéns! Seu pedido tem frete grátis.</small>
                : <small>Entrega de 3 a 7 dias úteis para {data.cidade}/{data.estado}</small>
              }
            </div>
          </div>
        )}
      </div>

      <button ref={btnRef} type="submit" className={`btn btn--gold btn--full btn--lg${bursting ? ' btn--bursting' : ''}`} disabled={cepLoading || bursting}>
        {cepLoading ? 'Buscando CEP...' : bursting ? '🎉 Ótimo!' : 'Continuar para pagamento →'}
      </button>
    </form>
  )
}

// ── STEP 2: PAGAMENTO ─────────────────────────────────────
function StepPagamento({ data, onChange, onNext, onBack, subtotal, frete }) {
  const finalTotal = subtotal + (frete ?? 0)

  function handleSubmit(e) {
    e.preventDefault()
    onNext()
  }

  return (
    <form className="checkout-form" onSubmit={handleSubmit}>
      <div className="checkout-form__section">
        <h3>Método de pagamento</h3>
        <div className="payment-methods">
          {[
            { id: 'cartao', icon: '💳', label: 'Cartão de crédito', sub: 'até 3x sem juros' },
            { id: 'pix',    icon: '⚡', label: 'PIX',               sub: '5% de desconto' },
            { id: 'boleto', icon: '📄', label: 'Boleto bancário',   sub: 'vence em 3 dias' },
          ].map(m => (
            <label key={m.id} className={`payment-option${data.metodo === m.id ? ' active' : ''}`}>
              <input type="radio" name="metodo" value={m.id}
                checked={data.metodo === m.id}
                onChange={() => onChange('metodo', m.id)} />
              <span className="payment-option__icon">{m.icon}</span>
              <span className="payment-option__text">
                <strong>{m.label}</strong>
                <small>{m.sub}</small>
              </span>
            </label>
          ))}
        </div>
      </div>

      {data.metodo === 'cartao' && (
        <div className="checkout-form__section">
          <h3>Dados do cartão</h3>
          <div className="checkout-field">
            <label>Número do cartão *</label>
            <input required placeholder="0000 0000 0000 0000" maxLength={19}
              value={data.cardNum || ''}
              onChange={e => onChange('cardNum', maskCard(e.target.value))} />
          </div>
          <div className="checkout-field">
            <label>Nome no cartão *</label>
            <input required placeholder="Como está no cartão"
              value={data.cardName || ''}
              onChange={e => onChange('cardName', e.target.value.toUpperCase())} />
          </div>
          <div className="checkout-field-row">
            <div className="checkout-field">
              <label>Validade *</label>
              <input required placeholder="MM/AA" maxLength={5}
                value={data.cardExp || ''}
                onChange={e => onChange('cardExp', maskExp(e.target.value))} />
            </div>
            <div className="checkout-field checkout-field--sm">
              <label>CVV *</label>
              <input required placeholder="000" maxLength={4}
                value={data.cardCvv || ''}
                onChange={e => onChange('cardCvv', e.target.value.replace(/\D/g, ''))} />
            </div>
            <div className="checkout-field">
              <label>Parcelas</label>
              <select value={data.parcelas || '1'} onChange={e => onChange('parcelas', e.target.value)}>
                <option value="1">1x de R$ {finalTotal.toFixed(2).replace('.', ',')} (à vista)</option>
                <option value="2">2x de R$ {(finalTotal / 2).toFixed(2).replace('.', ',')} sem juros</option>
                <option value="3">3x de R$ {(finalTotal / 3).toFixed(2).replace('.', ',')} sem juros</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {data.metodo === 'pix' && (
        <div className="checkout-form__section pix-info">
          <div className="pix-box">
            <div className="pix-qr">
              <div className="pix-qr__mock">
                <svg viewBox="0 0 100 100" width="120" height="120">
                  <rect width="100" height="100" fill="white"/>
                  {[0,20,40,60,80].map(x => [0,20,40,60,80].map(y => (
                    <rect key={`${x}-${y}`} x={x+2} y={y+2}
                      width={((x * 3 + y) % 3 === 0) ? 14 : 8}
                      height={((x + y * 2) % 3 === 0) ? 14 : 8}
                      fill="#0d2347" rx="1"/>
                  )))}
                </svg>
              </div>
              <p className="pix-qr__label">QR Code PIX</p>
            </div>
            <div className="pix-details">
              <p><strong>Valor com desconto PIX (5%):</strong></p>
              <p className="pix-total">R$ {(finalTotal * 0.95).toFixed(2).replace('.', ',')}</p>
              <p className="pix-key">Chave PIX: <strong>basicebijus@pix.com</strong></p>
              <p className="pix-note">O pedido é confirmado automaticamente após o pagamento.</p>
            </div>
          </div>
        </div>
      )}

      {data.metodo === 'boleto' && (
        <div className="checkout-form__section">
          <div className="boleto-info">
            <span>📄</span>
            <p>O boleto será gerado após confirmar o pedido. Vencimento em <strong>3 dias úteis</strong>. Pagamentos após o vencimento não serão processados.</p>
          </div>
        </div>
      )}

      <div className="checkout-nav">
        <button type="button" className="btn btn--ghost" onClick={onBack}>← Voltar</button>
        <button type="submit" className="btn btn--gold btn--lg" disabled={!data.metodo}>
          Confirmar pedido →
        </button>
      </div>
    </form>
  )
}

// ── STEP 3: CONFIRMAÇÃO ───────────────────────────────────
function StepConfirmacao({ entrega, pagamento, items, subtotal, frete, orderNum }) {
  const finalTotal  = subtotal + (frete ?? 0)
  const metodoLabel = { cartao: 'Cartão de crédito', pix: 'PIX', boleto: 'Boleto bancário' }

  return (
    <div className="checkout-success">
      <div className="checkout-success__icon">✓</div>
      <h2>Pedido realizado!</h2>
      <p>Seu pedido <strong>#{orderNum}</strong> foi confirmado com sucesso.</p>
      <p>Uma confirmação foi enviada para <strong>{entrega.email}</strong></p>

      <div className="checkout-success__card">
        <div className="checkout-success__row">
          <span>Entrega para</span>
          <strong>{entrega.nome}</strong>
        </div>
        <div className="checkout-success__row">
          <span>Endereço</span>
          <strong>{entrega.rua}, {entrega.numero}{entrega.complemento ? ` — ${entrega.complemento}` : ''}<br/>{entrega.bairro}, {entrega.cidade}/{entrega.estado} · CEP {entrega.cep}</strong>
        </div>
        <div className="checkout-success__row">
          <span>Frete</span>
          <strong className={frete === 0 ? 'free-shipping' : ''}>
            {frete === 0 ? 'Grátis 🎉' : `R$ ${frete.toFixed(2).replace('.', ',')}`}
          </strong>
        </div>
        <div className="checkout-success__row">
          <span>Pagamento</span>
          <strong>
            {metodoLabel[pagamento.metodo] || pagamento.metodo}
            {pagamento.metodo === 'cartao' && pagamento.parcelas > 1 ? ` · ${pagamento.parcelas}x` : ''}
            {pagamento.metodo === 'pix' ? ' · 5% OFF' : ''}
          </strong>
        </div>
        <div className="checkout-success__row">
          <span>Total</span>
          <strong className="checkout-success__total">
            R$ {(pagamento.metodo === 'pix' ? finalTotal * 0.95 : finalTotal).toFixed(2).replace('.', ',')}
          </strong>
        </div>
        <div className="checkout-success__row">
          <span>Previsão de entrega</span>
          <strong>3 a 7 dias úteis</strong>
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
  const [step, setStep]       = useState(0)
  const [orderNum, setOrderNum] = useState('')
  const [saving, setSaving]   = useState(false)

  const [entrega, setEntrega] = useState({
    nome: '', cpf: '', email: '', telefone: '',
    cep: '', rua: '', numero: '', complemento: '',
    bairro: '', cidade: '', estado: '',
  })
  const [pagamento, setPagamento] = useState({
    metodo: '', cardNum: '', cardName: '', cardExp: '', cardCvv: '', parcelas: '1',
  })

  const frete = calcFrete(entrega.estado, total)

  function handleEntregaChange(field, val) {
    setEntrega(p => ({ ...p, [field]: val }))
  }
  function handleEntregaBulk(fields) {
    setEntrega(p => ({ ...p, ...fields }))
  }

  async function confirmOrder() {
    const finalTotal = total + (frete ?? 0)
    const num = String(Math.floor(Math.random() * 900000) + 100000)
    setOrderNum(num)
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
        payment_method:        pagamento.metodo,
        payment_installments:  Number(pagamento.parcelas) || 1,
        subtotal:              total,
        shipping:              frete ?? 0,
        total:                 pagamento.metodo === 'pix' ? finalTotal * 0.95 : finalTotal,
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
            />
          )}
          {step === 1 && (
            <StepPagamento
              data={pagamento}
              onChange={(field, val) => setPagamento(p => ({ ...p, [field]: val }))}
              onNext={confirmOrder}
              onBack={() => setStep(0)}
              subtotal={total}
              frete={frete ?? 0}
            />
          )}
          {step === 2 && (
            <StepConfirmacao
              entrega={entrega}
              pagamento={pagamento}
              items={items}
              subtotal={total}
              frete={frete ?? 0}
              orderNum={orderNum}
            />
          )}
        </div>

        {step < 2 && (
          <div className="checkout-aside">
            <OrderSummary items={items} subtotal={total} estado={entrega.estado} />
          </div>
        )}
      </div>
    </main>
  )
}
