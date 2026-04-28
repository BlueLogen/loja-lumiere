import { Link } from 'react-router-dom'
import { products } from '../data/products'
import ProductCard from '../components/ProductCard'
import Banner from '../components/Banner'
import FlashSale from '../components/FlashSale'

const catIcons = [
  { id: 'camisetas', label: 'Camisetas', emoji: '👕' },
  { id: 'colares',   label: 'Colares',   emoji: '📿' },
  { id: 'brincos',  label: 'Brincos',   emoji: '💎' },
  { id: 'aneis',    label: 'Anéis',     emoji: '💍' },
  { id: 'pulseiras',label: 'Pulseiras', emoji: '✨' },
  { id: 'todos',    label: 'Ver tudo',  emoji: '🛍️' },
]

export default function Home() {
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
            <div className="cat-icon__circle">{c.emoji}</div>
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
          alt="Camisetas Lumière"
        />
        <div className="promo-banner__overlay" />
        <div className="promo-banner__content">
          <p className="promo-banner__eyebrow">Nova linha</p>
          <h3 className="promo-banner__title">Camisetas<br />Lumière</h3>
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
