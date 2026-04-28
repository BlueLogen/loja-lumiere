import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const slides = [
  {
    id: 1,
    img: 'https://images.unsplash.com/photo-1601121141461-9d6647bef0a1?w=800&q=80',
    label: 'Nova Coleção 2025',
    cta: 'Ver Coleção',
    link: '/produtos',
    accent: '#c9a84c',
  },
  {
    id: 2,
    img: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80',
    label: 'Até 30% OFF em Colares',
    cta: 'Aproveitar',
    link: '/produtos?cat=colares',
    accent: '#e8d08a',
  },
  {
    id: 3,
    img: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=800&q=80',
    label: 'Frete grátis acima de R$ 299',
    cta: 'Comprar agora',
    link: '/produtos',
    accent: '#fff',
  },
]

export default function Banner() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setCurrent(c => (c + 1) % slides.length), 3500)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="banner-slider">
      <div className="banner-slider__track" style={{ transform: `translateX(-${current * 100}%)` }}>
        {slides.map(s => (
          <Link key={s.id} to={s.link} className="banner-slider__slide">
            <img src={s.img} alt={s.label} />
            <div className="banner-slider__overlay" />
            <div className="banner-slider__content">
              <p className="banner-slider__label">{s.label}</p>
              <span className="banner-slider__cta" style={{ borderColor: s.accent, color: s.accent }}>
                {s.cta} →
              </span>
            </div>
          </Link>
        ))}
      </div>
      <div className="banner-slider__dots">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`banner-slider__dot${current === i ? ' active' : ''}`}
            onClick={() => setCurrent(i)}
          />
        ))}
      </div>
    </div>
  )
}
