import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useProducts } from '../context/ProductsContext'

// Pega até 5 produtos com mais vendas (featured primeiro, depois por sold)
function pickHeroProducts(products) {
  if (!products?.length) return []
  const sorted = [...products].sort((a, b) => {
    if (a.featured && !b.featured) return -1
    if (!a.featured && b.featured) return 1
    return (b.sold || 0) - (a.sold || 0)
  })
  // Remove duplicatas por nome
  const seen = new Set()
  return sorted
    .filter(p => {
      const k = p.name.toLowerCase().trim()
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
    .slice(0, 5)
}

function fmt(price) {
  return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function Banner() {
  const { products } = useProducts()
  const slides = pickHeroProducts(products)

  const [current, setCurrent]   = useState(0)
  const [paused,  setPaused]    = useState(false)
  const [animDir, setAnimDir]   = useState(null) // 'left' | 'right'

  const total = slides.length

  const go = useCallback((idx) => {
    setAnimDir(idx > current ? 'left' : 'right')
    setCurrent(idx)
  }, [current])

  const prev = () => go(current === 0 ? total - 1 : current - 1)
  const next = useCallback(() => go((current + 1) % total), [current, total, go])

  useEffect(() => {
    if (paused || total < 2) return
    const t = setInterval(next, 4000)
    return () => clearInterval(t)
  }, [paused, next, total])

  if (!slides.length) {
    return (
      <div className="banner-slider banner-slider--empty">
        <div className="banner-slider__overlay" />
        <div className="banner-slider__content">
          <p className="banner-slider__label">Basic &amp; Bijus</p>
        </div>
      </div>
    )
  }

  const slide = slides[current]
  const discount = slide.originalPrice
    ? Math.round((1 - slide.price / slide.originalPrice) * 100)
    : null

  return (
    <div
      className="banner-slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Track — CSS transition on each slide */}
      <div className="banner-slider__track" style={{ transform: `translateX(-${current * 100}%)` }}>
        {slides.map((p, i) => (
          <Link key={p.id} to={`/produto/${p.id}`} className="banner-slider__slide">
            <img src={p.images?.[0] || p.image} alt={p.name} />
            <div className="banner-hero__gradient" />
            <div className="banner-hero__content">
              {p.badge && (
                <span
                  className="banner-hero__badge"
                  style={{ background: p.badgeColor || '#c9a84c' }}
                >
                  {p.badge}
                </span>
              )}
              <h2 className="banner-hero__name">{p.name}</h2>
              <div className="banner-hero__prices">
                {p.originalPrice && (
                  <s className="banner-hero__original">{fmt(p.originalPrice)}</s>
                )}
                <span className="banner-hero__price">{fmt(p.price)}</span>
                {discount && (
                  <span className="banner-hero__discount">-{discount}%</span>
                )}
              </div>
              <span className="banner-hero__cta">Ver produto →</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Setas */}
      {total > 1 && (
        <>
          <button
            className="banner-arrow banner-arrow--prev"
            onClick={e => { e.preventDefault(); prev() }}
            aria-label="Anterior"
          >‹</button>
          <button
            className="banner-arrow banner-arrow--next"
            onClick={e => { e.preventDefault(); next() }}
            aria-label="Próximo"
          >›</button>
        </>
      )}

      {/* Dots */}
      <div className="banner-slider__dots">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`banner-slider__dot${current === i ? ' active' : ''}`}
            onClick={() => go(i)}
          />
        ))}
      </div>
    </div>
  )
}
