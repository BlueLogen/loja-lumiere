import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useProducts } from '../context/ProductsContext'

const PASS    = 'lumiere2025'
const AUTH_KEY = 'dash_auth'

const EMPTY = {
  name:'', category:'colares', price:'', originalPrice:'',
  image:'', images:['',''], description:'', badge:'',
  badgeColor:'#c9a84c', featured:false, material:'',
  stone:'', sizes:[], sold:'',
}
const BADGE_PRESETS = [
  { label:'Promoção',       color:'#c9a84c' },
  { label:'Novo',           color:'#2d6a4f' },
  { label:'Mais vendido',   color:'#8b1a1a' },
  { label:'Edição limitada',color:'#1a3a5c' },
  { label:'Kit',            color:'#5c3d1a' },
]
const ALL_SIZES = ['PP','P','M','G','GG','XGG']
const CAT_LABEL = {
  colares:'Colares', brincos:'Brincos', aneis:'Anéis',
  pulseiras:'Pulseiras', camisetas:'Camisetas',
}
const CAT_ICON = {
  colares:'📿', brincos:'💎', aneis:'💍',
  pulseiras:'✨', camisetas:'👕',
}

// ── helpers ───────────────────────────────────────────────
function fmt(n) { return `R$ ${Number(n).toFixed(2).replace('.',',')}` }
function sold_fmt(n) {
  return n >= 1000 ? `${(n/1000).toFixed(1).replace('.',',')}mil` : String(n)
}

// ════════════════════════════════════════════════════════════
// LOGIN
// ════════════════════════════════════════════════════════════
function DashLogin({ onAuth }) {
  const [pw, setPw]   = useState('')
  const [err, setErr] = useState('')
  const [show, setShow] = useState(false)

  function submit(e) {
    e.preventDefault()
    if (pw === PASS) { sessionStorage.setItem(AUTH_KEY,'1'); onAuth() }
    else { setErr('Senha incorreta. Tente novamente.'); setPw('') }
  }

  return (
    <div className="dash-login">
      <div className="dash-login__card">
        <div className="dash-login__logo-wrap">
          <img src="/logo.png" alt="Basic & Bijus" className="dash-login__logo" />
        </div>
        <h1 className="dash-login__title">Painel Gerencial</h1>
        <p className="dash-login__sub">Faça login para gerenciar a loja</p>
        <form onSubmit={submit} className="dash-login__form">
          <label className="dash-login__label">Senha de acesso</label>
          <div className="dash-login__pw-wrap">
            <input
              type={show ? 'text' : 'password'}
              placeholder="Digite sua senha"
              value={pw}
              onChange={e => { setPw(e.target.value); setErr('') }}
              autoFocus
            />
            <button type="button" className="dash-login__eye" onClick={() => setShow(s => !s)}>
              {show ? '🙈' : '👁️'}
            </button>
          </div>
          {err && <p className="dash-login__err">{err}</p>}
          <button type="submit" className="dash-btn dash-btn--gold dash-btn--full">
            Entrar no painel →
          </button>
        </form>
        <Link to="/" className="dash-login__back">← Voltar para a loja</Link>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// OVERVIEW
// ════════════════════════════════════════════════════════════
function Overview({ products, onEdit, onNew }) {
  const cats     = [...new Set(products.map(p => p.category))]
  const avgPrice = products.length
    ? products.reduce((s,p) => s + p.price, 0) / products.length
    : 0
  const topSold  = [...products].sort((a,b) => (b.sold||0) - (a.sold||0))[0]
  const withDiscount = products.filter(p => p.originalPrice).length

  const stats = [
    { icon:'📦', label:'Total de produtos', value: products.length,         color:'#eff6ff', iconBg:'#bfdbfe' },
    { icon:'🗂️', label:'Categorias ativas', value: cats.length,             color:'#fef9c3', iconBg:'#fde68a' },
    { icon:'💰', label:'Preço médio',        value: fmt(avgPrice),           color:'#f0fdf4', iconBg:'#bbf7d0' },
    { icon:'🏷️', label:'Em promoção',        value: withDiscount,           color:'#fdf4ff', iconBg:'#e9d5ff' },
  ]

  return (
    <div className="dash-overview">
      {/* Stat cards */}
      <div className="dash-stats">
        {stats.map(s => (
          <div key={s.label} className="dash-stat" style={{ background: s.color }}>
            <div className="dash-stat__icon" style={{ background: s.iconBg }}>{s.icon}</div>
            <div className="dash-stat__body">
              <p className="dash-stat__val">{s.value}</p>
              <p className="dash-stat__lbl">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Por categoria */}
      <div className="dash-card">
        <div className="dash-card__head">
          <h3>Produtos por categoria</h3>
        </div>
        <div className="dash-cat-bars">
          {cats.map(cat => {
            const count = products.filter(p => p.category === cat).length
            const pct   = Math.round(count / products.length * 100)
            return (
              <div key={cat} className="dash-cat-bar">
                <span className="dash-cat-bar__label">
                  {CAT_ICON[cat]} {CAT_LABEL[cat] || cat}
                </span>
                <div className="dash-cat-bar__track">
                  <div className="dash-cat-bar__fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="dash-cat-bar__count">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Mais vendidos */}
      <div className="dash-card">
        <div className="dash-card__head">
          <h3>🔥 Mais vendidos</h3>
          <button className="dash-btn dash-btn--ghost dash-btn--sm" onClick={onNew}>
            + Novo produto
          </button>
        </div>
        <div className="dash-top-list">
          {[...products]
            .sort((a,b) => (b.sold||0)-(a.sold||0))
            .slice(0,5)
            .map((p,i) => (
              <div key={p.id} className="dash-top-item" onClick={() => onEdit(p)}>
                <span className="dash-top-item__rank">#{i+1}</span>
                <img src={p.image} alt={p.name} />
                <div className="dash-top-item__info">
                  <p>{p.name}</p>
                  <span>{CAT_LABEL[p.category] || p.category} · {fmt(p.price)}</span>
                </div>
                <span className="dash-top-item__sold">
                  {sold_fmt(p.sold || ((p.id*1337)%8500)+500)}+ vend.
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// PRODUCTS TABLE
// ════════════════════════════════════════════════════════════
function Products({ products, categories, onEdit, onDelete, onNew }) {
  const [search, setSearch]     = useState('')
  const [catFilter, setCatFilter] = useState('todos')
  const [confirmId, setConfirmId] = useState(null)

  const filtered = products
    .filter(p => catFilter === 'todos' || p.category === catFilter)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="dash-products">
      {/* Toolbar */}
      <div className="dash-toolbar">
        <div className="dash-toolbar__left">
          <div className="dash-search">
            <span>🔍</span>
            <input
              placeholder="Buscar produto..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button onClick={() => setSearch('')}>✕</button>}
          </div>
          <div className="dash-cat-tabs">
            {[{ id:'todos', label:'Todos' }, ...categories.filter(c => c.id !== 'todos')].map(c => (
              <button
                key={c.id}
                className={`dash-cat-tab${catFilter === c.id ? ' active' : ''}`}
                onClick={() => setCatFilter(c.id)}
              >{c.label}</button>
            ))}
          </div>
        </div>
        <button className="dash-btn dash-btn--gold" onClick={onNew}>
          + Novo produto
        </button>
      </div>

      <div className="dash-table-wrap">
        <p className="dash-table-info">{filtered.length} produto{filtered.length !== 1 ? 's' : ''}</p>
        <table className="dash-table">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Categoria</th>
              <th>Preço</th>
              <th>Desconto</th>
              <th>Badge</th>
              <th>Destaque</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const disc = p.originalPrice
                ? Math.round((1 - p.price/p.originalPrice)*100)
                : null
              return (
                <tr key={p.id}>
                  <td>
                    <div className="dash-table__product">
                      <img src={p.image} alt={p.name} />
                      <div>
                        <p className="dash-table__name">{p.name}</p>
                        <span className="dash-table__id">ID #{p.id}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="dash-table__cat">
                      {CAT_ICON[p.category]} {CAT_LABEL[p.category] || p.category}
                    </span>
                  </td>
                  <td>
                    <div className="dash-table__price">
                      <strong>{fmt(p.price)}</strong>
                      {p.originalPrice && (
                        <s>{fmt(p.originalPrice)}</s>
                      )}
                    </div>
                  </td>
                  <td>
                    {disc
                      ? <span className="dash-badge dash-badge--green">-{disc}%</span>
                      : <span className="dash-badge dash-badge--gray">—</span>
                    }
                  </td>
                  <td>
                    {p.badge
                      ? <span className="dash-badge" style={{ background: p.badgeColor+'22', color: p.badgeColor, border:`1px solid ${p.badgeColor}55` }}>{p.badge}</span>
                      : <span className="dash-badge dash-badge--gray">Nenhum</span>
                    }
                  </td>
                  <td>
                    <span className={`dash-badge ${p.featured ? 'dash-badge--gold' : 'dash-badge--gray'}`}>
                      {p.featured ? '⭐ Sim' : 'Não'}
                    </span>
                  </td>
                  <td>
                    <div className="dash-table__actions">
                      <button className="dash-action dash-action--edit" onClick={() => onEdit(p)}>
                        ✏️ Editar
                      </button>
                      {confirmId === p.id ? (
                        <div className="dash-confirm">
                          <span>Excluir?</span>
                          <button className="dash-action dash-action--danger" onClick={() => { onDelete(p.id); setConfirmId(null) }}>Sim</button>
                          <button className="dash-action" onClick={() => setConfirmId(null)}>Não</button>
                        </div>
                      ) : (
                        <button className="dash-action dash-action--del" onClick={() => setConfirmId(p.id)}>
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="dash-empty">
            <span>📭</span>
            <p>Nenhum produto encontrado</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// PRODUCT DRAWER (add / edit)
// ════════════════════════════════════════════════════════════
function ProductDrawer({ editing, initial, categories, onSave, onClose }) {
  const [form, setForm]         = useState(initial)
  const [preview, setPreview]   = useState(initial.image)
  const [saved, setSaved]       = useState(false)

  useEffect(() => { setPreview(form.image) }, [form.image])

  function set(field, val) { setForm(f => ({ ...f, [field]: val })) }

  function handleImg(i, val) {
    setForm(f => { const imgs=[...f.images]; imgs[i]=val; return {...f, images:imgs} })
  }

  function toggleSize(s) {
    setForm(f => ({
      ...f,
      sizes: f.sizes.includes(s) ? f.sizes.filter(x=>x!==s) : [...f.sizes, s]
    }))
  }

  function submit(e) {
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
    onSave(data)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const isCamiseta = form.category === 'camisetas'
  const disc = form.originalPrice && form.price
    ? Math.round((1 - Number(form.price)/Number(form.originalPrice))*100)
    : null

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <div className="drawer__head">
          <h2>{editing ? `Editar: ${form.name || '…'}` : 'Novo produto'}</h2>
          <button className="drawer__close" onClick={onClose}>✕</button>
        </div>

        <form className="drawer__body" onSubmit={submit}>

          {/* Preview + imagem */}
          <div className="drawer-section">
            <div className="drawer-section__title">📷 Imagem principal</div>
            <div className="drawer-img-preview">
              {preview
                ? <img src={preview} alt="preview" onError={() => setPreview('')} />
                : <div className="drawer-img-placeholder">🖼️ Pré-visualização</div>
              }
            </div>
            <div className="drawer-field">
              <label>URL da imagem *</label>
              <input required type="url" placeholder="https://..." value={form.image}
                onChange={e => set('image', e.target.value)} />
            </div>
            <div className="drawer-field">
              <label>Imagens da galeria</label>
              {form.images.map((img, i) => (
                <div key={i} className="drawer-img-row">
                  <input type="url" placeholder={`Imagem ${i+1}`} value={img}
                    onChange={e => handleImg(i, e.target.value)} />
                  {form.images.length > 1 &&
                    <button type="button" onClick={() => setForm(f => ({ ...f, images: f.images.filter((_,j)=>j!==i) }))}>✕</button>
                  }
                </div>
              ))}
              <button type="button" className="drawer-add-img"
                onClick={() => setForm(f => ({ ...f, images: [...f.images, ''] }))}>
                + Adicionar imagem
              </button>
            </div>
          </div>

          {/* Informações */}
          <div className="drawer-section">
            <div className="drawer-section__title">📋 Informações</div>
            <div className="drawer-field">
              <label>Nome do produto *</label>
              <input required placeholder="Ex: Colar Eternidade" value={form.name}
                onChange={e => set('name', e.target.value)} />
            </div>
            <div className="drawer-row">
              <div className="drawer-field">
                <label>Categoria *</label>
                <select value={form.category} onChange={e => set('category', e.target.value)}>
                  {categories.filter(c => c.id !== 'todos').map(c =>
                    <option key={c.id} value={c.id}>{c.label}</option>
                  )}
                </select>
              </div>
              <div className="drawer-field drawer-field--sm">
                <label>Destaque</label>
                <label className="drawer-toggle">
                  <input type="checkbox" checked={form.featured}
                    onChange={e => set('featured', e.target.checked)} />
                  <span className="drawer-toggle__track">
                    <span className="drawer-toggle__thumb" />
                  </span>
                </label>
              </div>
            </div>
            <div className="drawer-field">
              <label>Descrição *</label>
              <textarea required rows={3} placeholder="Descreva o produto..." value={form.description}
                onChange={e => set('description', e.target.value)} />
            </div>
          </div>

          {/* Preço */}
          <div className="drawer-section">
            <div className="drawer-section__title">💰 Preço</div>
            <div className="drawer-row">
              <div className="drawer-field">
                <label>Preço atual (R$) *</label>
                <input required type="number" min="0" step="0.01" placeholder="0,00"
                  value={form.price} onChange={e => set('price', e.target.value)} />
              </div>
              <div className="drawer-field">
                <label>Preço original (R$)</label>
                <input type="number" min="0" step="0.01" placeholder="0,00"
                  value={form.originalPrice} onChange={e => set('originalPrice', e.target.value)} />
              </div>
            </div>
            {disc !== null && disc > 0 && (
              <div className="drawer-discount-preview">
                🏷️ Desconto calculado: <strong>{disc}% OFF</strong>
              </div>
            )}
            <div className="drawer-field">
              <label>Unidades vendidas <span className="drawer-hint">opcional</span></label>
              <input type="number" min="0" placeholder="Ex: 1200" value={form.sold}
                onChange={e => set('sold', e.target.value)} />
            </div>
          </div>

          {/* Badge */}
          <div className="drawer-section">
            <div className="drawer-section__title">🏷️ Badge</div>
            <div className="drawer-badge-presets">
              {BADGE_PRESETS.map(b => (
                <button key={b.label} type="button"
                  className={`drawer-badge-btn${form.badge === b.label ? ' active' : ''}`}
                  style={{ borderColor: b.color, color: form.badge === b.label ? '#fff' : b.color, background: form.badge === b.label ? b.color : 'transparent' }}
                  onClick={() => setForm(f => f.badge === b.label ? { ...f, badge:'' } : { ...f, badge: b.label, badgeColor: b.color })}>
                  {b.label}
                </button>
              ))}
              <button type="button"
                className={`drawer-badge-btn${!form.badge ? ' active' : ''}`}
                style={{ borderColor:'#9ca3af', color: !form.badge ? '#fff' : '#9ca3af', background: !form.badge ? '#9ca3af' : 'transparent' }}
                onClick={() => set('badge', '')}>
                Sem badge
              </button>
            </div>
          </div>

          {/* Detalhes técnicos */}
          <div className="drawer-section">
            <div className="drawer-section__title">🔬 Detalhes técnicos</div>
            <div className="drawer-row">
              <div className="drawer-field">
                <label>Material</label>
                <input placeholder="Ex: Ouro 18k" value={form.material}
                  onChange={e => set('material', e.target.value)} />
              </div>
              <div className="drawer-field">
                <label>{isCamiseta ? 'Estampa' : 'Pedra'}</label>
                <input placeholder={isCamiseta ? 'Ex: Serigrafia' : 'Ex: Zircônia'}
                  value={form.stone} onChange={e => set('stone', e.target.value)} />
              </div>
            </div>
            {isCamiseta && (
              <div className="drawer-field">
                <label>Tamanhos disponíveis</label>
                <div className="drawer-sizes">
                  {ALL_SIZES.map(s => (
                    <button key={s} type="button"
                      className={`drawer-size-btn${form.sizes.includes(s) ? ' active' : ''}`}
                      onClick={() => toggleSize(s)}>{s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="drawer__footer">
            <button type="button" className="dash-btn dash-btn--ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className={`dash-btn dash-btn--gold${saved ? ' saved' : ''}`}>
              {saved ? '✓ Salvo!' : editing ? 'Salvar alterações' : 'Criar produto'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

// ════════════════════════════════════════════════════════════
// MAIN DASH
// ════════════════════════════════════════════════════════════
export default function Dash() {
  const [authed, setAuthed]   = useState(() => sessionStorage.getItem(AUTH_KEY) === '1')
  const [tab, setTab]         = useState('overview')
  const [drawer, setDrawer]   = useState(null) // null | 'new' | product
  const [sideOpen, setSideOpen] = useState(false)

  const { products, categories, addProduct, updateProduct, deleteProduct } = useProducts()

  function logout() { sessionStorage.removeItem(AUTH_KEY); setAuthed(false) }

  function openEdit(p) {
    setDrawer({
      editing: true,
      id: p.id,
      initial: {
        ...EMPTY, ...p,
        price: String(p.price),
        originalPrice: p.originalPrice ? String(p.originalPrice) : '',
        sold: p.sold ? String(p.sold) : '',
        images: p.images?.length >= 2 ? p.images : [...(p.images||[p.image]),''],
        sizes: p.sizes || [],
      }
    })
  }
  function openNew() {
    setDrawer({ editing: false, id: null, initial: EMPTY })
  }
  function saveDrawer(data) {
    if (drawer.editing) updateProduct(drawer.id, data)
    else addProduct(data)
    setDrawer(null)
  }

  if (!authed) return <DashLogin onAuth={() => setAuthed(true)} />

  const navItems = [
    { id:'overview', icon:'📊', label:'Visão geral' },
    { id:'products', icon:'📦', label:'Produtos' },
  ]

  return (
    <div className="dash-layout">

      {/* ── Sidebar ── */}
      <aside className={`dash-side${sideOpen ? ' dash-side--open' : ''}`}>
        <div className="dash-side__logo">
          <img src="/logo.png" alt="Basic & Bijus" />
        </div>
        <nav className="dash-side__nav">
          {navItems.map(n => (
            <button key={n.id}
              className={`dash-nav-item${tab === n.id ? ' active' : ''}`}
              onClick={() => { setTab(n.id); setSideOpen(false) }}>
              <span className="dash-nav-item__icon">{n.icon}</span>
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="dash-side__footer">
          <Link to="/" className="dash-nav-item dash-nav-item--sm">
            <span>🛍️</span><span>Ver loja</span>
          </Link>
          <button className="dash-nav-item dash-nav-item--sm dash-nav-item--danger" onClick={logout}>
            <span>🚪</span><span>Sair</span>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="dash-main">

        {/* Top bar */}
        <header className="dash-topbar">
          <button className="dash-hamburger" onClick={() => setSideOpen(s => !s)}>
            ☰
          </button>
          <div className="dash-topbar__title">
            <h1>{navItems.find(n => n.id === tab)?.label}</h1>
            <span>{new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long' })}</span>
          </div>
          <div className="dash-topbar__actions">
            {tab === 'products' && (
              <button className="dash-btn dash-btn--gold dash-btn--sm" onClick={openNew}>
                + Novo produto
              </button>
            )}
            <button className="dash-avatar" onClick={logout} title="Sair">
              👤
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="dash-content">
          {tab === 'overview' && (
            <Overview products={products} onEdit={openEdit} onNew={openNew} />
          )}
          {tab === 'products' && (
            <Products
              products={products}
              categories={categories}
              onEdit={openEdit}
              onDelete={deleteProduct}
              onNew={openNew}
            />
          )}
        </div>
      </div>

      {/* ── Overlay sidebar mobile ── */}
      {sideOpen && <div className="dash-side-overlay" onClick={() => setSideOpen(false)} />}

      {/* ── Product Drawer ── */}
      {drawer && (
        <ProductDrawer
          editing={drawer.editing}
          initial={drawer.initial}
          categories={categories}
          onSave={saveDrawer}
          onClose={() => setDrawer(null)}
        />
      )}
    </div>
  )
}
