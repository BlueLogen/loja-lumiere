import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useProducts } from '../context/ProductsContext'
import { useCart } from '../context/CartContext'
import ProductCard from '../components/ProductCard'

export default function ProductDetail() {
  const { id } = useParams()
  const { products } = useProducts()
  const product = products.find(p => p.id === Number(id))
  const { addItem } = useCart()
  const [activeImg, setActiveImg] = useState(0)
  const [added, setAdded] = useState(false)
  const [selectedSize, setSelectedSize] = useState(null)

  if (!product) {
    return (
      <main className="not-found">
        <h1>Produto não encontrado</h1>
        <Link to="/produtos" className="btn btn--gold">Ver coleção</Link>
      </main>
    )
  }

  const related = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4)
  const sold = product.sold || 1200

  // Preço final = preço fixo do tamanho (se definido) OU preço base
  const finalPrice = (selectedSize && product.sizePrices?.[selectedSize] != null)
    ? product.sizePrices[selectedSize]
    : product.price

  function handleAdd() {
    if (product.sizes?.length && !selectedSize) {
      alert('Selecione um tamanho')
      return
    }
    addItem({ ...product, selectedSize, price: finalPrice })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <main className="detail-page">
      {/* Image gallery */}
      <div className="detail-gallery">
        <div className="detail-gallery__main">
          <img src={product.images[activeImg]} alt={product.name} />
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
        {product.images.length > 1 && (
          <div className="detail-gallery__thumbs">
            {product.images.map((img, i) => (
              <button
                key={i}
                className={`detail-thumb${activeImg === i ? ' active' : ''}`}
                onClick={() => setActiveImg(i)}
              >
                <img src={img} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="detail-info">
        <p className="detail-info__cat">{product.category}</p>
        <h1 className="detail-info__name">{product.name}</h1>

        <div className="detail-info__price-row">
          <span className="detail-info__price">
            R$ {finalPrice.toFixed(2).replace('.', ',')}
          </span>
          {product.originalPrice && (
            <span className="product-card__original">
              R$ {product.originalPrice.toFixed(2).replace('.', ',')}
            </span>
          )}
        </div>
        <p className="detail-info__installment">
          ou 3x de R$ {(finalPrice / 3).toFixed(2).replace('.', ',')} sem juros
        </p>
        <p className="detail-info__sold">{sold.toLocaleString()}+ vendidos</p>

        <div className="detail-info__specs">
          <div className="spec-row"><span>Material</span><strong>{product.material}</strong></div>
          <div className="spec-row"><span>Pedra</span><strong>{product.stone}</strong></div>
        </div>

        <p className="detail-info__desc">{product.description}</p>

        {product.sizes?.length > 0 && (
          <div className="size-selector">
            <p className="size-selector__label">
              Tamanho: {selectedSize
                ? <strong>{selectedSize}</strong>
                : <span className="size-selector__hint">selecione</span>
              }
            </p>
            <div className="size-selector__options">
              {product.sizes.map(s => {
                const sizePrice = product.sizePrices?.[s]
                return (
                  <button
                    key={s}
                    className={`size-btn${selectedSize === s ? ' active' : ''}`}
                    onClick={() => setSelectedSize(s)}
                  >
                    <span>{s}</span>
                    {sizePrice != null && (
                      <small className="size-btn__extra">
                        R${Number(sizePrice).toFixed(0)}
                      </small>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Botão de compra — visível só no desktop (mobile usa sticky bar) */}
        <button
          className={`btn btn--gold detail-info__add-btn${added ? ' btn--added' : ''}`}
          onClick={handleAdd}
        >
          {added ? '✓ Adicionado!' : '🛒 Adicionar ao carrinho'}
        </button>

        {/* Garantias desktop */}
        <div className="detail-info__perks">
          <span>🚚 Frete grátis acima de R$&nbsp;299</span>
          <span>🔒 Compra 100% segura</span>
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div className="detail-sticky">
        <div className="detail-sticky__price">
          <span>R$ {finalPrice.toFixed(2).replace('.', ',')}</span>
          <small>3x sem juros</small>
        </div>
        <button
          className={`btn btn--gold detail-sticky__btn${added ? ' btn--added' : ''}`}
          onClick={handleAdd}
        >
          {added ? '✓ Adicionado!' : 'Adicionar ao carrinho'}
        </button>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="home-section">
          <div className="home-section__header">
            <strong>VOCÊ TAMBÉM PODE GOSTAR</strong>
          </div>
          <div className="products__grid">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </main>
  )
}
