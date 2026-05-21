import { Link } from 'react-router-dom'
import { useProducts } from '../context/ProductsContext'
import ProductCard from '../components/ProductCard'
import Banner from '../components/Banner'
import FlashSale from '../components/FlashSale'

// ── SVG icons ─────────────────────────────────────────────
const S = { fill:'none', strokeLinecap:'round', strokeLinejoin:'round', strokeWidth:'1.85' }

const IconShirt = () => (
  <svg viewBox="0 0 24 24" {...S} stroke="currentColor">
    <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/>
  </svg>
)

const IconNecklace = () => (
  <svg viewBox="0 0 24 24" {...S} stroke="currentColor">
    <path d="M7 4Q4.5 11 10.5 15"/>
    <path d="M17 4Q19.5 11 13.5 15"/>
    <path d="M10.5 15 L12 13 L13.5 15 L12 21 Z"/>
    <circle cx="12" cy="3.5" r="1.3" fill="currentColor" stroke="none"/>
  </svg>
)

const IconEarring = () => (
  <svg viewBox="0 0 24 24" {...S} stroke="currentColor">
    <circle cx="9" cy="5" r="1.5"/>
    <line x1="9" y1="6.5" x2="9" y2="10"/>
    <path d="M6 10 h6 l-1.2 6.5 a2 2 0 0 1-3.6 0 Z"/>
    <circle cx="16" cy="5" r="1.5"/>
    <line x1="16" y1="6.5" x2="16" y2="10"/>
    <path d="M13 10 h6 l-1.2 6.5 a2 2 0 0 1-3.6 0 Z"/>
  </svg>
)

const IconRing = () => (
  <svg viewBox="0 0 24 24" {...S} stroke="currentColor">
    <path d="M6 17 a6 4 0 0 1 12 0 a6 4 0 0 1-12 0"/>
    <path d="M9.5 17 L10.5 11 L12 8 L13.5 11 L14.5 17"/>
    <path d="M10.5 11 L12 9 L13.5 11"/>
  </svg>
)

const IconBracelet = () => (
  <svg viewBox="0 0 24 24" {...S} stroke="currentColor">
    <circle cx="12" cy="12" r="7"/>
    <circle cx="12" cy="5"  r="1.4" fill="currentColor" stroke="none"/>
    <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none"/>
    <circle cx="12" cy="19" r="1.4" fill="currentColor" stroke="none"/>
    <circle cx="5"  cy="12" r="1.4" fill="currentColor" stroke="none"/>
    <circle cx="16.9" cy="7.1"  r="1.1" fill="currentColor" stroke="none"/>
    <circle cx="16.9" cy="16.9" r="1.1" fill="currentColor" stroke="none"/>
    <circle cx="7.1"  cy="16.9" r="1.1" fill="currentColor" stroke="none"/>
    <circle cx="7.1"  cy="7.1"  r="1.1" fill="currentColor" stroke="none"/>
  </svg>
)

const IconShopBag = () => (
  <svg viewBox="0 0 24 24" {...S} stroke="currentColor">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
)

const catIcons = [
  { id:'camisetas', label:'Camisetas', Icon:IconShirt,    bg:'#fce7f3', border:'#f9a8d4', color:'#be185d' },
  { id:'colares',   label:'Colares',   Icon:IconNecklace, bg:'#fef9c3', border:'#fde047', color:'#a16207' },
  { id:'brincos',   label:'Brincos',   Icon:IconEarring,  bg:'#d1fae5', border:'#6ee7b7', color:'#065f46' },
  { id:'aneis',     label:'Anéis',     Icon:IconRing,     bg:'#ede9fe', border:'#c4b5fd', color:'#5b21b6' },
  { id:'pulseiras', label:'Pulseiras', Icon:IconBracelet, bg:'#dbeafe', border:'#93c5fd', color:'#1d4ed8' },
  { id:'todos',     label:'Ver tudo',  Icon:IconShopBag,  bg:'#e0e7ff', border:'#a5b4fc', color:'#1a3a6e' },
]

export default function Home() {
  const { products } = useProducts()
  const joias     = products.filter(p => p.category !== 'camisetas').slice(0, 4)
  const camisetas = products.filter(p => p.category === 'camisetas')
  const recomendados = products.slice(0)

  return (
    <main className="home">
      <Banner />

      {/* Categorias ícone */}
      <section className="cat-icons">
        {catIcons.map(c => (
          <Link key={c.id} to={c.id === 'todos' ? '/produtos' : `/produtos?cat=${c.id}`} className="cat-icon">
            <div className="cat-icon__circle" style={{ background: c.bg, borderColor: c.border, color: c.color }}>
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

      {/* Banner camisetas */}
      <Link to="/produtos?cat=camisetas" className="promo-banner">
        <img
          src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80"
          alt="Camisetas Basic & Bijus"
        />
        <div className="promo-banner__overlay" />
        <div className="promo-banner__content">
          <p className="promo-banner__eyebrow">Nova linha</p>
          <h3 className="promo-banner__title">Camisetas<br />Basic & Bijus</h3>
          <span className="promo-banner__cta">Ver coleção →</span>
        </div>
      </Link>

      {/* Camisetas */}
      <section className="home-section">
        <div className="home-section__header home-section__header--shirts">
          <strong>👕 CAMISETAS</strong>
          <Link to="/produtos?cat=camisetas" className="home-section__more">Ver mais &rsaquo;</Link>
        </div>
        <div className="products__grid">
          {camisetas.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* Garantias strip */}
      <div className="perks-strip">
        {[
          { icon: '🚚', text: 'Frete grátis +R$299' },
          { icon: '🛡️', text: 'Garantia 1 ano' },
          { icon: '↩️', text: 'Devolução 30 dias' },
          { icon: '💎', text: 'Certificado' },
        ].map(p => (
          <div key={p.text} className="perks-strip__item">
            <span>{p.icon}</span>
            <p>{p.text}</p>
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
