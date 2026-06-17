import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProducts } from '../context/ProductsContext'
import { supabase } from '../lib/supabase'
import { isAdminAuth } from './AdminLogin'

const STATUS_COLOR = { approved:'#22c55e', rejected:'#ef4444', pending:'#f59e0b', in_process:'#3b82f6', cancelled:'#6b7280', refunded:'#8b5cf6' }
const STATUS_LABEL = { approved:'✅ Aprovado', rejected:'❌ Recusado', pending:'⏳ Pendente', in_process:'🔄 Em processo', cancelled:'🚫 Cancelado', refunded:'↩️ Estornado' }

const cpText = (v) => navigator.clipboard?.writeText(String(v)).catch(() => {})
const fmtDate = (d) => d ? new Date(d).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'}) : '—'
const fmtR = (v) => v != null && v !== '' ? `R$ ${Number(v).toFixed(2).replace('.',',')}` : '—'

function OrderRow({ o }) {
  const [open, setOpen] = useState(false)
  const [lightbox, setLightbox] = useState(null)
  const { products } = useProducts()
  const productMap = Object.fromEntries(products.map(p => [String(p.id), p]))
  const status = o.payment_status ?? 'pending'
  const items  = Array.isArray(o.items) ? o.items : []

  return (
    <>
      <tr className={`config-row${open ? ' config-row--open' : ''}`} onClick={() => setOpen(s => !s)}>
        <td><span className="config-expand">{open ? '▼' : '▶'}</span></td>
        <td>
          <code className="config-id" onClick={e => { e.stopPropagation(); cpText(o.order_number) }} title="Copiar nº pedido">
            {o.order_number}
          </code>
        </td>
        <td>
          <span className="config-status" style={{ color: STATUS_COLOR[status] ?? '#888' }}>
            {STATUS_LABEL[status] ?? status}
          </span>
        </td>
        <td>
          <strong style={{ fontSize: 12 }}>{o.customer_name}</strong>
          <small style={{ display: 'block', color: 'var(--gray)', fontSize: 10 }}>{o.customer_email}</small>
        </td>
        <td><strong>{fmtR(o.total)}</strong></td>
        <td className="config-date">{fmtDate(o.created_at)}</td>
      </tr>

      {lightbox && (
        <tr>
          <td colSpan={6} style={{ padding: 0, border: 'none' }}>
            <div className="order-lightbox" onClick={() => setLightbox(null)}>
              <img src={lightbox} alt="Produto" className="order-lightbox__img" />
              <button className="order-lightbox__close" onClick={() => setLightbox(null)}>✕</button>
            </div>
          </td>
        </tr>
      )}

      {open && (
        <tr className="config-detail-row">
          <td colSpan={6}>
            <div className="order-detail-panel">

              <div className="order-detail-group">
                <h4>👤 Cliente</h4>
                <div className="order-detail-grid">
                  <div className="order-detail-field"><span>Nome</span><strong>{o.customer_name}</strong></div>
                  <div className="order-detail-field"><span>Email</span>
                    <strong style={{ cursor: 'pointer' }} onClick={() => cpText(o.customer_email)}>{o.customer_email} <small>⎘</small></strong>
                  </div>
                  <div className="order-detail-field"><span>Telefone</span><strong>{o.customer_phone || '—'}</strong></div>
                  <div className="order-detail-field"><span>CPF</span><strong>{o.customer_cpf || '—'}</strong></div>
                </div>
              </div>

              <div className="order-detail-group">
                <h4>📍 Endereço de entrega</h4>
                <div className="order-detail-address">
                  {o.address_street}, {o.address_number}
                  {o.address_complement ? ` — ${o.address_complement}` : ''}
                  <br />
                  {o.address_neighborhood} · {o.address_city}/{o.address_state} · CEP {o.address_cep}
                </div>
              </div>

              <div className="order-detail-group">
                <h4>🛍️ Itens comprados</h4>
                <div className="order-items-list">
                  {items.length === 0
                    ? <span style={{ color: 'var(--gray)', fontSize: 12 }}>Sem itens</span>
                    : items.map((item, i) => (
                      <div key={i} className="order-item-row">
                        {(item.image || productMap[String(item.id)]?.image)
                          ? <img
                              src={item.image || productMap[String(item.id)]?.image}
                              alt={item.name}
                              className="order-item-thumb order-item-thumb--clickable"
                              onClick={() => setLightbox(item.image || productMap[String(item.id)]?.image)}
                            />
                          : <span className="order-item-thumb order-item-thumb--empty" />}
                        <span className="order-item-qty">{item.qty}×</span>
                        <span className="order-item-name">{item.name}</span>
                        <span className="order-item-price">{fmtR(Number(item.price) * Number(item.qty))}</span>
                      </div>
                    ))
                  }
                </div>
              </div>

              <div className="order-detail-group">
                <h4>💰 Valores e pagamento</h4>
                <div className="order-totals">
                  <div className="order-total-row"><span>Subtotal</span><span>{fmtR(o.subtotal)}</span></div>
                  <div className="order-total-row">
                    <span>Frete{o.shipping_name ? <small style={{ color: 'var(--gray)', fontWeight: 400 }}> · {o.shipping_name}</small> : ''}</span>
                    <span>{o.shipping > 0 ? fmtR(o.shipping) : <span style={{ color: '#4ade80' }}>Grátis</span>}</span>
                  </div>
                  <div className="order-total-row order-total-row--total"><span>Total</span><strong>{fmtR(o.total)}</strong></div>
                  <div className="order-total-row" style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                    <span>Método</span>
                    <span style={{ textTransform: 'capitalize' }}>{o.payment_method || '—'}</span>
                  </div>
                  {o.payment_mp_id && (
                    <div className="order-total-row">
                      <span>ID MP</span>
                      <code className="config-id" style={{ fontSize: 11 }} onClick={() => cpText(o.payment_mp_id)}>
                        {o.payment_mp_id} <small>⎘</small>
                      </code>
                    </div>
                  )}
                  <div className="order-total-row">
                    <span>Estoque debitado</span>
                    <span style={{ color: o.stock_decremented ? '#4ade80' : '#f59e0b' }}>
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

const EMPTY = {
  name: '',
  category: 'colares',
  price: '',
  originalPrice: '',
  image: '',
  images: ['', ''],
  description: '',
  badge: '',
  badgeColor: '#02AAD7',
  featured: false,
  material: '',
  stone: '',
  sizes: [],
  sold: '',
}

const BADGE_PRESETS = [
  { label: 'Promoção', color: '#02AAD7' },
  { label: 'Novo',     color: '#02AAD7' },
  { label: 'Mais vendido', color: '#003D64' },
  { label: 'Edição limitada', color: '#003D64' },
  { label: 'Conjunto', color: '#003D64' },
  { label: 'Kit',      color: '#003D64' },
]

const ALL_SIZES = ['PP', 'P', 'M', 'G', 'GG', 'XGG']

export default function Admin() {
  const navigate = useNavigate()
  const { products, addProduct, updateProduct, deleteProduct, categories } = useProducts()

  const [view, setView]         = useState('list') // 'list' | 'form' | 'orders'
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState(EMPTY)
  const [filterCat, setFilterCat] = useState('todos')
  const [search, setSearch]     = useState('')
  const [saved, setSaved]       = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)
  const [imgPreview, setImgPreview] = useState('')

  const [orders, setOrders]             = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError]   = useState('')

  useEffect(() => {
    if (!isAdminAuth()) navigate('/admin/login')
  }, [])

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
    } catch (e) {
      setOrdersError('Erro ao carregar pedidos: ' + e.message)
    } finally {
      setOrdersLoading(false)
    }
  }

  useEffect(() => {
    setImgPreview(form.image)
  }, [form.image])

  function logout() {
    sessionStorage.removeItem('lumiere_admin_auth')
    navigate('/admin/login')
  }

  function startNew() {
    setEditing(null)
    setForm(EMPTY)
    setView('form')
  }

  function startEdit(product) {
    setEditing(product.id)
    setForm({
      ...EMPTY,
      ...product,
      price: String(product.price),
      originalPrice: product.originalPrice ? String(product.originalPrice) : '',
      sold: product.sold ? String(product.sold) : '',
      images: product.images?.length >= 2 ? product.images : [...(product.images || [product.image]), ''],
      sizes: product.sizes || [],
    })
    setView('form')
    window.scrollTo(0, 0)
  }

  function handleChange(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleImageLine(index, value) {
    setForm(f => {
      const imgs = [...f.images]
      imgs[index] = value
      return { ...f, images: imgs }
    })
  }

  function addImageLine() {
    setForm(f => ({ ...f, images: [...f.images, ''] }))
  }

  function removeImageLine(index) {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== index) }))
  }

  function toggleSize(s) {
    setForm(f => ({
      ...f,
      sizes: f.sizes.includes(s) ? f.sizes.filter(x => x !== s) : [...f.sizes, s],
    }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const data = {
      ...form,
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
      sold: form.sold ? Number(form.sold) : null,
      images: form.images.filter(Boolean),
      badge: form.badge || null,
      sizes: form.sizes.length ? form.sizes : null,
    }
    if (!data.images.length) data.images = [data.image]

    if (editing !== null) {
      updateProduct(editing, data)
    } else {
      addProduct(data)
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    setView('list')
  }

  function handleDelete(id) {
    deleteProduct(id)
    setConfirmDel(null)
  }

  const catOptions = categories.filter(c => c.id !== 'todos')

  const filtered = products
    .filter(p => filterCat === 'todos' || p.category === filterCat)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))

  // ── ORDERS VIEW ───────────────────────────────────────────
  if (view === 'orders') {
    const approved = orders.filter(o => o.payment_status === 'approved').length
    const pending  = orders.filter(o => o.payment_status === 'pending').length
    const revenue  = orders.filter(o => o.payment_status === 'approved').reduce((s, o) => s + Number(o.total || 0), 0)

    return (
      <div className="admin-page">
        <div className="admin-header">
          <button className="admin-back" onClick={() => setView('list')}>← Produtos</button>
          <h1>📦 Pedidos</h1>
          <div className="admin-header__actions">
            <button className="btn btn--ghost" onClick={fetchOrders} disabled={ordersLoading} style={{ fontSize: 13 }}>
              {ordersLoading ? '⏳' : '🔄 Atualizar'}
            </button>
            <button className="admin-logout" onClick={logout}>Sair</button>
          </div>
        </div>

        <div className="admin-stats">
          <div className="admin-stat"><strong>{orders.length}</strong><span>Total</span></div>
          <div className="admin-stat"><strong style={{ color: '#22c55e' }}>{approved}</strong><span>Aprovados</span></div>
          <div className="admin-stat"><strong style={{ color: '#f59e0b' }}>{pending}</strong><span>Pendentes</span></div>
          <div className="admin-stat"><strong style={{ color: '#93c5fd', fontSize: '1rem' }}>R$ {revenue.toFixed(2).replace('.', ',')}</strong><span>Receita</span></div>
        </div>

        {ordersError && <p className="config-error" style={{ margin: '0 16px 12px' }}>{ordersError}</p>}

        {!ordersLoading && orders.length === 0 && !ordersError && (
          <p className="config-empty" style={{ textAlign: 'center', padding: 40, color: 'var(--gray)' }}>Nenhum pedido encontrado.</p>
        )}

        <div className="config-table-wrap" style={{ margin: '0 0 32px' }}>
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
      </div>
    )
  }

  // ── FORM VIEW ──────────────────────────────────────────────
  if (view === 'form') {
    const isCamiseta = form.category === 'camisetas'
    return (
      <div className="admin-page">
        <div className="admin-header">
          <button className="admin-back" onClick={() => setView('list')}>← Voltar</button>
          <h1>{editing !== null ? 'Editar Produto' : 'Novo Produto'}</h1>
          <button className="admin-logout" onClick={logout}>Sair</button>
        </div>

        <form className="admin-form" onSubmit={handleSubmit}>

          {/* IMAGEM PRINCIPAL */}
          <div className="admin-section">
            <h3 className="admin-section__title">📷 Imagem principal</h3>
            <div className="admin-img-preview-wrap">
              {imgPreview
                ? <img src={imgPreview} alt="preview" className="admin-img-preview" onError={() => setImgPreview('')} />
                : <div className="admin-img-placeholder">Sem imagem</div>
              }
            </div>
            <div className="admin-field">
              <label>URL da imagem principal <span className="req">*</span></label>
              <input
                type="url"
                placeholder="https://..."
                value={form.image}
                onChange={e => handleChange('image', e.target.value)}
                required
              />
            </div>

            <div className="admin-field">
              <label>Imagens adicionais (galeria)</label>
              {form.images.map((img, i) => (
                <div key={i} className="admin-img-row">
                  <input
                    type="url"
                    placeholder={`URL imagem ${i + 1}`}
                    value={img}
                    onChange={e => handleImageLine(i, e.target.value)}
                  />
                  {form.images.length > 1 && (
                    <button type="button" className="admin-img-remove" onClick={() => removeImageLine(i)}>✕</button>
                  )}
                </div>
              ))}
              <button type="button" className="admin-add-img" onClick={addImageLine}>+ Adicionar imagem</button>
            </div>
          </div>

          {/* INFORMAÇÕES BÁSICAS */}
          <div className="admin-section">
            <h3 className="admin-section__title">📋 Informações básicas</h3>

            <div className="admin-field">
              <label>Nome do produto <span className="req">*</span></label>
              <input
                type="text"
                placeholder="Ex: Colar Eternidade"
                value={form.name}
                onChange={e => handleChange('name', e.target.value)}
                required
              />
            </div>

            <div className="admin-row">
              <div className="admin-field">
                <label>Categoria <span className="req">*</span></label>
                <select value={form.category} onChange={e => handleChange('category', e.target.value)}>
                  {catOptions.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div className="admin-field">
                <label>Destaque</label>
                <label className="admin-toggle">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={e => handleChange('featured', e.target.checked)}
                  />
                  <span className="admin-toggle__track"><span className="admin-toggle__thumb" /></span>
                  <span>{form.featured ? 'Sim' : 'Não'}</span>
                </label>
              </div>
            </div>

            <div className="admin-field">
              <label>Descrição <span className="req">*</span></label>
              <textarea
                rows={4}
                placeholder="Descreva o produto detalhadamente..."
                value={form.description}
                onChange={e => handleChange('description', e.target.value)}
                required
              />
            </div>
          </div>

          {/* PREÇO */}
          <div className="admin-section">
            <h3 className="admin-section__title">💰 Preço</h3>
            <div className="admin-row">
              <div className="admin-field">
                <label>Preço (R$) <span className="req">*</span></label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={form.price}
                  onChange={e => handleChange('price', e.target.value)}
                  required
                />
              </div>
              <div className="admin-field">
                <label>Preço original (R$) <span className="hint">opcional – para % desconto</span></label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={form.originalPrice}
                  onChange={e => handleChange('originalPrice', e.target.value)}
                />
              </div>
            </div>
            <div className="admin-field">
              <label>Unidades vendidas <span className="hint">opcional</span></label>
              <input
                type="number"
                min="0"
                placeholder="Ex: 1200"
                value={form.sold}
                onChange={e => handleChange('sold', e.target.value)}
              />
            </div>
          </div>

          {/* BADGE */}
          <div className="admin-section">
            <h3 className="admin-section__title">🏷️ Badge</h3>
            <div className="admin-badge-presets">
              {BADGE_PRESETS.map(b => (
                <button
                  key={b.label}
                  type="button"
                  className={`admin-badge-preset${form.badge === b.label ? ' active' : ''}`}
                  style={{ '--badge-color': b.color }}
                  onClick={() => handleChange('badge', form.badge === b.label ? '' : b.label) || handleChange('badgeColor', b.color)}
                  onClick={() => {
                    if (form.badge === b.label) {
                      handleChange('badge', '')
                    } else {
                      setForm(f => ({ ...f, badge: b.label, badgeColor: b.color }))
                    }
                  }}
                >{b.label}</button>
              ))}
            </div>
            <div className="admin-row">
              <div className="admin-field">
                <label>Texto personalizado</label>
                <input
                  type="text"
                  placeholder="Ex: Exclusivo"
                  value={form.badge || ''}
                  onChange={e => handleChange('badge', e.target.value)}
                />
              </div>
              <div className="admin-field">
                <label>Cor do badge</label>
                <div className="admin-color-row">
                  <input
                    type="color"
                    value={form.badgeColor}
                    onChange={e => handleChange('badgeColor', e.target.value)}
                  />
                  <span>{form.badgeColor}</span>
                </div>
              </div>
            </div>
          </div>

          {/* DETALHES */}
          <div className="admin-section">
            <h3 className="admin-section__title">🔎 Detalhes técnicos</h3>
            <div className="admin-row">
              <div className="admin-field">
                <label>Material</label>
                <input
                  type="text"
                  placeholder="Ex: Banho de ouro 18k"
                  value={form.material}
                  onChange={e => handleChange('material', e.target.value)}
                />
              </div>
              <div className="admin-field">
                <label>{isCamiseta ? 'Detalhes' : 'Pedra'}</label>
                <input
                  type="text"
                  placeholder={isCamiseta ? 'Ex: Estampa digital' : 'Ex: Zircônia'}
                  value={form.stone}
                  onChange={e => handleChange('stone', e.target.value)}
                />
              </div>
            </div>

            {isCamiseta && (
              <div className="admin-field">
                <label>Tamanhos disponíveis</label>
                <div className="admin-sizes">
                  {ALL_SIZES.map(s => (
                    <button
                      key={s}
                      type="button"
                      className={`size-btn${form.sizes.includes(s) ? ' active' : ''}`}
                      onClick={() => toggleSize(s)}
                    >{s}</button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AÇÕES */}
          <div className="admin-actions">
            <button type="button" className="btn btn--ghost" onClick={() => setView('list')}>Cancelar</button>
            <button type="submit" className={`btn btn--gold${saved ? ' btn--added' : ''}`}>
              {saved ? '✓ Salvo!' : editing !== null ? 'Salvar alterações' : 'Adicionar produto'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  // ── LIST VIEW ──────────────────────────────────────────────
  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-header__brand">
          <img src="/logo.png" alt="Basic & Bijus" className="admin-header__logo-img" />
          <h1>Admin</h1>
        </div>
        <div className="admin-header__actions">
          <button className="admin-btn-secondary" onClick={() => { setView('orders'); fetchOrders() }}>📦 Pedidos</button>
          <a href="/" target="_blank" className="admin-btn-secondary">Ver loja ↗</a>
          <button className="admin-logout" onClick={logout}>Sair</button>
        </div>
      </div>

      {saved && <div className="admin-toast">✓ Produto salvo com sucesso!</div>}

      <div className="admin-toolbar">
        <input
          className="admin-search"
          type="text"
          placeholder="🔍 Buscar produto..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="admin-filter" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <button className="btn btn--gold" onClick={startNew}>+ Novo produto</button>
      </div>

      <div className="admin-stats">
        <div className="admin-stat"><strong>{products.length}</strong><span>Total</span></div>
        {catOptions.map(c => (
          <div key={c.id} className="admin-stat">
            <strong>{products.filter(p => p.category === c.id).length}</strong>
            <span>{c.label}</span>
          </div>
        ))}
      </div>

      <div className="admin-list">
        {filtered.length === 0 && (
          <div className="admin-empty">Nenhum produto encontrado.</div>
        )}
        {filtered.map(p => (
          <div key={p.id} className="admin-item">
            <div className="admin-item__img">
              <img src={p.image} alt={p.name} />
            </div>
            <div className="admin-item__info">
              <div className="admin-item__top">
                <span className="admin-item__cat">{p.category}</span>
                {p.badge && (
                  <span className="admin-item__badge" style={{ background: p.badgeColor }}>
                    {p.badge}
                  </span>
                )}
                {p.featured && <span className="admin-item__featured">⭐ Destaque</span>}
              </div>
              <p className="admin-item__name">{p.name}</p>
              <div className="admin-item__price">
                <strong>R$ {Number(p.price).toFixed(2).replace('.', ',')}</strong>
                {p.originalPrice && (
                  <s>R$ {Number(p.originalPrice).toFixed(2).replace('.', ',')}</s>
                )}
              </div>
              {p.sizes && <p className="admin-item__sizes">{p.sizes.join(' · ')}</p>}
            </div>
            <div className="admin-item__btns">
              <button className="admin-item__edit" onClick={() => startEdit(p)}>✏️ Editar</button>
              <button className="admin-item__del" onClick={() => setConfirmDel(p.id)}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {/* Confirm delete modal */}
      {confirmDel !== null && (
        <div className="admin-modal-overlay" onClick={() => setConfirmDel(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3>Excluir produto?</h3>
            <p>Esta ação não pode ser desfeita.</p>
            <div className="admin-modal__btns">
              <button className="btn btn--ghost" onClick={() => setConfirmDel(null)}>Cancelar</button>
              <button className="btn btn--danger" onClick={() => handleDelete(confirmDel)}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
