import { Link } from 'react-router-dom'
import { useProducts } from '../context/ProductsContext'
import ProductCard from '../components/ProductCard'
import Banner from '../components/Banner'
import FlashSale from '../components/FlashSale'

// ── Emoji-style illustrated icons ─────────────────────────
const IconShirt = () => (
  <svg viewBox="0 0 32 32">
    <path d="M16 3c-1.8 0-3.3 1-4.2 2.4L5.5 3 1 8l4 3.2 1.5-1.2V29h19V10l1.5 1.2L30 8l-4.5-5-6.3 2.4C18.3 4 16.8 3 16 3z" fill="#fb7185"/>
    <path d="M16 3c-1.8 0-3.3 1-4.2 2.4a4.8 4.8 0 008.4 0C19.3 4 17.8 3 16 3z" fill="#e11d48"/>
    <rect x="7" y="15" width="18" height="1.5" rx=".75" fill="#fda4af" opacity=".6"/>
    <rect x="7" y="19" width="14" height="1.5" rx=".75" fill="#fda4af" opacity=".6"/>
    <rect x="7" y="23" width="10" height="1.5" rx=".75" fill="#fda4af" opacity=".6"/>
  </svg>
)

const IconNecklace = () => (
  <svg viewBox="0 0 32 32">
    <path d="M7 5Q4 13 12 18" stroke="#f59e0b" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
    <path d="M25 5Q28 13 20 18" stroke="#f59e0b" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
    <path d="M12 18L16 13.5l4 4.5-4 8z" fill="#fbbf24"/>
    <path d="M12 18L16 13.5l4 4.5" fill="#f59e0b"/>
    <circle cx="14" cy="16.5" r="1.2" fill="white" opacity=".8"/>
    <circle cx="16" cy="4" r="2" fill="#d97706"/>
    <circle cx="16" cy="4" r="1" fill="#fef3c7"/>
  </svg>
)

const IconEarring = () => (
  <svg viewBox="0 0 32 32">
    <circle cx="10" cy="6" r="2.5" fill="#34d399"/>
    <circle cx="10" cy="6" r="1.2" fill="#ecfdf5"/>
    <line x1="10" y1="8.5" x2="10" y2="13" stroke="#10b981" strokeWidth="2" strokeLinecap="round"/>
    <path d="M7 13h6l-2 9a1.8 1.8 0 01-2 0z" fill="#6ee7b7"/>
    <ellipse cx="10" cy="19" rx="2" ry="1.5" fill="#34d399" opacity=".6"/>
    <circle cx="22" cy="6" r="2.5" fill="#34d399"/>
    <circle cx="22" cy="6" r="1.2" fill="#ecfdf5"/>
    <line x1="22" y1="8.5" x2="22" y2="13" stroke="#10b981" strokeWidth="2" strokeLinecap="round"/>
    <path d="M19 13h6l-2 9a1.8 1.8 0 01-2 0z" fill="#6ee7b7"/>
    <ellipse cx="22" cy="19" rx="2" ry="1.5" fill="#34d399" opacity=".6"/>
  </svg>
)

const IconRing = () => (
  <svg viewBox="0 0 32 32">
    {/* Banda do anel — meia-lua grossa */}
    <path d="M7 21 Q7 29 16 29 Q25 29 25 21"
      stroke="#8b5cf6" strokeWidth="4.5" fill="none" strokeLinecap="round"/>
    {/* Brilho interno da banda */}
    <path d="M10 21 Q10 26 16 26 Q22 26 22 21"
      stroke="#ddd6fe" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
    {/* Hastes laterais subindo ao engaste */}
    <line x1="8.2" y1="21" x2="12.5" y2="13" stroke="#8b5cf6" strokeWidth="3.2" strokeLinecap="round"/>
    <line x1="23.8" y1="21" x2="19.5" y2="13" stroke="#8b5cf6" strokeWidth="3.2" strokeLinecap="round"/>
    {/* Diamante */}
    <path d="M12.5 13 L16 7.5 L19.5 13 L16 19 Z" fill="#a78bfa"/>
    {/* Faceta inferior */}
    <path d="M12.5 13 L16 16.5 L19.5 13" fill="#6d28d9" opacity=".7"/>
    {/* Linha central */}
    <line x1="16" y1="7.5" x2="16" y2="16.5" stroke="#c4b5fd" strokeWidth=".9" opacity=".6"/>
    {/* Brilho no diamante */}
    <circle cx="14" cy="9.5" r="1.3" fill="white" opacity=".85"/>
    {/* Estrelinhas douradas */}
    <line x1="22" y1="6.5" x2="22" y2="9.5" stroke="#fbbf24" strokeWidth="1.4" strokeLinecap="round"/>
    <line x1="20.5" y1="8" x2="23.5" y2="8" stroke="#fbbf24" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
)

const IconBracelet = () => (
  <svg viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="9" fill="none" stroke="#60a5fa" strokeWidth="3.5"/>
    <circle cx="16" cy="7"  r="2.8" fill="#3b82f6"/>
    <circle cx="25" cy="16" r="2.8" fill="#3b82f6"/>
    <circle cx="16" cy="25" r="2.8" fill="#3b82f6"/>
    <circle cx="7"  cy="16" r="2.8" fill="#3b82f6"/>
    <circle cx="22.4" cy="9.6"  r="2" fill="#93c5fd"/>
    <circle cx="22.4" cy="22.4" r="2" fill="#93c5fd"/>
    <circle cx="9.6"  cy="22.4" r="2" fill="#93c5fd"/>
    <circle cx="9.6"  cy="9.6"  r="2" fill="#93c5fd"/>
    <circle cx="16" cy="7" r="1.2" fill="white" opacity=".7"/>
  </svg>
)

const IconShopBag = () => (
  <svg viewBox="0 0 32 32">
    <rect x="4" y="11" width="24" height="18" rx="3.5" fill="#818cf8"/>
    <path d="M4 11l2.5-7h19l2.5 7z" fill="#6366f1"/>
    <path d="M12 15a4 4 0 008 0" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <rect x="13" y="20" width="6" height="5" rx="1.5" fill="white" opacity=".75"/>
    <circle cx="24" cy="8" r="2" fill="#fbbf24"/>
    <circle cx="8"  cy="8" r="2" fill="#fbbf24"/>
  </svg>
)

const catIcons = [
  { id:'pulseiras', label:'Pulseiras', Icon:IconBracelet, bg:'#eff6ff', border:'#bfdbfe' },
  { id:'colares',   label:'Colares',   Icon:IconNecklace, bg:'#fffbeb', border:'#fde68a' },
  { id:'brincos',   label:'Brincos',   Icon:IconEarring,  bg:'#ecfdf5', border:'#a7f3d0' },
  { id:'aneis',     label:'Anéis',     Icon:IconRing,     bg:'#f5f3ff', border:'#ddd6fe' },
  { id:'outros',    label:'Outros',    Icon:IconShopBag,  bg:'#f0fdf4', border:'#bbf7d0' },
  { id:'todos',     label:'Ver tudo',  Icon:IconShopBag,  bg:'#eef2ff', border:'#c7d2fe' },
]

// Remove duplicatas pelo nome (mesmo nome = mesmo produto)
function dedupe(arr) {
  const seen = new Set()
  return arr.filter(p => {
    const key = p.name.toLowerCase().trim()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// Ordena por mais vendidos primeiro
function bySold(arr) {
  return [...arr].sort((a, b) => (b.sold || 0) - (a.sold || 0))
}

export default function Home() {
  const { products } = useProducts()
  const allJoias     = dedupe(bySold(products.filter(p => p.category !== 'camisetas')))
  const joias        = allJoias.slice(0, 8)
  const recomendados = allJoias.slice(8, 16)

  return (
    <main className="home">
      <Banner />

      {/* Categorias ícone */}
      <section className="cat-icons">
        {catIcons.map(c => (
          <Link key={c.id} to={c.id === 'todos' ? '/produtos' : `/produtos?cat=${c.id}`} className="cat-icon">
            <div className="cat-icon__circle" style={{ background: c.bg, borderColor: c.border }}>
              <c.Icon />
            </div>
            <span>{c.label}</span>
          </Link>
        ))}
      </section>

      {/* Flash Sale */}
      <FlashSale />

      {/* Joias em destaque */}
      <section className="home-section">
        <div className="home-section__header">
          <strong>💎 JOIAS EM DESTAQUE</strong>
          <Link to="/produtos?cat=colares" className="home-section__more">Ver mais &rsaquo;</Link>
        </div>
        <div className="products__grid">
          {joias.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* Banners de categoria lado a lado */}
      <section className="promo-banners">
        <Link to="/produtos?cat=pulseiras" className="promo-banner">
          <img
            src="https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=900&q=90"
            alt="Pulseiras"
          />
          <div className="promo-banner__overlay" />
          <div className="promo-banner__content">
            <span className="promo-banner__tag">Coleção</span>
            <h3 className="promo-banner__title">Pulseiras</h3>
            <span className="promo-banner__btn">Ver coleção →</span>
          </div>
        </Link>
        <Link to="/produtos?cat=brincos" className="promo-banner">
          <img
            src="https://images.unsplash.com/photo-1630019852942-f89202989a59?w=900&q=90"
            alt="Brincos"
          />
          <div className="promo-banner__overlay" />
          <div className="promo-banner__content">
            <span className="promo-banner__tag">Destaque</span>
            <h3 className="promo-banner__title">Brincos</h3>
            <span className="promo-banner__btn">Ver coleção →</span>
          </div>
        </Link>
      </section>

      {/* Garantias strip */}
      <div className="perks-strip">
        {[
          { icon: '🎧', title: 'Atendimento de Qualidade', sub: 'suporte rápido para você',          bg: '#fee2e2', cls: 'perk--shield'  },
          { icon: '🚚', title: 'Envio Rápido e Seguro',   sub: 'entregamos para todo Brasil',       bg: '#dbeafe', cls: 'perk--truck'   },
          { icon: '🔒', title: 'Loja 100% Confiável',     sub: 'compra segura do início ao fim',    bg: '#f5f3ff', cls: 'perk--diamond' },
        ].map(p => (
          <div key={p.title} className="perks-strip__item">
            <div className="perks-strip__bubble" style={{ background: p.bg }}>
              <span className={p.cls}>{p.icon}</span>
            </div>
            <strong className="perks-strip__title">{p.title}</strong>
            <p>{p.sub}</p>
          </div>
        ))}
      </div>

      {/* Recomendado */}
      <section className="home-section">
        <div className="home-section__header">
          <strong>RECOMENDADO</strong>
          <Link to="/produtos" className="home-section__more">Ver Mais &rsaquo;</Link>
        </div>
        <div className="products__grid">
          {recomendados.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </main>
  )
}
