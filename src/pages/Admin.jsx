import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProducts } from '../context/ProductsContext'
import { isAdminAuth } from './AdminLogin'

const EMPTY = {
  name: '',
  category: 'colares',
  price: '',
  originalPrice: '',
  image: '',
  images: ['', ''],
  description: '',
  badge: '',
  badgeColor: '#c9a84c',
  featured: false,
  material: '',
  stone: '',
  sizes: [],
  sold: '',
}

const BADGE_PRESETS = [
  { label: 'Promoção', color: '#c9a84c' },
  { label: 'Novo',     color: '#2d6a4f' },
  { label: 'Mais vendido', color: '#8b1a1a' },
  { label: 'Edição limitada', color: '#1a3a5c' },
  { label: 'Conjunto', color: '#5c3d1a' },
  { label: 'Kit',      color: '#5c3d1a' },
]

const ALL_SIZES = ['PP', 'P', 'M', 'G', 'GG', 'XGG']

export default function Admin() {
  const navigate = useNavigate()
  const { products, addProduct, updateProduct, deleteProduct, categories } = useProducts()

  const [view, setView]         = useState('list') // 'list' | 'form'
  const [editing, setEditing]   = useState(null)   // product id or null
  const [form, setForm]         = useState(EMPTY)
  const [filterCat, setFilterCat] = useState('todos')
  const [search, setSearch]     = useState('')
  const [saved, setSaved]       = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)
  const [imgPreview, setImgPreview] = useState('')

  useEffect(() => {
    if (!isAdminAuth()) navigate('/admin/login')
  }, [])

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
