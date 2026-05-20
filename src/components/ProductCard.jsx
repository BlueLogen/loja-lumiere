import { Link } from 'react-router-dom'

export default function ProductCard({ product }) {
  const sold = product.sold || Math.floor(Math.random() * 9000 + 500)

  return (
    <Link to={`/produto/${product.id}`} className="product-card">
      <div className="product-card__img-wrap">
        <img src={product.image} alt={product.name} loading="lazy" />
        {product.badge && (
          <span className="product-card__badge" style={{ background: product.badgeColor }}>
            {product.badge}
          </span>
        )}
        {product.originalPrice && (
          <span className="product-card__discount">
            -{Math.round((1 - product.price / product.originalPrice) * 100)}%
          </span>
        )}
      </div>

      <div className="product-card__info">
        <p className="product-card__name">{product.name}</p>
        <div className="product-card__pricing">
          <span className="product-card__price">
            R$ {product.price.toFixed(2).replace('.', ',')}
          </span>
          {product.originalPrice && (
            <span className="product-card__original">
              R$ {product.originalPrice.toFixed(2).replace('.', ',')}
            </span>
          )}
        </div>
        <span className="product-card__sold">{(sold / 1000).toFixed(1)}mil+ vendidos</span>
      </div>
    </Link>
  )
}
