import { Link } from 'react-router-dom'

export default function ProductCard({ product }) {
  // determinístico — não muda a cada render
  const sold     = product.sold || ((product.id * 1337) % 8500) + 500
  const rating   = product.rating || +(4.2 + (product.id % 5) * 0.14).toFixed(1)
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0
  const installment  = (product.price / 3).toFixed(2).replace('.', ',')
  const freeShipping = product.price >= 299

  return (
    <Link to={`/produto/${product.id}`} className="product-card">

      {/* ── Imagem ── */}
      <div className="product-card__img-wrap">
        <img src={product.image} alt={product.name} loading="lazy" />

        {product.badge && (
          <span className="product-card__badge"
            style={{ background: product.badgeColor || '#c9a84c' }}>
            {product.badge}
          </span>
        )}

        {discount > 0 && (
          <span className="product-card__discount">-{discount}%</span>
        )}

        {freeShipping && (
          <span className="product-card__free-ship">🚚 Frete grátis</span>
        )}
      </div>

      {/* ── Info ── */}
      <div className="product-card__info">

        <p className="product-card__name">{product.name}</p>

        {/* Estrelas */}
        <div className="product-card__stars">
          {[1,2,3,4,5].map(i => (
            <span key={i} className={`pc-star${i <= Math.round(rating) ? ' pc-star--on' : ''}`}>★</span>
          ))}
          <span className="pc-rating">{rating}</span>
        </div>

        {/* Preço */}
        <div className="product-card__pricing">
          {discount > 0 && (
            <div className="product-card__original-row">
              <span className="product-card__original">
                R$ {product.originalPrice.toFixed(2).replace('.', ',')}
              </span>
              <span className="product-card__save">{discount}% OFF</span>
            </div>
          )}

          <div className="product-card__price-row">
            <span className="product-card__currency">R$</span>
            <span className="product-card__price">
              {Math.floor(product.price).toString()}
            </span>
            <span className="product-card__cents">
              ,{(product.price % 1).toFixed(2).slice(2)}
            </span>
          </div>

          <span className="product-card__installment">
            em 3× de R$ {installment} <em>sem juros</em>
          </span>
        </div>

        {/* Vendidos */}
        <div className="product-card__footer">
          <span className="product-card__sold">
            🔥&nbsp;
            {sold >= 1000
              ? `${(sold / 1000).toFixed(1).replace('.', ',')} mil`
              : sold}
            + vendidos
          </span>
          {freeShipping && (
            <span className="product-card__ship-badge">Frete grátis</span>
          )}
        </div>

      </div>
    </Link>
  )
}
